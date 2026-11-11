import uuid
from datetime import UTC, datetime

import pytest
from django.core.cache.backends.locmem import LocMemCache

from apps.weather.services.forecast import ForecastService
from apps.weather.services.heatmap import HeatmapTooLarge, build_heatmap, corridor_cells, grid
from apps.weather.tests.fakes import FakeForecastClient

NOW = datetime(2026, 11, 12, 13, 40, tzinfo=UTC)


def service(weather):
    return ForecastService(
        FakeForecastClient(weather), LocMemCache(f"heatmap-tests-{uuid.uuid4()}", {})
    )


def test_grid_covers_the_bbox_in_half_degree_cells():
    cells = grid((-100.0, 35.0, -99.0, 36.5))

    assert len(cells) == 2 * 3
    assert cells[0] == (-100.0, 35.0, -99.5, 35.5)
    assert cells[-1] == (-99.5, 36.0, -99.0, 36.5)


def test_heatmap_levels_per_measure_and_worst_by_hour():
    # Wind ramps up by the hour in the western column only; snow falls everywhere at hour 2.
    def weather(point, hour):
        lng, _lat = point
        wind = 20.0 + hour * 10 if lng < -99.5 else 5.0
        snow = 1.5 if hour == 2 else 0.0
        return (wind, 0.0, snow)

    heatmap = build_heatmap(
        service(weather), (-100.0, 35.0, -99.0, 35.5), hours=3, load_weight_lb=42_000, now=NOW
    )

    assert heatmap.starts_at == datetime(2026, 11, 12, 13, tzinfo=UTC)
    assert [cell.id for cell in heatmap.cells] == ["-100.0,35.0", "-99.5,35.0"]
    west, east = heatmap.cells
    # 20, 30, 40, 50 mph with 42,000 lb: low, moderate, severe (load rule), no travel (load rule).
    assert west.levels["wind"] == [0, 1, 3, 4]
    assert west.levels["snow"] == [0, 0, 2, 0]
    assert west.levels["risk"] == [0, 1, 3, 4]
    assert east.levels["risk"] == [0, 0, 2, 0]
    assert heatmap.worst_by_hour == [0, 1, 3, 4]
    assert all(len(levels) == 4 for cell in heatmap.cells for levels in cell.levels.values())


def test_heatmap_refuses_huge_areas():
    with pytest.raises(HeatmapTooLarge):
        build_heatmap(
            service(lambda p, h: (0, 0, 0)),
            (-130.0, 20.0, -60.0, 55.0),
            hours=1,
            load_weight_lb=1,
            now=NOW,
        )


def test_corridor_is_the_cells_within_one_degree_of_the_route():
    cells = corridor_cells([[(-99.9, 35.1), (-99.6, 35.2)]])

    # Both points sit in cell (-100, 35); two cells either way gives a 5 x 5 block.
    assert len(cells) == 25
    assert (-101.0, 34.0) in cells and (-99.0, 36.0) in cells and (-98.5, 35.0) not in cells


def test_heatmap_can_be_limited_to_the_corridor():
    only = corridor_cells([[(-99.9, 35.1)]])
    heatmap = build_heatmap(
        service(lambda p, h: (5.0, 0.0, 0.0)),
        (-103.0, 33.0, -97.0, 37.0),
        hours=1,
        load_weight_lb=1,
        now=NOW,
        only=only,
    )

    assert len(heatmap.cells) == 25
    assert {(c.bounds[0], c.bounds[1]) for c in heatmap.cells} == set(only)
