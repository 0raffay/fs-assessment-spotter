"""The corridor heatmap: a 0.5° grid over the plan's bbox, risk per cell for hours 0-48."""

from __future__ import annotations

import math
from collections.abc import Collection, Iterable, Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta

from django.core.cache import cache

from apps.risk.services.rules import classify
from apps.risk.types import CONDITIONS, Condition

from ..types import LngLat
from .forecast import ForecastService, floor_to_hour, reading_at

CELL_DEGREES = 0.5
MAX_HOURS = 48
# A guard against huge requests: ~30° x 20° of 0.5° cells.
MAX_CELLS = 2_400
# The corridor: cells within this many cells (1°) of any route. Open-Meteo's free tier counts
# every location as a call, so fetching only the corridor roughly halves the cost of a heatmap.
CORRIDOR_BUFFER_CELLS = 2
CORRIDOR_CACHE_SECONDS = 60 * 60

CellKey = tuple[float, float]  # a cell's (west, south) corner

BBox = tuple[float, float, float, float]
MEASURES = ("risk", *(c.value for c in CONDITIONS))


@dataclass(frozen=True)
class HeatmapCell:
    id: str
    bounds: BBox
    # RiskIndex per hour (hours + 1 values) for "risk", "wind", "rain" and "snow".
    levels: dict[str, list[int]]


@dataclass(frozen=True)
class Heatmap:
    bbox: BBox
    cell_size_degrees: float
    starts_at: datetime
    hours: int
    cells: list[HeatmapCell]
    worst_by_hour: list[int]


class HeatmapTooLarge(ValueError):
    pass


def grid(bbox: BBox, cell: float = CELL_DEGREES) -> list[BBox]:
    """Cell bounds covering `bbox`, column by column, west → east and south → north."""
    west, south, east, north = bbox
    cells: list[BBox] = []
    columns = max(0, round((east - west) / cell))
    rows = max(0, round((north - south) / cell))
    for col in range(columns):
        lng = west + col * cell
        for row in range(rows):
            lat = south + row * cell
            cells.append((lng, lat, lng + cell, lat + cell))
    return cells


def _cell_key(lng: float, lat: float) -> CellKey:
    return (
        math.floor(lng / CELL_DEGREES) * CELL_DEGREES,
        math.floor(lat / CELL_DEGREES) * CELL_DEGREES,
    )


def corridor_cells(paths: Iterable[Sequence[LngLat]]) -> frozenset[CellKey]:
    """Cells within CORRIDOR_BUFFER_CELLS of any point on the routes."""
    keys: set[CellKey] = set()
    reach = range(-CORRIDOR_BUFFER_CELLS, CORRIDOR_BUFFER_CELLS + 1)
    for path in paths:
        for lng, lat in path:
            west, south = _cell_key(lng, lat)
            for dx in reach:
                for dy in reach:
                    keys.add((west + dx * CELL_DEGREES, south + dy * CELL_DEGREES))
    return frozenset(keys)


def remember_corridor(plan_id: str, cells: frozenset[CellKey]) -> None:
    cache.set(f"corridor:{plan_id}", cells, CORRIDOR_CACHE_SECONDS)


def corridor_for(plan_id: str) -> frozenset[CellKey] | None:
    return cache.get(f"corridor:{plan_id}")


def build_heatmap(
    service: ForecastService,
    bbox: BBox,
    *,
    hours: int,
    load_weight_lb: float,
    now: datetime,
    only: Collection[CellKey] | None = None,
) -> Heatmap:
    """Classify every cell center (or only the `only` cells) for every hour from `now`."""
    starts_at = floor_to_hour(now)
    cells = grid(bbox)
    if only is not None:
        cells = [cell for cell in cells if _cell_key(cell[0] + 1e-9, cell[1] + 1e-9) in only]
    if len(cells) > MAX_CELLS:
        raise HeatmapTooLarge(f"{len(cells)} cells is more than {MAX_CELLS}")

    centers: list[LngLat] = [((w + e) / 2, (s + n) / 2) for w, s, e, n in cells]
    series = service.series(centers, starts_at, hours)
    worst = [0] * (hours + 1)
    out: list[HeatmapCell] = []

    for bounds, cell_series in zip(cells, series, strict=True):
        levels: dict[str, list[int]] = {measure: [] for measure in MEASURES}
        for hour in range(hours + 1):
            reading = reading_at(cell_series, starts_at + timedelta(hours=hour))
            if reading is None:
                overall = wind = rain = snow = 0
            else:
                result = classify(reading, load_weight_lb)
                overall = result.level.index
                wind = result.condition_levels[Condition.WIND].index
                rain = result.condition_levels[Condition.RAIN].index
                snow = result.condition_levels[Condition.SNOW].index
            levels["risk"].append(overall)
            levels["wind"].append(wind)
            levels["rain"].append(rain)
            levels["snow"].append(snow)
            worst[hour] = max(worst[hour], overall)
        west, south = bounds[0], bounds[1]
        out.append(HeatmapCell(id=f"{west:.1f},{south:.1f}", bounds=bounds, levels=levels))

    return Heatmap(
        bbox=bbox,
        cell_size_degrees=CELL_DEGREES,
        starts_at=starts_at,
        hours=hours,
        cells=out,
        worst_by_hour=worst,
    )
