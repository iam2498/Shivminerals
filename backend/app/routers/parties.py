from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, BackgroundTasks
from bson import ObjectId

from ..db import get_db
from ..models import PartyCreate
from ..sheets import sync_sheet
from ..utils import serialize_doc, serialize_docs

router = APIRouter(prefix="/api/parties", tags=["parties"])


@router.get("")
async def get_parties():
    try:
        db = get_db()
        ps = await db.parties.find().sort("name", 1).to_list(length=None)

        # Aggregations for load amounts, load cash, and payments
        load_amounts = {}
        pipeline_load_amounts = [
            {"$group": {"_id": "$party", "t": {"$sum": "$amount"}}}
        ]
        async for doc in db.loads.aggregate(pipeline_load_amounts):
            if doc["_id"] is not None:
                load_amounts[str(doc["_id"])] = doc.get("t", 0.0)

        load_cash = {}
        pipeline_load_cash = [
            {"$group": {"_id": "$party", "t": {"$sum": "$cash"}}}
        ]
        async for doc in db.loads.aggregate(pipeline_load_cash):
            if doc["_id"] is not None:
                load_cash[str(doc["_id"])] = doc.get("t", 0.0)

        payment_amounts = {}
        pipeline_payments = [
            {"$group": {"_id": "$party", "t": {"$sum": "$amount"}}}
        ]
        async for doc in db.payments.aggregate(pipeline_payments):
            if doc["_id"] is not None:
                payment_amounts[str(doc["_id"])] = doc.get("t", 0.0)

        res = []
        for p in ps:
            pid = str(p["_id"])
            p_dict = serialize_doc(p)
            total = load_amounts.get(pid, 0.0)
            paid = payment_amounts.get(pid, 0.0) + load_cash.get(pid, 0.0)
            opening = float(p.get("openingBalance") or 0.0)
            pending = opening + total - paid

            # Find latest load rate
            # In loads, party could be stored as ObjectId or string
            party_query = {"$in": [p["_id"], pid]}
            last_load = await db.loads.find_one(
                {"party": party_query},
                sort=[("date", -1)],
                projection={"rate": 1}
            )
            last_rate = last_load.get("rate", "") if last_load else ""

            p_dict["total"] = total
            p_dict["paid"] = paid
            p_dict["pending"] = pending
            p_dict["lastRate"] = last_rate
            res.append(p_dict)

        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("")
async def create_party(party: PartyCreate, bg: BackgroundTasks):
    try:
        db = get_db()
        data = party.model_dump()
        now = datetime.now(timezone.utc)
        data["createdAt"] = now
        data["updatedAt"] = now
        data["openingBalance"] = float(data.get("openingBalance") or 0.0)

        result = await db.parties.insert_one(data)
        data["_id"] = result.inserted_id

        # Fire-and-forget sync to Google Sheet
        bg.add_task(
            sync_sheet,
            "Parties",
            [
                data.get("name", ""),
                data.get("phone", "") or "",
                data.get("address", "") or "",
                data.get("openingBalance", 0)
            ]
        )

        return serialize_doc(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
