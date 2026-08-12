"""Async MongoDB connection using motor."""
import motor.motor_asyncio
from app.core.config import settings

_client: motor.motor_asyncio.AsyncIOMotorClient | None = None
db = None


async def connect_db():
    global _client, db
    _client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
    db = _client[settings.DB_NAME]


async def disconnect_db():
    global _client
    if _client:
        _client.close()


def get_db():
    return db
