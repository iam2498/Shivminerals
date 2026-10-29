import pytest


@pytest.mark.asyncio
async def test_daywise_totals(client, mock_db):
    # Create party
    p_res = await client.post("/api/parties", json={"name": "Gujarat Infra"})
    party_id = p_res.json()["_id"]

    # Load 1: amount = 10000, cash = 3000
    await client.post("/api/loads", json={
        "date": "2026-10-28T09:00",
        "vehicleNo": "GJ01ZZ0001",
        "party": party_id,
        "emptyKg": 10000,
        "loadedKg": 30000,
        "rate": 500,
        "cash": 3000
    })

    # Load 2: amount = 6000, cash = 1000
    await client.post("/api/loads", json={
        "date": "2026-10-28T14:00",
        "vehicleNo": "GJ01ZZ0002",
        "party": party_id,
        "emptyKg": 10000,
        "loadedKg": 22000,
        "rate": 500,
        "cash": 1000
    })

    # Expense 1: diesel = 2500
    await client.post("/api/expenses", json={
        "date": "2026-10-28T11:00",
        "category": "diesel",
        "name": "HP Petrol Pump",
        "amount": 2500
    })

    # Expense 2: other = 300
    await client.post("/api/expenses", json={
        "date": "2026-10-28T15:00",
        "category": "other",
        "name": "Tea Stall",
        "amount": 300
    })

    day_res = await client.get("/api/daywise?from=2026-10-28&to=2026-10-28")
    assert day_res.status_code == 200
    data = day_res.json()

    # Grand total loads amount = 10000 + 6000 = 16000
    # Spot cash = 3000 + 1000 = 4000
    # Total expenses = 2500 + 300 = 2800
    # Debit (credit/udhaar) = grand - cash = 16000 - 4000 = 12000
    # Net cash in hand = cash - expense = 4000 - 2800 = 1200

    assert len(data["rows"]) == 4
    assert data["grand"] == 16000.0
    assert data["cash"] == 4000.0
    assert data["expense"] == 2800.0
    assert data["debit"] == 12000.0
    assert data["net"] == 1200.0
