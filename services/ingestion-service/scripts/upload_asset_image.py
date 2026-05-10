import sys
from pathlib import Path


def main():
    project_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(project_root))

    from app.storage import object_storage

    image_path = project_root / "assets" / "loco.jpg"

    if not image_path.exists():
        raise FileNotFoundError(f"Asset image not found: {image_path}")

    image_bytes = image_path.read_bytes()
    uploaded_url = object_storage.upload_file(
        image_bytes,
        content_type="image/jpeg",
        filename=image_path.name,
    )

    print(f"Uploaded {image_path.name} to {uploaded_url}")


if __name__ == "__main__":
    main()
