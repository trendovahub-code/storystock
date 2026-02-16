import os


BRAND_NAME = os.getenv("BRAND_NAME", "Trendova Hub")


def log(message: str) -> None:
    print(f"[{BRAND_NAME}] {message}")
