from datetime import datetime, timedelta, timezone

VN_TZ = timezone(timedelta(hours=7))


def today_vn() -> str:
    """Returns the current date in Vietnam timezone (UTC+7) as ISO 8601 (YYYY-MM-DD)."""
    return datetime.now(VN_TZ).date().isoformat()
