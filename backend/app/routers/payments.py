from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, BackgroundTasks
from bson import ObjectId

from ..db import get_db
from ..models import PaymentCreate
from ..sheets import sync_sheet
from ..utils import (
    parse_ist_datetime,
    format_ist_text,
    serialize_doc
)

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("")
async def create_payment(payment: PaymentCreate, bg: BackgroundTasks):
    try:
        db = get_db()
        data = payment.model_dump()
        now = datetime.now(timezone.utc)
        data["createdAt"] = now
        data["updatedAt"] = now

        data["date"] = parse_ist_datetime(data.get("date"))
        data["amount"] = float(data.get("amount") or 0.0)

        party_id = data.get("party")
        party_name = ""
        if party_id:
            try:
                party_oid = ObjectId(str(party_id))
                data["party"] = party_oid
                p_doc = await db.parties.find_one({"_id": party_oid})
                if p_doc:
                    party_name = p_doc.get("name", "")
            except Exception:
                p_doc = await db.parties.find_one({"$or": [{"_id": party_id}, {"name": party_id}]})
                if p_doc:
                    party_name = p_doc.get("name", "")

        result = await db.payments.insert_one(data)
        data["_id"] = result.inserted_id

        # Fire-and-forget sync to Google Sheet
        bg.add_task(
            sync_sheet,
            "Payments",
            [
                format_ist_text(data["date"]),
                party_name,
                data.get("amount", 0),
                data.get("mode", "Cash"),
                data.get("notes", "")
            ]
        )

        return serialize_doc(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
