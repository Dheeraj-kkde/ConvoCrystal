from datetime import datetime, timezone


def relative_time(dt: datetime) -> str:
    """Convert a datetime to a human-friendly relative time string."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        mins = seconds // 60
        return f"{mins} min ago"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours}h ago"
    elif seconds < 86400 * 7:
        days = seconds // 86400
        return f"{days}d ago"
    else:
        weeks = seconds // (86400 * 7)
        return f"{weeks}w ago"
