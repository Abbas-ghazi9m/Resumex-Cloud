import hashlib
import hmac
import base64
import json
import time
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Generate secure salted PBKDF2 hash"""
    salt = "resumex_cloud_salt_2026_secure"
    derived = hashlib.pbkdf2_hmac(
        "sha256", 
        password.encode("utf-8"), 
        salt.encode("utf-8"), 
        iterations=100000
    )
    return derived.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against salted PBKDF2 hash"""
    computed = hash_password(plain_password)
    return hmac.compare_digest(computed, hashed_password)

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    """Create standard signed JWT token"""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    now = int(time.time())
    expire = now + (expires_delta if expires_delta else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    payload.update({"iat": now, "exp": expire})
    
    encoded_header = base64url_encode(json.dumps(header).encode("utf-8"))
    encoded_payload = base64url_encode(json.dumps(payload).encode("utf-8"))
    
    to_sign = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), to_sign, hashlib.sha256).digest()
    encoded_signature = base64url_encode(signature)
    
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode JWT token"""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        
        encoded_header, encoded_payload, encoded_signature = parts
        to_sign = f"{encoded_header}.{encoded_payload}".encode("utf-8")
        expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), to_sign, hashlib.sha256).digest()
        
        if not hmac.compare_digest(base64url_encode(expected_sig), encoded_signature):
            return None
            
        payload = json.loads(base64url_decode(encoded_payload).decode("utf-8"))
        if payload.get("exp") and payload["exp"] < int(time.time()):
            return None  # expired
            
        return payload
    except Exception:
        return None
