"""
Scrape a stock using ScreenerProvider and dump raw data to CSV files
for manual data integrity verification.

Usage: python data_int_test/scrape_test.py TATAPOWER
"""

import sys
import os
import csv
import json

# Add backend to path so we can import the provider
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from providers.screener_provider import ScreenerProvider


def write_key_ratios_csv(ratios, output_path):
    """Write key ratios to CSV."""
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Metric", "Value"])
        for key, val in sorted(ratios.items()):
            writer.writerow([key, val])
    print(f"  Written: {output_path} ({len(ratios)} metrics)")


def write_financials_csv(dated_dict, output_path, statement_name):
    """Write a financial statement (income/balance/cashflow) to CSV."""
    if not dated_dict:
        print(f"  Skipped: {output_path} (no {statement_name} data)")
        return

    # Collect all field names and sort dates
    all_fields = set()
    for period_data in dated_dict.values():
        all_fields.update(period_data.keys())

    sorted_dates = sorted(dated_dict.keys())
    sorted_fields = sorted(all_fields)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Field"] + sorted_dates)
        for field in sorted_fields:
            row = [field]
            for date in sorted_dates:
                val = dated_dict.get(date, {}).get(field)
                row.append(val if val is not None else "")
            writer.writerow(row)

    print(f"  Written: {output_path} ({len(sorted_fields)} fields x {len(sorted_dates)} periods)")


def write_shareholding_csv(shareholding, output_path):
    """Write shareholding pattern to CSV."""
    if not shareholding:
        print(f"  Skipped: {output_path} (no shareholding data)")
        return

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Category", "Value"])
        for key, val in sorted(shareholding.items()):
            writer.writerow([key, val])
    print(f"  Written: {output_path} ({len(shareholding)} fields)")


def write_profile_csv(data, output_path):
    """Write profile and metadata to CSV."""
    rows = [
        ("Name", data.get("name")),
        ("Description", data.get("description")),
        ("Current Price", data.get("current_price")),
        ("Confidence Score", data.get("confidence")),
        ("Source URL", data.get("source_url")),
        ("Scraper Version", data.get("scraper_version")),
        ("Scraped At", data.get("scraped_at")),
        ("Sections Found", ", ".join(data.get("sections_found", []))),
    ]
    # Add company details
    for k, v in data.get("company_details", {}).items():
        rows.append((f"Detail: {k}", v))

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Field", "Value"])
        for row in rows:
            writer.writerow(row)
    print(f"  Written: {output_path} ({len(rows)} fields)")


def main():
    symbol = sys.argv[1] if len(sys.argv) > 1 else "TATAPOWER"
    output_dir = os.path.dirname(os.path.abspath(__file__))

    print(f"Scraping {symbol} from screener.in...")
    provider = ScreenerProvider()
    data = provider.get_full_data(symbol)

    print(f"\nConfidence score: {data.get('confidence')}/100")
    print(f"Sections found: {data.get('sections_found')}")
    print(f"\nGenerating CSV files in {output_dir}/\n")

    # 1. Profile & metadata
    write_profile_csv(data, os.path.join(output_dir, f"{symbol}_profile.csv"))

    # 2. Key ratios
    write_key_ratios_csv(
        data.get("key_ratios", {}),
        os.path.join(output_dir, f"{symbol}_key_ratios.csv"),
    )

    # 3. Financial statements
    financials = data.get("financials", {})

    write_financials_csv(
        financials.get("income_statement", {}),
        os.path.join(output_dir, f"{symbol}_income_statement.csv"),
        "Income Statement",
    )

    write_financials_csv(
        financials.get("balance_sheet", {}),
        os.path.join(output_dir, f"{symbol}_balance_sheet.csv"),
        "Balance Sheet",
    )

    write_financials_csv(
        financials.get("cashflow", {}),
        os.path.join(output_dir, f"{symbol}_cashflow.csv"),
        "Cash Flow",
    )

    # 4. Ratios table
    write_financials_csv(
        financials.get("ratios_table", {}),
        os.path.join(output_dir, f"{symbol}_ratios_table.csv"),
        "Ratios Table",
    )

    # 5. Shareholding pattern
    write_shareholding_csv(
        data.get("shareholding", {}),
        os.path.join(output_dir, f"{symbol}_shareholding.csv"),
    )

    # 6. Full raw JSON dump for reference
    json_path = os.path.join(output_dir, f"{symbol}_raw_dump.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  Written: {json_path} (full raw data)")

    print(f"\nDone! All files for {symbol} are in {output_dir}/")


if __name__ == "__main__":
    main()
