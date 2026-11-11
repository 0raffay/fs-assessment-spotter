"""Build `apps/routing/data/us_cities.json` from GeoNames' cities1000 dump.

Usage (from apps/api):
    curl -O https://download.geonames.org/export/dump/cities1000.zip
    python scripts/build_us_cities.py cities1000.zip

GeoNames data is CC BY 4.0 (https://www.geonames.org). Each row we keep is
[name, state, lng, lat, population, timeZone], US places with at least MIN_POPULATION people.
"""

from __future__ import annotations

import csv
import io
import json
import sys
import zipfile
from pathlib import Path

MIN_POPULATION = 2_500
OUT = Path(__file__).resolve().parent.parent / "apps" / "routing" / "data" / "us_cities.json"

# GeoNames "geoname" table columns we read.
NAME, LAT, LNG, FEATURE_CLASS, COUNTRY, ADMIN1, POPULATION, TIMEZONE = 1, 4, 5, 6, 8, 10, 14, 17


def main(zip_path: str) -> None:
    rows: list[list[object]] = []
    with zipfile.ZipFile(zip_path) as archive, archive.open("cities1000.txt") as raw:
        reader = csv.reader(io.TextIOWrapper(raw, encoding="utf-8"), delimiter="\t")
        for row in reader:
            if row[COUNTRY] != "US" or row[FEATURE_CLASS] != "P":
                continue
            population = int(row[POPULATION] or 0)
            if population < MIN_POPULATION or not row[ADMIN1] or not row[TIMEZONE]:
                continue
            rows.append(
                [
                    row[NAME],
                    row[ADMIN1],
                    round(float(row[LNG]), 4),
                    round(float(row[LAT]), 4),
                    population,
                    row[TIMEZONE],
                ]
            )
    rows.sort(key=lambda r: -int(r[4]))  # biggest first: search ranks by population
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(rows, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(rows)} places to {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main(sys.argv[1])
