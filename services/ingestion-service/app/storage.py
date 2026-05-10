import base64
import binascii
import mimetypes
import os
import uuid
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import boto3
from dotenv import load_dotenv

load_dotenv()


class VultrObjectStorage:
    def __init__(self):
        self.endpoint = os.getenv("VULTR_OBJECT_STORAGE_ENDPOINT")
        self.bucket = os.getenv("VULTR_OBJECT_STORAGE_BUCKET")
        self.access_key = os.getenv("VULTR_OBJECT_STORAGE_ACCESS_KEY")
        self.secret_key = os.getenv("VULTR_OBJECT_STORAGE_SECRET_KEY")
        self.region = os.getenv("VULTR_OBJECT_STORAGE_REGION")
        self.public_base_url = os.getenv("VULTR_OBJECT_STORAGE_PUBLIC_BASE_URL")
        self._client = None

    def upload_image(self, image_reference: str) -> str:
        image_bytes, content_type, extension = self._read_image(image_reference)
        return self._upload_object(image_bytes, content_type, extension)

    def upload_file(self, image_bytes: bytes, content_type: str | None = None, filename: str | None = None) -> str:
        if not image_bytes:
            raise ValueError("Uploaded image is empty")

        resolved_content_type = content_type or self._guess_content_type(filename or "")
        extension = self._guess_extension(resolved_content_type, filename)

        return self._upload_object(image_bytes, resolved_content_type, extension)

    def _upload_object(self, image_bytes: bytes, content_type: str, extension: str) -> str:
        self._validate_content_type(content_type)
        object_key = f"road-incidents/{uuid.uuid4().hex}{extension}"

        self._get_client().put_object(
            Bucket=self._get_bucket(),
            Key=object_key,
            Body=image_bytes,
            ContentType=content_type,
        )

        return f"{self._get_public_base_url().rstrip('/')}/{object_key}"

    def _get_client(self):
        if self._client is None:
            if not self.endpoint or not self.access_key or not self.secret_key:
                raise RuntimeError(
                    "Vultr object storage is not fully configured. Set VULTR_OBJECT_STORAGE_ENDPOINT, "
                    "VULTR_OBJECT_STORAGE_ACCESS_KEY, and VULTR_OBJECT_STORAGE_SECRET_KEY."
                )

            self._client = boto3.client(
                "s3",
                endpoint_url=self.endpoint,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
            )

        return self._client

    def _get_bucket(self) -> str:
        if not self.bucket:
            raise RuntimeError(
                "Vultr object storage bucket is not configured. Set VULTR_OBJECT_STORAGE_BUCKET."
            )

        return self.bucket

    def _get_public_base_url(self) -> str:
        if self.public_base_url:
            return self.public_base_url

        if not self.endpoint:
            raise RuntimeError(
                "Vultr object storage public URL is not configured. Set "
                "VULTR_OBJECT_STORAGE_PUBLIC_BASE_URL or VULTR_OBJECT_STORAGE_ENDPOINT."
            )

        parsed_endpoint = urlparse(self.endpoint)
        scheme = parsed_endpoint.scheme or "https"
        host = parsed_endpoint.netloc or parsed_endpoint.path

        if not host:
            raise RuntimeError(
                "Unable to derive the Vultr object storage public URL from VULTR_OBJECT_STORAGE_ENDPOINT."
            )

        return f"{scheme}://{self._get_bucket()}.{host}"

    def _read_image(self, image_reference: str):
        if image_reference.startswith("data:"):
            return self._read_data_url(image_reference)

        if image_reference.startswith("http://") or image_reference.startswith("https://"):
            return self._read_remote_image(image_reference)

        raise ValueError("image_url must be a data URL or an http(s) URL")

    def _read_data_url(self, image_reference: str):
        try:
            header, encoded = image_reference.split(",", 1)
        except ValueError as exc:
            raise ValueError("image_url data URL is malformed") from exc

        if ";base64" not in header:
            raise ValueError("image_url data URL must be base64 encoded")

        content_type = header[5:].split(";", 1)[0] or "application/octet-stream"

        try:
            image_bytes = base64.b64decode(encoded, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("image_url contains invalid base64 data") from exc

        self._validate_content_type(content_type)

        return image_bytes, content_type, self._guess_extension(content_type)

    def _read_remote_image(self, image_reference: str):
        request = Request(image_reference, headers={"User-Agent": "ingestion-service/1.0"})

        try:
            with urlopen(request, timeout=15) as response:
                image_bytes = response.read()
                content_type = response.headers.get_content_type() or self._guess_content_type(image_reference)
        except Exception as exc:
            raise ValueError("Unable to download image_url") from exc

        self._validate_content_type(content_type)

        return image_bytes, content_type, self._guess_extension(content_type, image_reference)

    def _guess_content_type(self, image_reference: str) -> str:
        return mimetypes.guess_type(image_reference)[0] or "application/octet-stream"

    def _guess_extension(self, content_type: str, image_reference: str | None = None) -> str:
        if image_reference:
            parsed = urlparse(image_reference)
            extension = os.path.splitext(parsed.path)[1]
            if extension:
                return extension

        return mimetypes.guess_extension(content_type) or ".bin"

    def _validate_content_type(self, content_type: str):
        if not content_type.startswith("image/"):
            raise ValueError("Only image uploads are supported")


object_storage = VultrObjectStorage()
