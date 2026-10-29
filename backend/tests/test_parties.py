import pytest


@pytest.mark.asyncio
async def test_party_pending_and_last_rate(client, mock_db):
    # 1. Create party with opening balance of 5000
    p_res = await client.post("/api/parties", json={
        "name": "Bharat Earthmovers",
        "phone": "9876543210",
        "address": "Mehsana",
        "openingBalance": 5000
    })
    assert p_res.status_code == 200
    party_id = p_res.json()["_id"]

    # 2. Add load 1: (30000 - 10000)/1000 = 20 ton * 500 = 10000.0, cash = 2000
    await client.post("/api/loads", json={
        "date": "2026-10-25T10:00",
        "vehicleNo": "GJ01AA1111",
        "party": party_id,
        "emptyKg": 10000,
        "loadedKg": 30000,
        "rate": 500,
        "cash": 2000
    })

    # 3. Add load 2: (26000 - 10000)/1000 = 16 ton * 550 = 8800.0, cash = 0 (newer date)
    await client.post("/api/loads", json={
        "date": "2026-10-26T10:00",
        "vehicleNo": "GJ01AA1111",
        "party": party_id,
        "emptyKg": 10000,
        "loadedKg": 26000,
        "rate": 550,
        "cash": 0
    })

    # 4. Add payment: amount = 4000
    await client.post("/api/payments", json={
        "date": "2026-10-27T10:00",
        "party": party_id,
        "amount": 4000,
        "mode": "Bank"
    })

    # Total loads = 10000 + 8800 = 18800
    # Total paid = payments (4000) + load cash (2000) = 6000
    # Pending = opening (5000) + total (18800) - paid (6000) = 17800
    # Last rate = 550

    parties_res = await client.get("/api/parties")
    assert parties_res.status_code == 200
    parties = parties_res.json()
    assert len(parties) >= 1

    p_data = next(p for p in parties if p["_id"] == party_id)
    assert p_data["total"] == 18800.0
    assert p_data["paid"] == 6000.0
    assert p_data["pending"] == 17800.0
    assert p_data["lastRate"] == 550.0
