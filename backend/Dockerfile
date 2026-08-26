FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOME=/home/ajn \
    TMPDIR=/tmp \
    SAL_USE_VCLPLUGIN=svp \
    AJN_ANALYTICS_DB=/tmp/ajn_analytics.sqlite3 \
    AJN_PUBLIC_MEDIA_DB=/tmp/ajn_public_media.sqlite3 \
    AJN_PUBLIC_MEDIA_ROOT=/tmp/public_media \
    AJN_PUBLIC_API_ENABLED=false \
    AJN_PUBLIC_API_RATE_PER_MINUTE=30 \
    XDG_RUNTIME_DIR=/tmp/runtime-ajn \
    QT_QPA_PLATFORM=offscreen \
    QT_QUICK_BACKEND=software \
    QTWEBENGINE_CHROMIUM_FLAGS="--disable-gpu --disable-dev-shm-usage" \
    DEBIAN_FRONTEND=noninteractive

# Keep the native document/image engines available for preserved backend
# processors while the public release exposes only accepted workflows.
# OCR/Tesseract packages are intentionally absent because recognition tools
# are retired from the current production catalog.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libreoffice-writer \
        libreoffice-calc \
        libreoffice-impress \
        calibre \
        imagemagick \
        poppler-utils \
        libcairo2 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        fonts-dejavu-core \
        fonts-liberation \
        fonts-noto-core \
        ca-certificates \
        curl \
    && command -v libreoffice \
    && command -v ebook-convert \
    && command -v pdftoppm \
    && libreoffice --headless --version \
    && ebook-convert --version \
    && pdftoppm -v \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && python -c "import fitz,pikepdf,docx,openpyxl,PIL,reportlab,ebooklib,cairosvg; from google.cloud import firestore; print('PASS: backend Python runtime imports')"

COPY app ./app
COPY public_backend_acceptance_test.py ./public_backend_acceptance_test.py
RUN python -m compileall -q app \
    && python -m py_compile public_backend_acceptance_test.py

RUN useradd --uid 10001 --user-group --create-home --home-dir /home/ajn --shell /usr/sbin/nologin ajn \
    && mkdir -p /tmp/public_media /tmp/ajn-work /tmp/runtime-ajn \
    && chown -R 10001:10001 /app /home/ajn /tmp/public_media /tmp/ajn-work /tmp/runtime-ajn \
    && chmod 700 /tmp/runtime-ajn

USER 10001

# Build the exact image only if the FastAPI application starts and the three
# public temporary-server workflows produce valid results end to end.
RUN set -eu; \
    python -c "from app.asgi import app; assert app.title == 'AJN PDF Conversion API'; print('PASS: FastAPI application import')"; \
    uvicorn app.asgi:app --host 127.0.0.1 --port 8000 --workers 1 --proxy-headers > /tmp/ajn-build-uvicorn.log 2>&1 & \
    server_pid=$!; \
    trap 'kill "$server_pid" 2>/dev/null || true' EXIT INT TERM; \
    attempt=0; \
    until curl --fail --silent http://127.0.0.1:8000/ready >/dev/null 2>&1; do \
        attempt=$((attempt + 1)); \
        if [ "$attempt" -ge 60 ]; then \
            echo 'AJN PDF build-time FastAPI server did not become ready.'; \
            cat /tmp/ajn-build-uvicorn.log; \
            exit 1; \
        fi; \
        sleep 1; \
    done; \
    python public_backend_acceptance_test.py; \
    kill "$server_pid" 2>/dev/null || true; \
    wait "$server_pid" 2>/dev/null || true; \
    trap - EXIT INT TERM

CMD ["sh", "-c", "uvicorn app.asgi:app --host 0.0.0.0 --port ${PORT} --workers 1 --proxy-headers"]
