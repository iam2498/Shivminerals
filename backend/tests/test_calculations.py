import pytest
from app.utils import round_half_up


def test_round_half_up():
    # JavaScript Math.round behavior
    assert round_half_up(1.005, 2) == 1.01
    assert round_half_up(2.555, 2) == 2.56
    assert round_half_up(10.124, 2) == 10.12
    assert round_half_up(10.125, 2) == 10.13
    assert round_half_up(0, 2) == 0.0
    assert round_half_up(1234.5, 2) == 1234.5


@pytest.mark.asyncio
async def test_load_calculation_api(client, mock_db):
    # Create a party first
    party_res = await client.post("/api/parties", json={"name": "Test Party", "openingBalance": 0})
    assert party_res.status_code == 200
    party_id = party_res.json()["_id"]

    # Post a load: empty=12000, loaded=37500 -> netTon = 25.5
    # rate = 450 -> amount = 25.5 * 450 = 11475.0
    load_res = await client.post("/api/loads", json={
        "date": "2026-10-28T10:00",
        "vehicleNo": "GJ02AB1234",
        "party": party_id,
        "emptyKg": 12000,
        "loadedKg": 37500,
        "rate": 450,
        "cash": 1000
    })
    assert load_res.status_code == 200
    data = load_res.json()
    assert data["netTon"] == 25.5
    assert data["amount"] == 11475.0
    assert data["cash"] == 1000.0

    # Test fraction that requires half-up rounding:
    # empty=10000, loaded=33555 -> netTon = 23.555
    # rate = 321.45 -> raw = 7571.75475 -> round2 = 7571.75
    load_res2 = await client.post("/api/loads", json={
        "date": "2026-10-28T11:00",
        "vehicleNo": "GJ02XX9999",
        "party": party_id,
        "emptyKg": 10000,
        "loadedKg": 33555,
        "rate": 321.45
    })
    assert load_res2.status_code == 200
    data2 = load_res2.json()
    assert data2["netTon"] == 23.555
    assert data2["amount"] == 7571.75
