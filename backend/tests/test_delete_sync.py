import pytest
from unittest.mock import patch


@pytest.mark.asyncio
async def test_delete_sync(client, mock_db):
    # 1. Create party & load
    p_res = await client.post("/api/parties", json={"name": "Delete Test Party"})
    party_id = p_res.json()["_id"]

    l_res = await client.post("/api/loads", json={
        "date": "2026-10-28T12:00",
        "vehicleNo": "GJ02DEL1",
        "party": party_id,
        "emptyKg": 10000,
        "loadedKg": 25000,
        "rate": 400
    })
    load_id = l_res.json()["_id"]

    # Delete load with mocked sheet sync
    with patch("app.routers.common.sync_sheet") as mock_sync:
        del_res = await client.delete(f"/api/loads/{load_id}")
        assert del_res.status_code == 200
        assert del_res.json() == {"ok": True}

        # Verify load was removed from db
        check = await mock_db.loads.find_one({"_id": load_id})
        assert check is None

    # 2. Create expense and delete
    exp_res = await client.post("/api/expenses", json={
        "date": "2026-10-28T13:00",
        "category": "diesel",
        "amount": 1500
    })
    exp_id = exp_res.json()["_id"]

    del_exp = await client.delete(f"/api/expenses/{exp_id}")
    assert del_exp.status_code == 200
    assert del_exp.json() == {"ok": True}
    check_exp = await mock_db.expenses.find_one({"_id": exp_id})
    assert check_exp is None
