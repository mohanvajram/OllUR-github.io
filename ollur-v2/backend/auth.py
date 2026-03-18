import hashlib
import hmac
import json
import base64
import time

SECRET = "ollur-super-secret-key-2024"

def hash_password(password: str) -> str:
    return hashlib.sha256((password + SECRET).encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_token(payload: dict, expires_in: int = 86400 * 7) -> str:
    payload = {**payload, "exp": int(time.time()) + expires_in}
    data = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    sig = hmac.new(SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()
    return f"{data}.{sig}"

def decode_token(token: str):
    try:
        data, sig = token.rsplit(".", 1)
        expected = hmac.new(SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(data + "==").decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None
