import os
import json
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("sheets_sync")


async def sync_sheet(sheet: str, row: list):
    """
    Copies row to Google Sheet webhook asynchronously in the background.
    Never blocks or fails database operations.
    """
    url = os.getenv("SHEET_WEBHOOK_URL")
    if not url:
        return

    payload = json.dumps({"sheet": sheet, "row": row})
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            resp = await client.post(
                url,
                headers={"Content-Type": "text/plain"},
                content=payload,
            )
            if resp.status_code >= 400:
                logger.warning(f"Sheet sync returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Sheet sync failed: {str(e)}")
