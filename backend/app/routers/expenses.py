from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query

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

        result = await db.expenses.insert_one(data)
        data["_id"] = result.inserted_id

        # Fire-and-forget sync to Google Sheet
        bg.add_task(
            sync_sheet,
            "Expenses",
            [
                format_ist_text(data["date"]),
                data.get("category", "other"),
                data.get("name", "") or "",
                data.get("amount", 0),
                data.get("notes", "") or ""
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
        if category:
            q["category"] = category
        if name:
            # Match name cleanly
            q["name"] = name

        items = await db.expenses.find(q).sort("date", 1).to_list(length=None)

        by_cat = {}
        total = 0.0
        for i in items:
            cat = i.get("category", "other")
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
