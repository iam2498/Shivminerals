import pytest


@pytest.mark.asyncio
async def test_employees_and_statement(client, mock_db):
    # 1. Create employee
    emp_res = await client.post("/api/employees", json={"name": "Ramesh", "role": "Operator"})
    assert emp_res.status_code == 200
    emp_id = emp_res.json()["_id"]

    # 2. Pre-period entries (before 2026-10-10):
    # Earned = 10000, Paid = 4000, Advance = 1000 -> Opening = 5000
    await client.post("/api/empentries", json={
        "date": "2026-10-01T10:00",
        "employee": emp_id,
        "type": "earned",
        "amount": 10000
    })
    await client.post("/api/empentries", json={
        "date": "2026-10-05T10:00",
        "employee": emp_id,
        "type": "paid",
        "amount": 4000
    })
    await client.post("/api/empentries", json={
        "date": "2026-10-06T10:00",
        "employee": emp_id,
        "type": "advance",
        "amount": 1000
    })

    # 3. In-period entries (2026-10-10 to 2026-10-20):
    # Earned = 5000, Paid = 2000, Advance = 500
    await client.post("/api/empentries", json={
        "date": "2026-10-12T10:00",
        "employee": emp_id,
        "type": "earned",
        "amount": 5000
    })
    await client.post("/api/empentries", json={
        "date": "2026-10-15T10:00",
        "employee": emp_id,
        "type": "paid",
        "amount": 2000
    })
    await client.post("/api/empentries", json={
        "date": "2026-10-18T10:00",
        "employee": emp_id,
        "type": "advance",
        "amount": 500
    })

    # Test /api/employees summary
    emps_res = await client.get("/api/employees")
    assert emps_res.status_code == 200
    emps = emps_res.json()
    e_data = next(e for e in emps if e["_id"] == emp_id)
    assert e_data["earned"] == 15000.0
    assert e_data["paid"] == 6000.0
    assert e_data["advance"] == 1500.0
    assert e_data["pending"] == 7500.0

    # Test /api/empstatement
    stmt_res = await client.get(f"/api/empstatement?employee={emp_id}&from=2026-10-10&to=2026-10-20")
    assert stmt_res.status_code == 200
    stmt = stmt_res.json()
    assert stmt["opening"] == 5000.0
    assert len(stmt["items"]) == 3
    assert stmt["earned"] == 5000.0
    assert stmt["paid"] == 2000.0
    assert stmt["advance"] == 500.0
    # pending = opening (5000) + earned (5000) - paid (2000) - advance (500) = 7500
    assert stmt["pending"] == 7500.0
