from typing import Optional, Set


def parse_include_param(include_param: str) -> Optional[Set[str]]:
    if include_param is None:
        return None
    include_param = include_param.strip().lower()
    if not include_param:
        return None
    if include_param == "basic":
        return {"profile"}
    if include_param == "financials":
        return {"profile", "financials"}
    if include_param == "history":
        return {"profile", "history", "price"}
    if include_param == "full":
        return {"profile", "financials", "history", "price"}
    return {part.strip() for part in include_param.split(",") if part.strip()}
