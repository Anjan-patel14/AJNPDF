from __future__ import annotations
import hashlib
import io
import json
import os
import re
import secrets
import sqlite3
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated
from fastapi import APIRouter, File, Form, Header, HTTPException, Query, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
Image.MAX_IMAGE_PIXELS = 100000000
MEDIA_ROOT = Path(os.getenv('AJN_PUBLIC_MEDIA_ROOT', str(Path(__file__).resolve().parents[1] / 'public_media')))
MEDIA_DB = Path(os.getenv('AJN_PUBLIC_MEDIA_DB', str(Path(__file__).resolve().parents[1] / 'ajn_public_media.sqlite3')))
ADMIN_TOKEN = os.getenv('AJN_MEDIA_ADMIN_TOKEN', os.getenv('AJN_ADMIN_TOKEN', '')).strip()
MAX_IMAGE_BYTES = max(1, min(30, int(os.getenv('AJN_PUBLIC_IMAGE_MAX_MB', '12')))) * 1024 * 1024
MAX_IMAGE_PIXELS = max(10000000, min(100000000, int(os.getenv('AJN_PUBLIC_IMAGE_MAX_PIXELS', '50000000'))))
ALLOWED_MIME = {'image/jpeg', 'image/png', 'image/webp'}
router = APIRouter()

def _columns(db: sqlite3.Connection) -> set[str]:
    return {row[1] for row in db.execute('PRAGMA table_info(public_posts)').fetchall()}

def init_media_store() -> None:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    MEDIA_DB.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(MEDIA_DB) as db:
        db.execute("CREATE TABLE IF NOT EXISTS public_posts ( id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, caption TEXT NOT NULL, alt_text TEXT NOT NULL, tags_json TEXT NOT NULL DEFAULT '[]', image_filename TEXT NOT NULL, thumbnail_filename TEXT NOT NULL, image_hash TEXT, width INTEGER NOT NULL, height INTEGER NOT NULL, published INTEGER NOT NULL DEFAULT 1, scheduled_at TEXT, published_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP )")
        cols = _columns(db)
        for name, ddl in [('image_hash', 'TEXT'), ('scheduled_at', 'TEXT')]:
            if name not in cols:
                db.execute(f'ALTER TABLE public_posts ADD COLUMN{name}{ddl}')
        db.execute('CREATE INDEX IF NOT EXISTS idx_public_posts_published ON public_posts(published, published_at DESC)')
        db.execute('CREATE INDEX IF NOT EXISTS idx_public_posts_hash ON public_posts(image_hash)')
        db.commit()

def _require_admin(token: str | None) -> None:
    if not ADMIN_TOKEN or not secrets.compare_digest(token or '', ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail='A valid media admin token is required.')

def _slugify(value: str) -> str:
    normalized = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii').lower()
    slug = re.sub('[^a-z0-9]+', '-', normalized).strip('-')[:72]
    return slug or f'ajn-image-{secrets.token_hex(4)}'

def _clean_text(value: str, minimum: int, maximum: int, label: str) -> str:
    cleaned = re.sub('\\s+', '', value).strip()
    if len(cleaned) < minimum:
        raise HTTPException(status_code=400, detail=f'{label}is too short.')
    return cleaned[:maximum]

def _clean_tags(value: str) -> list[str]:
    tags = []
    for part in value.split(','):
        tag = re.sub('\\s+', '', part).strip()[:40]
        if tag and tag.lower() not in {item.lower() for item in tags}:
            tags.append(tag)
        if len(tags) >= 12:
            break
    return tags

def _clean_schedule(value: str) -> str | None:
    cleaned = value.strip()
    if not cleaned:
        return None
    try:
        parsed = datetime.fromisoformat(cleaned.replace('Z', '+00:00'))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='The scheduled publication time is invalid.') from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    parsed = parsed.astimezone(timezone.utc)
    if parsed <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail='The scheduled publication time must be in the future.')
    return parsed.isoformat().replace('+00:00', 'Z')

def _row_to_post(row: sqlite3.Row) -> dict[str, object]:
    keys = set(row.keys())
    return {'id': row['id'], 'slug': row['slug'], 'title': row['title'], 'caption': row['caption'], 'alt_text': row['alt_text'], 'tags': json.loads(row['tags_json'] or '[]'), 'image_url': f"/media/{row['image_filename']}", 'thumbnail_url': f"/media/{row['thumbnail_filename']}", 'width': row['width'], 'height': row['height'], 'published': bool(row['published']), 'scheduled_at': row['scheduled_at'] if 'scheduled_at' in keys else None, 'published_at': row['published_at'], 'updated_at': row['updated_at'], 'source': 'admin'}

def _open_and_validate(data: bytes) -> Image.Image:
    if not data:
        raise HTTPException(status_code=400, detail='The uploaded image is empty.')
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail='The uploaded image exceeds the configured size limit.')
    try:
        image = Image.open(io.BytesIO(data))
        image.verify()
        image = Image.open(io.BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=415, detail='The uploaded file is not a readable JPEG, PNG or WebP image.') from exc
    if image.width * image.height > MAX_IMAGE_PIXELS:
        raise HTTPException(status_code=413, detail='The image dimensions are too large to process safely.')
    return ImageOps.exif_transpose(image).convert('RGB')

def _save_image(source: Image.Image, slug: str) -> tuple[str, str, int, int, str]:
    image_filename = f'{slug}-{secrets.token_hex(4)}.webp'
    thumbnail_filename = f'{slug}-{secrets.token_hex(4)}-thumb.webp'
    image_path = MEDIA_ROOT / image_filename
    thumb_path = MEDIA_ROOT / thumbnail_filename
    full = source.copy()
    full.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
    full.save(image_path, 'WEBP', quality=88, method=6, exif=b'')
    thumb = ImageOps.fit(source, (640, 640), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    thumb.save(thumb_path, 'WEBP', quality=84, method=6, exif=b'')
    width, height = full.size
    full.close()
    thumb.close()
    digest = hashlib.sha256(image_path.read_bytes()).hexdigest()
    return (image_filename, thumbnail_filename, width, height, digest)

def _public_time_filter() -> str:
    return "published=1 AND (scheduled_at IS NULL OR scheduled_at='' OR datetime(scheduled_at) <= datetime('now'))"

@router.get('/api/public/posts')
def public_posts(limit: Annotated[int, Query(ge=1, le=100)]=24, offset: Annotated[int, Query(ge=0, le=10000)]=0):
    with sqlite3.connect(MEDIA_DB) as db:
        db.row_factory = sqlite3.Row
        rows = db.execute(f'SELECT * FROM public_posts WHERE{_public_time_filter()}ORDER BY published_at DESC,id DESC LIMIT ? OFFSET ?', (limit, offset)).fetchall()
        total = db.execute(f'SELECT COUNT(*) FROM public_posts WHERE{_public_time_filter()}').fetchone()[0]
    return {'posts': [_row_to_post(row) for row in rows], 'total': total, 'offset': offset, 'limit': limit}

@router.get('/api/public/posts/{slug}')
def public_post(slug: str):
    with sqlite3.connect(MEDIA_DB) as db:
        db.row_factory = sqlite3.Row
        row = db.execute(f'SELECT * FROM public_posts WHERE slug=? AND{_public_time_filter()}', (slug[:100],)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail='The public image post was not found.')
    return _row_to_post(row)

@router.get('/api/admin/posts')
def admin_posts(x_ajn_admin_token: Annotated[str | None, Header()]=None):
    _require_admin(x_ajn_admin_token)
    with sqlite3.connect(MEDIA_DB) as db:
        db.row_factory = sqlite3.Row
        rows = db.execute('SELECT * FROM public_posts ORDER BY updated_at DESC,id DESC LIMIT 500').fetchall()
    return {'posts': [_row_to_post(row) for row in rows]}

@router.post('/api/admin/posts', status_code=201)
async def create_post(image: Annotated[UploadFile, File(...)], title: Annotated[str, Form(min_length=5, max_length=120)], caption: Annotated[str, Form(min_length=60, max_length=1200)], alt_text: Annotated[str, Form(min_length=10, max_length=220)], tags: Annotated[str, Form(max_length=240)]='', published: Annotated[bool, Form()]=True, scheduled_at: Annotated[str, Form(max_length=40)]='', rights_confirmed: Annotated[bool, Form()]=False, x_ajn_admin_token: Annotated[str | None, Header()]=None):
    _require_admin(x_ajn_admin_token)
    if not rights_confirmed:
        raise HTTPException(status_code=400, detail='Confirm that AJN owns the image or has permission to publish it.')
    if image.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail='Only JPEG, PNG and WebP images are accepted.')
    data = await image.read(MAX_IMAGE_BYTES + 1)
    source = _open_and_validate(data)
    clean_title = _clean_text(title, 5, 120, 'Title')
    clean_caption = _clean_text(caption, 60, 1200, 'Caption')
    clean_alt = _clean_text(alt_text, 10, 220, 'Alt text')
    clean_tags = _clean_tags(tags)
    base_slug = _slugify(clean_title)
    source_hash = hashlib.sha256(data).hexdigest()
    with sqlite3.connect(MEDIA_DB) as db:
        if db.execute('SELECT 1 FROM public_posts WHERE image_hash=?', (source_hash,)).fetchone():
            raise HTTPException(status_code=409, detail='This image has already been published or saved as a draft.')
        existing = db.execute('SELECT 1 FROM public_posts WHERE slug=?', (base_slug,)).fetchone()
        slug = base_slug if not existing else f'{base_slug}-{secrets.token_hex(3)}'
    image_filename, thumbnail_filename, width, height, optimized_hash = _save_image(source, slug)
    source.close()
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    schedule = _clean_schedule(scheduled_at)
    publication_time = schedule if published and schedule else now
    try:
        with sqlite3.connect(MEDIA_DB) as db:
            cur = db.execute('INSERT INTO public_posts(slug,title,caption,alt_text,tags_json,image_filename,thumbnail_filename,image_hash,width,height,published,scheduled_at,published_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', (slug, clean_title, clean_caption, clean_alt, json.dumps(clean_tags, ensure_ascii=False), image_filename, thumbnail_filename, source_hash or optimized_hash, width, height, 1 if published else 0, schedule, publication_time, now))
            db.commit()
            post_id = cur.lastrowid
            db.row_factory = sqlite3.Row
            row = db.execute('SELECT * FROM public_posts WHERE id=?', (post_id,)).fetchone()
    except Exception:
        (MEDIA_ROOT / image_filename).unlink(missing_ok=True)
        (MEDIA_ROOT / thumbnail_filename).unlink(missing_ok=True)
        raise
    return _row_to_post(row)

@router.patch('/api/admin/posts/{post_id}')
def update_post(post_id: int, title: Annotated[str, Form(min_length=5, max_length=120)], caption: Annotated[str, Form(min_length=60, max_length=1200)], alt_text: Annotated[str, Form(min_length=10, max_length=220)], tags: Annotated[str, Form(max_length=240)]='', published: Annotated[bool, Form()]=True, scheduled_at: Annotated[str, Form(max_length=40)]='', x_ajn_admin_token: Annotated[str | None, Header()]=None):
    _require_admin(x_ajn_admin_token)
    clean_title = _clean_text(title, 5, 120, 'Title')
    clean_caption = _clean_text(caption, 60, 1200, 'Caption')
    clean_alt = _clean_text(alt_text, 10, 220, 'Alt text')
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    schedule = _clean_schedule(scheduled_at)
    with sqlite3.connect(MEDIA_DB) as db:
        db.row_factory = sqlite3.Row
        existing = db.execute('SELECT * FROM public_posts WHERE id=?', (post_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail='The public image post was not found.')
        publication_time = schedule if published and schedule else existing['published_at'] if bool(existing['published']) and published else now
        db.execute('UPDATE public_posts SET title=?,caption=?,alt_text=?,tags_json=?,published=?,scheduled_at=?,published_at=?,updated_at=? WHERE id=?', (clean_title, clean_caption, clean_alt, json.dumps(_clean_tags(tags), ensure_ascii=False), 1 if published else 0, schedule, publication_time, now, post_id))
        db.commit()
        row = db.execute('SELECT * FROM public_posts WHERE id=?', (post_id,)).fetchone()
    return _row_to_post(row)

@router.delete('/api/admin/posts/{post_id}')
def delete_post(post_id: int, x_ajn_admin_token: Annotated[str | None, Header()]=None, x_ajn_confirm_title: Annotated[str | None, Header()]=None):
    _require_admin(x_ajn_admin_token)
    with sqlite3.connect(MEDIA_DB) as db:
        db.row_factory = sqlite3.Row
        row = db.execute('SELECT * FROM public_posts WHERE id=?', (post_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail='The public image post was not found.')
        if not secrets.compare_digest((x_ajn_confirm_title or '').strip(), str(row['title'])):
            raise HTTPException(status_code=400, detail='Type the exact post title to confirm permanent deletion.')
        db.execute('DELETE FROM public_posts WHERE id=?', (post_id,))
        db.commit()
    (MEDIA_ROOT / row['image_filename']).unlink(missing_ok=True)
    (MEDIA_ROOT / row['thumbnail_filename']).unlink(missing_ok=True)
    return {'deleted': True, 'id': post_id}
from .platform_routes import router as platform_router
router.include_router(platform_router)
