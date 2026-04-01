def normalize_category(category: str) -> str:
    return " ".join(category.strip().split()).title()


def sanitize_notes(notes: str | None) -> str | None:
    if notes is None:
        return None
    cleaned = notes.strip()
    return cleaned if cleaned else None
