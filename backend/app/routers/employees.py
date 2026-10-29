from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, BackgroundTasks
from bson import ObjectId

from ..db import get_db
from ..models import EmployeeCreate, EmpEntryCreate
from ..sheets import sync_sheet
from ..utils import (
    parse_ist_datetime,
    format_ist_text,
    serialize_doc,
    serialize_docs
)

router = APIRouter(tags=["employees"])


@router.get("/api/employees")
async def get_employees():
    try:
        db = get_db()
        es = await db.employees.find().sort("name", 1).to_list(length=None)

        # Aggregate empentries by employee & type
        pipeline = [
            {
                "$group": {
                    "_id": {"e": "$employee", "t": "$type"},
                    "s": {"$sum": "$amount"}
                }
            }
        ]
        agg = await db.empentries.aggregate(pipeline).to_list(length=None)

        res = []
        for e in es:
            eid = str(e["_id"])
            e_dict = serialize_doc(e)

            def get_sum(kind: str) -> float:
                for x in agg:
                    if str(x["_id"].get("e")) == eid and x["_id"].get("t") == kind:
                        return float(x.get("s") or 0.0)
                return 0.0

            earned = get_sum("earned")
            paid = get_sum("paid")
            advance = get_sum("advance")

            e_dict["earned"] = earned
            e_dict["paid"] = paid
            e_dict["advance"] = advance
            e_dict["pending"] = earned - paid - advance
            res.append(e_dict)

        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/employees")
async def create_employee(emp: EmployeeCreate, bg: BackgroundTasks):
    try:
        db = get_db()
        data = emp.model_dump()
        now = datetime.now(timezone.utc)
        data["createdAt"] = now
        data["updatedAt"] = now

        result = await db.employees.insert_one(data)
        data["_id"] = result.inserted_id

        # Fire-and-forget sync to Google Sheet
        bg.add_task(
            sync_sheet,
            "Employees",
            [
                data.get("name", ""),
                data.get("phone", "") or "",
                data.get("role", "") or ""
            ]
        )

        return serialize_doc(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/empentries")
async def create_emp_entry(entry: EmpEntryCreate, bg: BackgroundTasks):
    try:
        db = get_db()
        data = entry.model_dump()
        now = datetime.now(timezone.utc)
        data["createdAt"] = now
        data["updatedAt"] = now

        data["date"] = parse_ist_datetime(data.get("date"))
        data["amount"] = float(data.get("amount") or 0.0)

        emp_id = data.get("employee")
        emp_name = ""
        if emp_id:
            try:
                emp_oid = ObjectId(str(emp_id))
                data["employee"] = emp_oid
                e_doc = await db.employees.find_one({"_id": emp_oid})
                if e_doc:
                    emp_name = e_doc.get("name", "")
            except Exception:
                e_doc = await db.employees.find_one({"$or": [{"_id": emp_id}, {"name": emp_id}]})
                if e_doc:
                    emp_name = e_doc.get("name", "")

        result = await db.empentries.insert_one(data)
        data["_id"] = result.inserted_id

        # Fire-and-forget sync to Google Sheet
        bg.add_task(
            sync_sheet,
            "Salary",
            [
                format_ist_text(data["date"]),
                emp_name,
                data.get("type", ""),
                data.get("amount", 0),
                data.get("notes", "")
            ]
        )

        return serialize_doc(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
