import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, BinaryIO
import hmac
import hashlib
import time
from app.core.config import settings

class StorageProvider(ABC):
    @abstractmethod
    def upload(self, file_obj: BinaryIO, filename: str, content_type: str = "application/octet-stream") -> str:
        """Uploads a file and returns the storage reference path/key"""
        pass

    @abstractmethod
    def download(self, storage_path: str) -> bytes:
        """Downloads file content as bytes"""
        pass

    @abstractmethod
    def delete(self, storage_path: str) -> bool:
        """Deletes file from storage"""
        pass

    @abstractmethod
    def get_signed_url(self, storage_path: str, expires_in_seconds: int = 3600) -> str:
        """Generates a secure signed URL for temporal download"""
        pass

class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or settings.LOCAL_STORAGE_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def upload(self, file_obj: BinaryIO, filename: str, content_type: str = "application/octet-stream") -> str:
        # Sanitize filename and prevent path traversal
        clean_name = Path(filename).name
        target_path = self.base_dir / clean_name
        
        # Write binary content
        with open(target_path, "wb") as f:
            shutil.copyfileobj(file_obj, f)
            
        return clean_name

    def download(self, storage_path: str) -> bytes:
        clean_name = Path(storage_path).name
        file_path = self.base_dir / clean_name
        if not file_path.exists():
            raise FileNotFoundError(f"Storage object not found: {storage_path}")
        return file_path.read_bytes()

    def delete(self, storage_path: str) -> bool:
        clean_name = Path(storage_path).name
        file_path = self.base_dir / clean_name
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def get_signed_url(self, storage_path: str, expires_in_seconds: int = 3600) -> str:
        clean_name = Path(storage_path).name
        expiry = int(time.time()) + expires_in_seconds
        token_src = f"{clean_name}:{expiry}:{settings.SECRET_KEY}"
        sig = hmac.new(settings.SECRET_KEY.encode(), token_src.encode(), hashlib.sha256).hexdigest()
        return f"/api/resumes/download/{clean_name}?expires={expiry}&signature={sig}"

    def verify_signed_url(self, clean_name: str, expiry: int, signature: str) -> bool:
        if int(time.time()) > expiry:
            return False
        token_src = f"{clean_name}:{expiry}:{settings.SECRET_KEY}"
        expected_sig = hmac.new(settings.SECRET_KEY.encode(), token_src.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_sig, signature)

class S3StorageProvider(StorageProvider):
    """Production Cloud Storage Provider (AWS S3, Cloudflare R2, MinIO, Supabase Storage)"""
    def __init__(self):
        try:
            import boto3
            from botocore.config import Config
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT if settings.S3_ENDPOINT else None,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION,
                config=Config(signature_version="s3v4")
            )
            self.bucket = settings.S3_BUCKET
        except Exception:
            self.s3_client = None
            self.bucket = "mock-vault"

    def upload(self, file_obj: BinaryIO, filename: str, content_type: str = "application/octet-stream") -> str:
        if not self.s3_client:
            raise RuntimeError("S3 client not initialized. Check S3 credentials.")
        clean_key = Path(filename).name
        self.s3_client.upload_fileobj(
            file_obj, 
            self.bucket, 
            clean_key,
            ExtraArgs={"ContentType": content_type}
        )
        return clean_key

    def download(self, storage_path: str) -> bytes:
        if not self.s3_client:
            raise RuntimeError("S3 client not initialized")
        clean_key = Path(storage_path).name
        response = self.s3_client.get_object(Bucket=self.bucket, Key=clean_key)
        return response["Body"].read()

    def delete(self, storage_path: str) -> bool:
        if not self.s3_client:
            return False
        clean_key = Path(storage_path).name
        self.s3_client.delete_object(Bucket=self.bucket, Key=clean_key)
        return True

    def get_signed_url(self, storage_path: str, expires_in_seconds: int = 3600) -> str:
        if not self.s3_client:
            return f"/api/mock-s3-download/{storage_path}"
        clean_key = Path(storage_path).name
        return self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": clean_key},
            ExpiresIn=expires_in_seconds
        )

# Factory function
def get_storage_provider() -> StorageProvider:
    if settings.STORAGE_PROVIDER.lower() == "s3" and settings.S3_ACCESS_KEY:
        return S3StorageProvider()
    return LocalStorageProvider()
