from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import requests
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request
from google.cloud import firestore
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger('ajn_pdf_billing')

RAZORPAY_API = 'https://api.razorpay.com/v1'
FIREBASE_PROJECT_ID = (os.getenv('FIREBASE_PROJECT_ID') or os.getenv('GOOGLE_CLOUD_PROJECT') or '').strip()
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', '').strip()
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '').strip()
RAZORPAY_WEBHOOK_SECRET = os.getenv('RAZORPAY_WEBHOOK_SECRET', '').strip()
BILLING_INTERNAL_TOKEN = os.getenv('AJN_BILLING_INTERNAL_TOKEN', '').strip()
PRODUCT_ID = 'ajn_pdf'

PLAN_CONFIG = {
    'premium_30d': {
        'days': 30,
        'amount': max(0, int(os.getenv('AJN_PREMIUM_30D_PAISE', '0') or 0)),
        'label': 'AJN PDF Premium · 30 days',
    },
    'premium_365d': {
        'days': 365,
        'amount': max(0, int(os.getenv('AJN_PREMIUM_365D_PAISE', '0') or 0)),
        'label': 'AJN PDF Premium · 365 days',
    },
}

_db: firestore.Client | None = None


class BillingOrderRequest(BaseModel):
    plan: str


class BillingVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _db_client() -> firestore.Client:
    global _db
    if _db is None:
        if not FIREBASE_PROJECT_ID:
            raise HTTPException(status_code=503, detail='Firebase billing storage is not configured.')
        _db = firestore.Client(project=FIREBASE_PROJECT_ID)
    return _db


def _billing_ready() -> bool:
    return bool(
        FIREBASE_PROJECT_ID
        and RAZORPAY_KEY_ID.startswith('rzp_')
        and RAZORPAY_KEY_SECRET
        and RAZORPAY_WEBHOOK_SECRET
        and BILLING_INTERNAL_TOKEN
        and any(int(plan['amount']) >= 100 for plan in PLAN_CONFIG.values())
    )


def _trusted_user(
    internal_token: str | None,
    uid: str | None,
    email: str | None,
) -> tuple[str, str]:
    if not BILLING_INTERNAL_TOKEN or not internal_token or not secrets.compare_digest(internal_token, BILLING_INTERNAL_TOKEN):
        raise HTTPException(status_code=401, detail='Trusted billing proxy authentication failed.')
    clean_uid = (uid or '').strip()
    clean_email = (email or '').strip().lower()
    if not clean_uid or len(clean_uid) > 128 or not clean_email or '@' not in clean_email:
        raise HTTPException(status_code=400, detail='Billing account identity is invalid.')
    return clean_uid, clean_email


def _plan(plan_id: str) -> dict[str, int | str]:
    plan = PLAN_CONFIG.get(plan_id)
    if not plan or int(plan['amount']) < 100:
        raise HTTPException(status_code=400, detail='This AJN PDF billing plan is not enabled.')
    return plan


def _razorpay(method: str, path: str, *, json_body: dict | None = None) -> dict:
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail='Razorpay is not configured.')
    try:
        response = requests.request(
            method,
            f'{RAZORPAY_API}{path}',
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            json=json_body,
            timeout=12,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail='Razorpay is temporarily unavailable.') from exc
    try:
        payload = response.json()
    except ValueError:
        payload = {}
    if response.status_code >= 400:
        description = str(payload.get('error', {}).get('description') or 'Razorpay request failed.')
        logger.warning('Razorpay API error %s: %s', response.status_code, description)
        raise HTTPException(status_code=502, detail='Payment provider rejected the request.')
    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail='Razorpay returned an invalid response.')
    return payload


def _safe_order_id(value: str) -> str:
    clean = (value or '').strip()
    if not clean.startswith('order_') or len(clean) > 80:
        raise HTTPException(status_code=400, detail='Invalid Razorpay order ID.')
    return clean


def _safe_payment_id(value: str) -> str:
    clean = (value or '').strip()
    if not clean.startswith('pay_') or len(clean) > 80:
        raise HTTPException(status_code=400, detail='Invalid Razorpay payment ID.')
    return clean


def _verify_checkout_signature(order_id: str, payment_id: str, signature: str) -> None:
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode('utf-8'),
        f'{order_id}|{payment_id}'.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    supplied = (signature or '').strip().lower()
    if len(supplied) != len(expected) or not hmac.compare_digest(expected, supplied):
        raise HTTPException(status_code=400, detail='Payment signature verification failed.')


def _verify_webhook_signature(raw: bytes, signature: str) -> None:
    if not RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail='Razorpay webhook is not configured.')
    expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode('utf-8'), raw, hashlib.sha256).hexdigest()
    supplied = (signature or '').strip().lower()
    if len(supplied) != len(expected) or not hmac.compare_digest(expected, supplied):
        raise HTTPException(status_code=400, detail='Webhook signature verification failed.')


def _payment_snapshot(order_id: str, payment_id: str, expected_amount: int) -> dict:
    payment = _razorpay('GET', f'/payments/{payment_id}')
    if str(payment.get('order_id') or '') != order_id:
        raise HTTPException(status_code=409, detail='Payment does not belong to this order.')
    if int(payment.get('amount') or 0) != expected_amount or str(payment.get('currency') or '') != 'INR':
        raise HTTPException(status_code=409, detail='Payment amount does not match the AJN PDF order.')
    if str(payment.get('status') or '') != 'captured':
        raise HTTPException(status_code=409, detail='Payment is genuine but is not captured yet. Please retry shortly.')
    return payment


def _active_subscription(uid: str) -> dict:
    snap = _db_client().collection('subscriptions').document(uid).get()
    if not snap.exists:
        return {'plan': 'free', 'status': 'inactive', 'valid_until': None}
    data = snap.to_dict() or {}
    valid_until = data.get('validUntil')
    if isinstance(valid_until, datetime) and valid_until > _now() and data.get('status') == 'active':
        return {
            'plan': str(data.get('plan') or 'premium'),
            'status': 'active',
            'valid_until': valid_until.isoformat(),
            'product': str(data.get('product') or PRODUCT_ID),
            'source': str(data.get('source') or 'razorpay'),
        }
    return {'plan': 'free', 'status': 'expired', 'valid_until': valid_until.isoformat() if isinstance(valid_until, datetime) else None}


def _fulfill_order(order_id: str, payment_id: str) -> dict:
    db = _db_client()
    order_ref = db.collection('billingOrders').document(order_id)
    transaction = db.transaction()

    @firestore.transactional
    def apply(transaction: firestore.Transaction) -> dict:
        order_snap = order_ref.get(transaction=transaction)
        if not order_snap.exists:
            raise HTTPException(status_code=404, detail='AJN PDF billing order was not found.')
        order = order_snap.to_dict() or {}
        uid = str(order.get('uid') or '')
        plan_id = str(order.get('plan') or '')
        plan = _plan(plan_id)
        sub_ref = db.collection('subscriptions').document(uid)
        sub_snap = sub_ref.get(transaction=transaction)
        existing = sub_snap.to_dict() if sub_snap.exists else {}
        existing = existing or {}

        if order.get('fulfilled') is True:
            valid_until = existing.get('validUntil')
            return {
                'plan': 'premium',
                'status': 'active',
                'valid_until': valid_until.isoformat() if isinstance(valid_until, datetime) else None,
                'idempotent': True,
            }

        now = _now()
        current_until = existing.get('validUntil')
        base = current_until if isinstance(current_until, datetime) and current_until > now else now
        valid_until = base + timedelta(days=int(plan['days']))

        transaction.set(
            sub_ref,
            {
                'plan': 'premium',
                'status': 'active',
                'product': PRODUCT_ID,
                'source': 'razorpay',
                'validUntil': valid_until,
                'updatedAt': now,
                'lastOrderId': order_id,
                'lastPaymentId': payment_id,
            },
            merge=True,
        )
        transaction.update(
            order_ref,
            {
                'status': 'paid',
                'fulfilled': True,
                'paymentId': payment_id,
                'paidAt': now,
                'validUntil': valid_until,
            },
        )
        return {'plan': 'premium', 'status': 'active', 'valid_until': valid_until.isoformat(), 'idempotent': False}

    return apply(transaction)


def _process_webhook_payment(order_id: str, payment_id: str) -> None:
    try:
        db = _db_client()
        order_snap = db.collection('billingOrders').document(order_id).get()
        if not order_snap.exists:
            logger.warning('Webhook ignored: unknown order %s', order_id)
            return
        order = order_snap.to_dict() or {}
        if order.get('fulfilled') is True:
            return
        _payment_snapshot(order_id, payment_id, int(order.get('amount') or 0))
        _fulfill_order(order_id, payment_id)
    except Exception:
        logger.exception('Razorpay webhook fulfillment failed for order %s', order_id)


@router.get('/api/billing/status')
def billing_status():
    return {
        'service': 'AJN PDF Billing',
        'provider': 'razorpay',
        'enabled': _billing_ready(),
        'product': PRODUCT_ID,
        'plans': [
            {'id': plan_id, 'days': int(plan['days']), 'amount': int(plan['amount']), 'currency': 'INR', 'enabled': int(plan['amount']) >= 100}
            for plan_id, plan in PLAN_CONFIG.items()
        ],
    }


@router.get('/api/billing/account')
def billing_account(
    x_ajn_internal_token: Annotated[str | None, Header(alias='X-AJN-Internal-Token')] = None,
    x_ajn_user_uid: Annotated[str | None, Header(alias='X-AJN-User-UID')] = None,
    x_ajn_user_email: Annotated[str | None, Header(alias='X-AJN-User-Email')] = None,
):
    uid, _ = _trusted_user(x_ajn_internal_token, x_ajn_user_uid, x_ajn_user_email)
    return _active_subscription(uid)


@router.post('/api/billing/order')
def create_billing_order(
    body: BillingOrderRequest,
    x_ajn_internal_token: Annotated[str | None, Header(alias='X-AJN-Internal-Token')] = None,
    x_ajn_user_uid: Annotated[str | None, Header(alias='X-AJN-User-UID')] = None,
    x_ajn_user_email: Annotated[str | None, Header(alias='X-AJN-User-Email')] = None,
):
    if not _billing_ready():
        raise HTTPException(status_code=503, detail='AJN PDF billing is not enabled.')
    uid, email = _trusted_user(x_ajn_internal_token, x_ajn_user_uid, x_ajn_user_email)
    plan = _plan(body.plan)
    receipt = f'ajnpdf-{uid[:8]}-{uuid.uuid4().hex[:12]}'[:40]
    razorpay_order = _razorpay(
        'POST',
        '/orders',
        json_body={
            'amount': int(plan['amount']),
            'currency': 'INR',
            'receipt': receipt,
            'notes': {'product': PRODUCT_ID, 'plan': body.plan, 'uid': uid[:16]},
        },
    )
    order_id = _safe_order_id(str(razorpay_order.get('id') or ''))
    _db_client().collection('billingOrders').document(order_id).set(
        {
            'provider': 'razorpay',
            'product': PRODUCT_ID,
            'uid': uid,
            'email': email,
            'plan': body.plan,
            'amount': int(plan['amount']),
            'currency': 'INR',
            'status': 'created',
            'fulfilled': False,
            'receipt': receipt,
            'createdAt': _now(),
        }
    )
    return {
        'key_id': RAZORPAY_KEY_ID,
        'order_id': order_id,
        'amount': int(plan['amount']),
        'currency': 'INR',
        'plan': body.plan,
        'label': str(plan['label']),
    }


@router.post('/api/billing/verify')
def verify_billing_payment(
    body: BillingVerifyRequest,
    x_ajn_internal_token: Annotated[str | None, Header(alias='X-AJN-Internal-Token')] = None,
    x_ajn_user_uid: Annotated[str | None, Header(alias='X-AJN-User-UID')] = None,
    x_ajn_user_email: Annotated[str | None, Header(alias='X-AJN-User-Email')] = None,
):
    uid, _ = _trusted_user(x_ajn_internal_token, x_ajn_user_uid, x_ajn_user_email)
    order_id = _safe_order_id(body.razorpay_order_id)
    payment_id = _safe_payment_id(body.razorpay_payment_id)
    order_snap = _db_client().collection('billingOrders').document(order_id).get()
    if not order_snap.exists:
        raise HTTPException(status_code=404, detail='AJN PDF billing order was not found.')
    order = order_snap.to_dict() or {}
    if str(order.get('uid') or '') != uid:
        raise HTTPException(status_code=403, detail='This payment does not belong to your AJN account.')
    _verify_checkout_signature(order_id, payment_id, body.razorpay_signature)
    _payment_snapshot(order_id, payment_id, int(order.get('amount') or 0))
    return _fulfill_order(order_id, payment_id)


@router.post('/api/billing/webhook')
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_razorpay_signature: Annotated[str | None, Header(alias='X-Razorpay-Signature')] = None,
):
    raw = await request.body()
    _verify_webhook_signature(raw, x_razorpay_signature or '')
    try:
        event = json.loads(raw.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail='Webhook body is invalid JSON.') from exc
    event_name = str(event.get('event') or '')
    if event_name not in {'payment.captured', 'order.paid'}:
        return {'ok': True, 'ignored': event_name}
    payment = (((event.get('payload') or {}).get('payment') or {}).get('entity') or {})
    order_id = str(payment.get('order_id') or '')
    payment_id = str(payment.get('id') or '')
    if order_id.startswith('order_') and payment_id.startswith('pay_'):
        background_tasks.add_task(_process_webhook_payment, order_id, payment_id)
    return {'ok': True}
