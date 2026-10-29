import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/weighbridge")

_client = None
_db = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client


def get_db():
    global _db
    if _db is None:
        client = get_client()
        # Extract database name from URI if present, otherwise default to "weighbridge"
        db_name = "weighbridge"
        try:
            from urllib.parse import urlparse
            parsed = urlparse(MONGODB_URI)
            if parsed.path and len(parsed.path) > 1:
                db_name = parsed.path.lstrip("/").split("?")[0]
        except Exception:
            pass
        _db = client[db_name]
    return _db


def set_db(mock_db):
    """Allows overriding the database in tests (e.g. with mongomock-motor)."""
    global _db
    _db = mock_db
