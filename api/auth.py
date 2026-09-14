"""
Minimal auth: PBKDF2 password hashing + a signed, expiring session token.

Deliberately dependency-free (uses only hashlib/hmac/base64/json from the
standard library) rather than pulling in passlib/PyJWT — this backend is
small enough that a hand-rolled version is easier to audit than it is to
justify a new dependency for.
"""

import base64
import hashlib
import hmac
import json
import os
import time

SECRET = os.environ.get("AUTH_SECRET", "dev-secret-change-me-in-production")
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split("$")
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    expected = bytes.fromhex(digest_hex)
    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return hmac.compare_digest(expected, actual)


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_token(user_id: str) -> str:
    payload = json.dumps({"sub": user_id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}).encode()
    payload_b64 = _b64encode(payload)
    signature = hmac.new(SECRET.encode(), payload_b64.encode(), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64encode(signature)}"


def verify_token(token: str) -> str | None:
    """Returns the user_id if the token is valid and unexpired, else None."""
    try:
        payload_b64, sig_b64 = token.split(".")
        expected_sig = hmac.new(SECRET.encode(), payload_b64.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected_sig, _b64decode(sig_b64)):
            return None
        payload = json.loads(_b64decode(payload_b64))
        if payload["exp"] < time.time():
            return None
        return payload["sub"]
    except Exception:
        return None
