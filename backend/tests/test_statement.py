import pytest


@pytest.mark.asyncio
async def test_statement_opening_and_running_balance(client, mock_db):
    # 1. Create party with opening balance = 1000
    p_res = await client.post("/api/parties", json={"name": "Sardar Construction", "openingBalance": 1000})
    party_id = p_res.json()["_id"]

    # 2. Pre-period transactions (before 2026-10-10):
    # Load before period: date = 2026-10-05, amount = 5000, cash = 1000
    await client.post("/api/loads", json={
        "date": "2026-10-05T09:00",
        "vehicleNo": "GJ02CC3333",
        "party": party_id,
        "emptyKg": 10000,
        "loadedKg": 20000,
        "rate": 500,
        "cash": 1000
    })
    # Payment before period: date = 2026-10-06, amount = 2000
    await client.post("/api/payments", json={
        "date": "2026-10-06T10:00",
        "party": party_id,
        "amount": 2000,
        "mode": "Cash"
    })

    # Opening before 2026-10-10:
    # 1000 (initial) + 5000 (load) - 1000 (load cash) - 2000 (payment) = 3000

    # 3. In-period transactions (from 2026-10-10 to 2026-10-20):
    # Row 1 (Load): date = 2026-10-12, amount = 4000, cash = 500 -> debit 4000, credit 500
    # Balance after row 1 = 3000 + 4000 - 500 = 6500
    await client.post("/api/loads", json={
        "date": "2026-10-12T14:00",
        "vehicleNo": "GJ02CC3333",
        "party": party_id,
        "emptyKg": 10000,
        "loadedKg": 18000,
        "rate": 500,
        "cash": 500
    })

    # Row 2 (Payment): date = 2026-10-15, amount = 2500 -> debit 0, credit 2500
    # Balance after row 2 = 6500 + 0 - 2500 = 4000
    await client.post("/api/payments", json={
        "date": "2026-10-15T16:00",
        "party": party_id,
        "amount": 2500,
        "mode": "UPI",
        "notes": "Advance"
    })

    # Query statement for 2026-10-10 to 2026-10-20
    stmt_res = await client.get(f"/api/statement?party={party_id}&from=2026-10-10&to=2026-10-20")
    assert stmt_res.status_code == 200
    stmt = stmt_res.json()

    assert stmt["opening"] == 3000.0
    assert len(stmt["rows"]) == 2
    assert stmt["rows"][0]["kind"] == "loads"
    assert stmt["rows"][0]["debit"] == 4000.0
    assert stmt["rows"][0]["credit"] == 500.0
    assert stmt["rows"][0]["balance"] == 6500.0

    assert stmt["rows"][1]["kind"] == "payments"
    assert stmt["rows"][1]["debit"] == 0.0
    assert stmt["rows"][1]["credit"] == 2500.0
    assert stmt["rows"][1]["balance"] == 4000.0
    assert "UPI - Advance" in stmt["rows"][1]["details"]

    assert stmt["t"]["debit"] == 4000.0
    assert stmt["t"]["credit"] == 3000.0
    assert stmt["pending"] == 4000.0
