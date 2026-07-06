import os
import time

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days
SESSION_COOKIE_NAME = "admin_session"


def check_password(password: str, expected: str | None = None) -> bool:
    expected = expected if expected is not None else os.getenv("ADMIN_PASSWORD", "")
    return bool(expected) and password == expected


def create_session_token(secret: str = SECRET_KEY) -> str:
    return URLSafeTimedSerializer(secret).dumps({"admin": True})


def verify_session_token(
    token: str | None, secret: str = SECRET_KEY, max_age: int = SESSION_MAX_AGE
) -> bool:
    if not token:
        return False
    if max_age == 0:
        return False
    try:
        serializer = URLSafeTimedSerializer(secret)
        data, timestamp_dt = serializer.loads(token, return_timestamp=True)
        timestamp = timestamp_dt.timestamp()
        if time.time() - timestamp > max_age:
            return False
    except (BadSignature, SignatureExpired):
        return False
    return data.get("admin") is True
