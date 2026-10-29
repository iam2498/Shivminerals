from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, BackgroundTasks, Path
from bson import ObjectId

from ..db import get_db
from ..sheets import sync_sheet
from ..utils import format_ist_text

router = APIRouter(tags=["common"])

VALID_KINDS = {
    "loads": "loads",
    "payments": "payments",
    "empentries": "empentries",
    "expenses": "expenses"
}


@router.delete("/api/{kind}/{id}")
async def delete_item(
    kind: str = Path(..., pattern="^(loads|payments|empentries|expenses)$"),
    id: str = Path(...),
    bg: BackgroundTasks = BackgroundTasks()
):
    try:
        db = get_db()
        col_name = VALID_KINDS.get(kind)
        if not col_name:
            raise HTTPException(status_code=400, detail=f"Invalid kind: {kind}")

        collection = db[col_name]
        try:
            doc_oid = ObjectId(id)
            doc = await collection.find_one_and_delete({"_id": doc_oid})
        except Exception:
            doc = await collection.find_one_and_delete({"_id": id})

        if doc:
            now = datetime.now(timezone.utc)
            identifier = (
                doc.get("vehicleNo")
                or doc.get("mode")
                or doc.get("type")
                or doc.get("category")
                or ""
            )
            bg.add_task(
                sync_sheet,
                "Deleted",
                [
                    format_ist_text(now),
                    kind,
                    format_ist_text(doc.get("date")),
                    identifier,
                    doc.get("amount", 0)
                ]
            )

        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
