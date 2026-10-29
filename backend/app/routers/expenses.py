import re
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, ConfigDict

from ..db import get_db
from ..models import ExpenseCreate
from ..sheets import sync_sheet
from ..utils import (
    parse_ist_datetime,
    parse_date_range,
    format_ist_text,
    serialize_doc,
    serialize_docs
)

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

DEFAULT_CATEGORIES = [
    "Mobile Recharge",
    "Personal Bike Petrol",
    "Food and Meals",
    "Tea and Snacks",
    "Masala / Tobacco",
    "Personal Purchase",
    "Salary Advance",
    "Other Personal Withdrawal",
    "Diesel",
    "Vehicle Repair",
    "Electricity",
    "Site / Office Rent",
    "Other",
]


class CategoryInput(BaseModel):
    name: str
    model_config = ConfigDict(extra="ignore")


@router.get("/categories")
async def get_expense_categories():
    """
    Returns configured expense categories. If none exist in the database,
    seeds with the suggested categories.
    """
    try:
        db = get_db()
        cats = await db.expense_categories.find().sort("order", 1).to_list(length=None)
        if not cats:
            now = datetime.now(timezone.utc)
            seed_docs = [
                {"name": cat, "order": idx, "createdAt": now, "updatedAt": now}
                for idx, cat in enumerate(DEFAULT_CATEGORIES)
            ]
            await db.expense_categories.insert_many(seed_docs)
            cats = await db.expense_categories.find().sort("order", 1).to_list(length=None)
        return serialize_docs(cats)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/categories")
async def add_expense_category(cat: CategoryInput):
    """
    Allows administrators to add or configure custom expense categories.
    """
    try:
        name = cat.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Category name cannot be empty")

        db = get_db()
        existing = await db.expense_categories.find_one(
            {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
        )
        if existing:
            return serialize_doc(existing)

        count = await db.expense_categories.count_documents({})
        now = datetime.now(timezone.utc)
        doc = {
            "name": name,
            "order": count,
            "createdAt": now,
            "updatedAt": now,
        }
        res = await db.expense_categories.insert_one(doc)
        doc["_id"] = res.inserted_id
        return serialize_doc(doc)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


category_router = APIRouter(prefix="/api/expense-categories", tags=["expenses"])


@category_router.get("")
async def get_expense_categories_alias():
    return await get_expense_categories()


@category_router.post("")
async def add_expense_category_alias(cat: CategoryInput):
    return await add_expense_category(cat)


@category_router.delete("/{cat_id}")
async def delete_expense_category_alias(cat_id: str):
    return await delete_expense_category(cat_id)


@router.delete("/categories/{cat_id}")
async def delete_expense_category(cat_id: str):
    """
    Allows administrators to delete a configured category.
    """
    try:
        db = get_db()
        try:
            oid = ObjectId(cat_id)
            await db.expense_categories.delete_one({"_id": oid})
        except Exception:
            await db.expense_categories.delete_one({"name": cat_id})
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("")
async def create_expense(expense: ExpenseCreate, bg: BackgroundTasks):
    try:
        db = get_db()
        data = expense.model_dump()
        now = datetime.now(timezone.utc)
        data["createdAt"] = now
        data["updatedAt"] = now

        data["date"] = parse_ist_datetime(data.get("date"))
        data["amount"] = float(data.get("amount") or 0.0)

        # Normalize category
        cat_name = (data.get("category") or "Other").strip()
        data["category"] = cat_name

        result = await db.expenses.insert_one(data)
        data["_id"] = result.inserted_id

        # If it's a new custom category not yet in database, register it for future reuse
        if cat_name:
            existing = await db.expense_categories.find_one(
                {"name": {"$regex": f"^{re.escape(cat_name)}$", "$options": "i"}}
            )
            if not existing:
                count = await db.expense_categories.count_documents({})
                await db.expense_categories.insert_one({
                    "name": cat_name,
                    "order": count,
                    "createdAt": now,
                    "updatedAt": now,
                })

        # Fire-and-forget sync to Google Sheet
        bg.add_task(
            sync_sheet,
            "Expenses",
            [
                format_ist_text(data["date"]),
                data.get("category", "Other"),
                data.get("name", "") or "",
                data.get("amount", 0),
                data.get("notes", "") or "",
            ]
        )

        return serialize_doc(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def get_expenses(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    category: Optional[str] = None,
    name: Optional[str] = None
):
    try:
        db = get_db()
        f_dt, t_dt = parse_date_range(from_date, to_date)
        q = {
            "date": {
                "$gte": f_dt,
                "$lte": t_dt
            }
        }
        if category and category.strip().lower() != "all":
            q["category"] = {"$regex": f"^{re.escape(category.strip())}$", "$options": "i"}
        if name:
            q["name"] = name

        items = await db.expenses.find(q).sort("date", 1).to_list(length=None)

        by_cat = {}
        total = 0.0
        for i in items:
            cat = i.get("category") or "Other"
            amt = float(i.get("amount") or 0.0)
            by_cat[cat] = by_cat.get(cat, 0.0) + amt
            total += amt

        return {
            "items": serialize_docs(items),
            "byCat": by_cat,
            "total": total
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
