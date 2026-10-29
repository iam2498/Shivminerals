from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from bson import ObjectId

from ..db import get_db
from ..models import LoadCreate
from ..sheets import sync_sheet
from ..utils import (
    round_half_up,
    parse_ist_datetime,
    format_ist_text,
    serialize_doc,
    serialize_docs
)

router = APIRouter(prefix="/api/loads", tags=["loads"])


@router.post("")
async def create_load(load: LoadCreate, bg: BackgroundTasks):
    try:
        db = get_db()
        data = load.model_dump()
        now = datetime.now(timezone.utc)
        data["createdAt"] = now
        data["updatedAt"] = now

        # Date handling
        data["date"] = parse_ist_datetime(data.get("date"))

        # Weights & calculations
        empty_kg = float(data.get("emptyKg") or 0.0)
        loaded_kg = float(data.get("loadedKg") or 0.0)
        rate = float(data.get("rate") or 0.0)
        cash = float(data.get("cash") or 0.0)
        royalty_ton = float(data.get("royaltyTon") or 0.0)

        net_ton = max(0.0, (loaded_kg - empty_kg) / 1000.0)
        amount = round_half_up(net_ton * rate, 2)

        data["emptyKg"] = empty_kg
        data["loadedKg"] = loaded_kg
        data["netTon"] = net_ton
        data["rate"] = rate
        data["cash"] = cash
        data["royaltyTon"] = royalty_ton
        data["amount"] = amount

        # Party ObjectId conversion
        party_id = data.get("party")
        party_oid = None
        party_name = ""
        if party_id:
            try:
                party_oid = ObjectId(str(party_id))
                data["party"] = party_oid
                p_doc = await db.parties.find_one({"_id": party_oid})
                if p_doc:
                    party_name = p_doc.get("name", "")
            except Exception:
                # If not a valid ObjectId, search by string or name
                p_doc = await db.parties.find_one({"$or": [{"_id": party_id}, {"name": party_id}]})
                if p_doc:
                    party_name = p_doc.get("name", "")

        result = await db.loads.insert_one(data)
        data["_id"] = result.inserted_id

        # Fire-and-forget sync to Google Sheet
        bg.add_task(
            sync_sheet,
            "Loads",
            [
                format_ist_text(data["date"]),
                data.get("vehicleNo", ""),
                party_name,
                data.get("sandType", "Sand"),
                data.get("royaltyPassNo", ""),
                data.get("emptyKg", 0),
                data.get("loadedKg", 0),
                data.get("netTon", 0),
                data.get("royaltyTon", 0),
                data.get("rate", 0),
                data.get("amount", 0),
                data.get("cash", 0),
                data.get("district", ""),
                data.get("notes", "")
            ]
        )

        return serialize_doc(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def get_loads(limit: int = Query(default=15, ge=1)):
    try:
        db = get_db()
        loads = await db.loads.find().sort("date", -1).limit(limit).to_list(length=limit)

        # Populate party as {_id, name}
        party_ids = set()
        for l in loads:
            p = l.get("party")
            if p:
                party_ids.add(p)

        parties_map = {}
        if party_ids:
            # Match either as ObjectId or string
            p_docs = await db.parties.find({"_id": {"$in": list(party_ids)}}).to_list(length=None)
            for p in p_docs:
                parties_map[str(p["_id"])] = p

        res = []
        for l in loads:
            l_dict = serialize_doc(l)
            p_val = l.get("party")
            if p_val:
                p_obj = parties_map.get(str(p_val))
                if p_obj:
                    l_dict["party"] = {"_id": str(p_obj["_id"]), "name": p_obj.get("name", "")}
                else:
                    l_dict["party"] = {"_id": str(p_val), "name": str(p_val)}
            else:
                l_dict["party"] = None
            res.append(l_dict)

        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
