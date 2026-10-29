import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_expense_categories_seed_and_create(client: AsyncClient, mock_db):
    # 1. Fetch categories (should auto-seed default suggested categories)
    res = await client.get("/api/expenses/categories")
    assert res.status_code == 200
    cats = res.json()
    cat_names = [c["name"] for c in cats]

    assert "Mobile Recharge" in cat_names
    assert "Personal Bike Petrol" in cat_names
    assert "Food and Meals" in cat_names
    assert "Tea and Snacks" in cat_names
    assert "Masala / Tobacco" in cat_names
    assert "Personal Purchase" in cat_names
    assert "Salary Advance" in cat_names
    assert "Other Personal Withdrawal" in cat_names

    # 2. Add a new custom category
    add_res = await client.post("/api/expenses/categories", json={"name": "Office Supplies"})
    assert add_res.status_code == 200
    new_cat = add_res.json()
    assert new_cat["name"] == "Office Supplies"
    assert "_id" in new_cat

    # 3. Create expense with the new category
    exp_res = await client.post("/api/expenses", json={
        "date": "2026-10-29",
        "category": "Office Supplies",
        "name": "Ramesh",
        "amount": 450.0,
        "notes": "Pens & Notebooks"
    })
    assert exp_res.status_code == 200
    exp = exp_res.json()
    assert exp["category"] == "Office Supplies"
    assert exp["amount"] == 450.0

    # 4. Create another expense with suggested category
    await client.post("/api/expenses", json={
        "date": "2026-10-29",
        "category": "Mobile Recharge",
        "name": "Suresh",
        "amount": 299.0,
        "notes": "Airtel prepaid"
    })

    # 5. Get expenses and test filtering & byCat aggregation
    rep_res = await client.get("/api/expenses?from=2026-10-29&to=2026-10-29")
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["total"] == 749.0
    assert rep_data["byCat"]["Office Supplies"] == 450.0
    assert rep_data["byCat"]["Mobile Recharge"] == 299.0

    # Filter by specific category
    filtered_res = await client.get("/api/expenses?from=2026-10-29&to=2026-10-29&category=Mobile Recharge")
    assert filtered_res.status_code == 200
    filtered_data = filtered_res.json()
    assert len(filtered_data["items"]) == 1
    assert filtered_data["items"][0]["category"] == "Mobile Recharge"

    # 6. Delete category
    del_res = await client.delete(f"/api/expenses/categories/{new_cat['_id']}")
    assert del_res.status_code == 200
    assert del_res.json() == {"ok": True}
