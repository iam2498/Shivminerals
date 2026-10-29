from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId

from ..db import get_db
from ..utils import (
    parse_date_range,
    serialize_doc,
    serialize_docs
)

router = APIRouter(tags=["reports"])


@router.get("/api/statement")
async def get_statement(
    party: str = Query(...),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to")
):
    try:
        db = get_db()
        f_dt, t_dt = parse_date_range(from_date, to_date)

        try:
            p_oid = ObjectId(party)
            p = await db.parties.find_one({"_id": p_oid})
        except Exception:
            p = await db.parties.find_one({"$or": [{"_id": party}, {"name": party}]})

        if not p:
            raise HTTPException(status_code=400, detail="Party not found")

        pid = p["_id"]
        # Match party as either ObjectId or string
        party_filter = {"$in": [pid, str(pid)]}

        # Calculate pre-period opening balance
        # 1. Pre-period loads amount and cash
        pre_loads_pipeline = [
            {"$match": {"party": party_filter, "date": {"$lt": f_dt}}},
            {"$group": {"_id": None, "amt": {"$sum": "$amount"}, "cash": {"$sum": "$cash"}}}
        ]
        pre_loads_res = await db.loads.aggregate(pre_loads_pipeline).to_list(length=1)
        pre_loads_amt = pre_loads_res[0].get("amt", 0.0) if pre_loads_res else 0.0
        pre_loads_cash = pre_loads_res[0].get("cash", 0.0) if pre_loads_res else 0.0

        # 2. Pre-period payments amount
        pre_pay_pipeline = [
            {"$match": {"party": party_filter, "date": {"$lt": f_dt}}},
            {"$group": {"_id": None, "t": {"$sum": "$amount"}}}
        ]
        pre_pay_res = await db.payments.aggregate(pre_pay_pipeline).to_list(length=1)
        pre_pay_amt = pre_pay_res[0].get("t", 0.0) if pre_pay_res else 0.0

        opening_balance = float(p.get("openingBalance") or 0.0)
        opening = opening_balance + pre_loads_amt - pre_loads_cash - pre_pay_amt

        # In-range items
        q = {"party": party_filter, "date": {"$gte": f_dt, "$lte": t_dt}}
        loads_in_range = await db.loads.find(q).to_list(length=None)
        pays_in_range = await db.payments.find(q).to_list(length=None)

        rows = []
        for l in loads_in_range:
            rows.append({
                "kind": "loads",
                "id": str(l["_id"]),
                "_id": str(l["_id"]),
                "date": l["date"].isoformat() if isinstance(l["date"], datetime) else str(l["date"]),
                "details": l.get("vehicleNo", ""),
                "pass": l.get("royaltyPassNo", ""),
                "mton": float(l.get("netTon") or 0.0),
                "rton": float(l.get("royaltyTon") or 0.0),
                "debit": float(l.get("amount") or 0.0),
                "credit": float(l.get("cash") or 0.0),
            })

        for y in pays_in_range:
            mode = y.get("mode") or ""
            notes = y.get("notes") or ""
            details = " - ".join([part for part in [mode, notes] if part])
            rows.append({
                "kind": "payments",
                "id": str(y["_id"]),
                "_id": str(y["_id"]),
                "date": y["date"].isoformat() if isinstance(y["date"], datetime) else str(y["date"]),
                "details": details,
                "pass": "",
                "mton": 0.0,
                "rton": 0.0,
                "debit": 0.0,
                "credit": float(y.get("amount") or 0.0),
            })

        rows.sort(key=lambda r: r["date"])

        bal = opening
        for r in rows:
            bal += r["debit"] - r["credit"]
            r["balance"] = bal

        def sum_key(k: str) -> float:
            return sum(r.get(k, 0.0) for r in rows)

        return {
            "party": serialize_doc(p),
            "opening": opening,
            "rows": rows,
            "t": {
                "mton": sum_key("mton"),
                "rton": sum_key("rton"),
                "debit": sum_key("debit"),
                "credit": sum_key("credit"),
            },
            "pending": bal,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/empstatement")
async def get_emp_statement(
    employee: str = Query(...),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to")
):
    try:
        db = get_db()
        f_dt, t_dt = parse_date_range(from_date, to_date)

        try:
            e_oid = ObjectId(employee)
            e = await db.employees.find_one({"_id": e_oid})
        except Exception:
            e = await db.employees.find_one({"$or": [{"_id": employee}, {"name": employee}]})

        if not e:
            raise HTTPException(status_code=400, detail="Employee not found")

        eid = e["_id"]
        emp_filter = {"$in": [eid, str(eid)]}

        # Calculate pre-period opening balance
        pre_pipeline = [
            {"$match": {"employee": emp_filter, "date": {"$lt": f_dt}}},
            {"$group": {"_id": "$type", "s": {"$sum": "$amount"}}}
        ]
        pre_res = await db.empentries.aggregate(pre_pipeline).to_list(length=None)

        def pre_sum(k: str) -> float:
            for x in pre_res:
                if x["_id"] == k:
                    return float(x.get("s") or 0.0)
            return 0.0

        opening = pre_sum("earned") - pre_sum("paid") - pre_sum("advance")

        # Range items
        items = await db.empentries.find({
            "employee": emp_filter,
            "date": {"$gte": f_dt, "$lte": t_dt}
        }).sort("date", 1).to_list(length=None)

        def tot(k: str) -> float:
            return sum(float(i.get("amount") or 0.0) for i in items if i.get("type") == k)

        earned = tot("earned")
        paid = tot("paid")
        advance = tot("advance")
        pending = opening + earned - paid - advance

        return {
            "employee": serialize_doc(e),
            "opening": opening,
            "items": serialize_docs(items),
            "earned": earned,
            "paid": paid,
            "advance": advance,
            "pending": pending
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/vehicles")
async def get_vehicles():
    try:
        db = get_db()
        vehicles = await db.loads.distinct("vehicleNo")
        clean_v = [v.strip().upper() for v in vehicles if v and str(v).strip()]
        return sorted(list(set(clean_v)))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/vehicle")
async def get_vehicle_report(
    vehicle: str = Query(...),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to")
):
    try:
        db = get_db()
        f_dt, t_dt = parse_date_range(from_date, to_date)
        v_upper = vehicle.upper().strip()

        loads = await db.loads.find({
            "vehicleNo": {"$regex": f"^{v_upper}$", "$options": "i"},
            "date": {"$gte": f_dt, "$lte": t_dt}
        }).sort("date", 1).to_list(length=None)

        # Populate party
        party_ids = set()
        for l in loads:
            if l.get("party"):
                party_ids.add(l["party"])

        parties_map = {}
        if party_ids:
            p_docs = await db.parties.find({"_id": {"$in": list(party_ids)}}).to_list(length=None)
            for p in p_docs:
                parties_map[str(p["_id"])] = p

        serialized_loads = []
        credit = 0.0
        debit = 0.0
        for l in loads:
            l_dict = serialize_doc(l)
            p_val = l.get("party")
            if p_val and str(p_val) in parties_map:
                l_dict["party"] = {"name": parties_map[str(p_val)].get("name", "")}
            elif p_val:
                l_dict["party"] = {"name": str(p_val)}
            else:
                l_dict["party"] = {"name": "-"}

            amt = float(l.get("amount") or 0.0)
            cash = float(l.get("cash") or 0.0)
            credit += amt
            debit += cash
            serialized_loads.append(l_dict)

        return {
            "vehicle": vehicle,
            "loads": serialized_loads,
            "credit": credit,
            "debit": debit
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/daywise")
async def get_daywise(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to")
):
    try:
        db = get_db()
        f_dt, t_dt = parse_date_range(from_date, to_date)
        q = {"date": {"$gte": f_dt, "$lte": t_dt}}

        loads = await db.loads.find(q).to_list(length=None)
        exps = await db.expenses.find(q).to_list(length=None)

        party_ids = {l["party"] for l in loads if l.get("party")}
        parties_map = {}
        if party_ids:
            p_docs = await db.parties.find({"_id": {"$in": list(party_ids)}}).to_list(length=None)
            for p in p_docs:
                parties_map[str(p["_id"])] = p.get("name", "")

        rows = []
        for l in loads:
            p_name = parties_map.get(str(l.get("party")), "") if l.get("party") else ""
            rows.append({
                "date": l["date"].isoformat() if isinstance(l["date"], datetime) else str(l["date"]),
                "vehicle": l.get("vehicleNo", ""),
                "pass": l.get("royaltyPassNo", ""),
                "mton": float(l.get("netTon") or 0.0),
                "rton": float(l.get("royaltyTon") or 0.0),
                "district": l.get("district", ""),
                "party": p_name,
                "amount": float(l.get("amount") or 0.0),
                "cash": float(l.get("cash") or 0.0),
            })

        for x in exps:
            rows.append({
                "date": x["date"].isoformat() if isinstance(x["date"], datetime) else str(x["date"]),
                "vehicle": x.get("category", "other"),
                "party": x.get("name", ""),
                "amount": float(x.get("amount") or 0.0),
                "cash": 0.0,
                "exp": True,
            })

        rows.sort(key=lambda r: r["date"])

        grand = sum(float(l.get("amount") or 0.0) for l in loads)
        cash = sum(float(l.get("cash") or 0.0) for l in loads)
        expense = sum(float(x.get("amount") or 0.0) for x in exps)
        debit = grand - cash
        net = cash - expense

        return {
            "rows": rows,
            "grand": grand,
            "cash": cash,
            "expense": expense,
            "debit": debit,
            "net": net
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
