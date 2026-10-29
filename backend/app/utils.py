from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from bson import ObjectId

try:
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = timezone(timedelta(hours=5, minutes=30))


def round_half_up(val: float | int | Decimal | None, decimals: int = 2) -> float:
    """Rounds half UP (e.g. 1.005 -> 1.01), replicating JavaScript Math.round behavior."""
    if val is None:
        return 0.0
    try:
        d = Decimal(str(val))
        factor = Decimal("10") ** -decimals
        return float(d.quantize(factor, rounding=ROUND_HALF_UP))
    except Exception:
        return 0.0


def parse_ist_datetime(val: str | datetime | None) -> datetime:
    """Parses date string or datetime assuming Asia/Kolkata if timezone-naive, returns UTC datetime."""
    if val is None:
        return datetime.now(timezone.utc)
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=IST).astimezone(timezone.utc)
        return val.astimezone(timezone.utc)

    s = str(val).strip()
    try:
        # Handle formats like "YYYY-MM-DDTHH:mm:ss.sssZ" or "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD"
        if s.endswith("Z"):
            dt = datetime.fromisoformat(s[:-1] + "+00:00")
            return dt.astimezone(timezone.utc)
        elif "+" in s[10:] or "-" in s[10:]:
            dt = datetime.fromisoformat(s)
            return dt.astimezone(timezone.utc)
        elif "T" in s:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=IST)
            return dt.astimezone(timezone.utc)
        else:
            dt = datetime.strptime(s, "%Y-%m-%d")
            dt = dt.replace(tzinfo=IST)
            return dt.astimezone(timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


def parse_date_range(from_str: str | None, to_str: str | None) -> tuple[datetime, datetime]:
    """
    Parses 'from' and 'to' date strings in YYYY-MM-DD format.
    from = YYYY-MM-DD 00:00:00.000 IST -> UTC
    to = YYYY-MM-DD 23:59:59.999 IST -> UTC
    """
    now_ist = datetime.now(IST)
    if not from_str:
        from_str = now_ist.strftime("%Y-%m-01")
    if not to_str:
        to_str = now_ist.strftime("%Y-%m-%d")

    try:
        f_dt = datetime.strptime(f"{from_str} 00:00:00", "%Y-%m-%d %H:%M:%S").replace(tzinfo=IST)
    except Exception:
        f_dt = now_ist.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    try:
        t_dt = datetime.strptime(f"{to_str} 23:59:59.999000", "%Y-%m-%d %H:%M:%S.%f").replace(tzinfo=IST)
    except Exception:
        t_dt = now_ist.replace(hour=23, minute=59, second=59, microsecond=999000)

    return f_dt.astimezone(timezone.utc), t_dt.astimezone(timezone.utc)


def format_ist_text(val: datetime | str | None) -> str:
    """
    Formats a datetime into 'DD/MM/YYYY, hh:mm:ss am/pm' in IST, matching
    JavaScript's new Date().toLocaleString('en-IN').
    """
    if val is None:
        dt = datetime.now(IST)
    elif isinstance(val, str):
        dt = parse_ist_datetime(val).astimezone(IST)
    elif isinstance(val, datetime):
        if val.tzinfo is None:
            dt = val.replace(tzinfo=timezone.utc).astimezone(IST)
        else:
            dt = val.astimezone(IST)
    else:
        dt = datetime.now(IST)

    day = dt.day
    month = dt.month
    year = dt.year

    hour_12 = dt.hour % 12
    if hour_12 == 0:
        hour_12 = 12
    minute = f"{dt.minute:02d}"
    second = f"{dt.second:02d}"
    ampm = "am" if dt.hour < 12 else "pm"

    # JavaScript en-IN outputs: "D/M/YYYY, h:mm:ss am/pm"
    return f"{day}/{month}/{year}, {hour_12}:{minute}:{second} {ampm}"


def serialize_doc(doc: dict | None) -> dict | None:
    """
    Recursively converts BSON ObjectIds to strings and datetimes to ISO strings,
    ensuring '_id' is a string and camelCase fields remain intact.
    """
    if doc is None:
        return None
    res = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            res[k] = str(v)
        elif isinstance(v, datetime):
            # Format as ISO 8601 string
            if v.tzinfo is None:
                v = v.replace(tzinfo=timezone.utc)
            res[k] = v.isoformat()
        elif isinstance(v, dict):
            res[k] = serialize_doc(v)
        elif isinstance(v, list):
            res[k] = [serialize_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item) for item in v]
        else:
            res[k] = v
    return res


def serialize_docs(docs: list[dict]) -> list[dict]:
    return [serialize_doc(d) for d in docs]
