import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.db import set_db


@pytest.fixture(autouse=True)
def mock_sheets(monkeypatch):
    """Mocks Google Sheets webhook sync so unit tests run instantly in-memory without network calls."""
    async def noop_sync(*args, **kwargs):
        pass

    monkeypatch.setattr("app.sheets.sync_sheet", noop_sync)
    monkeypatch.setattr("app.routers.parties.sync_sheet", noop_sync)
    monkeypatch.setattr("app.routers.loads.sync_sheet", noop_sync)
    monkeypatch.setattr("app.routers.payments.sync_sheet", noop_sync)
    monkeypatch.setattr("app.routers.employees.sync_sheet", noop_sync)
    monkeypatch.setattr("app.routers.expenses.sync_sheet", noop_sync)
    monkeypatch.setattr("app.routers.common.sync_sheet", noop_sync)


@pytest_asyncio.fixture
async def mock_db():
    client = AsyncMongoMockClient()
    db = client["weighbridge_test"]
    set_db(db)
    yield db


@pytest_asyncio.fixture
async def client(mock_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
