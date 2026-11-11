from apps.routing.clients import here
from apps.routing.clients.here import GeocodeResult, HereClient
from apps.routing.services.cities import city_index
from apps.routing.services.geocode import search_places


class RecordingGeocoder:
    def __init__(self, results=()):
        self.results = list(results)
        self.queries = []

    def geocode(self, query, *, limit):
        self.queries.append(query)
        return self.results


def test_nearest_town_and_its_time_zone():
    city, miles = city_index().nearest((-104.44, 36.90))  # just outside Raton, NM

    assert (city.name, city.state, city.time_zone) == ("Raton", "NM", "America/Denver")
    assert miles < 5


def test_nearest_can_skip_places():
    first, _ = city_index().nearest((-96.80, 32.78))
    second, _ = city_index().nearest((-96.80, 32.78), exclude=frozenset({first.id}))
    assert first.name == "Dallas" and second.id != first.id


def test_town_search_is_offline_biggest_first_and_filters_by_state():
    geocoder = RecordingGeocoder()

    places = search_places("Spring", geocoder)
    springfield_mo = search_places("springfield, mo", geocoder)

    assert geocoder.queries == []  # answered offline
    assert len(places) <= 6 and all(p.name.lower().startswith("spring") for p in places)
    assert [(p.name, p.region) for p in springfield_mo] == [("Springfield", "MO")]
    assert springfield_mo[0].time_zone == "America/Chicago"


def test_zip_codes_and_unknown_names_go_to_the_provider():
    result = GeocodeResult("here:x", "Dallas 75201", "TX", (-96.795, 32.778))
    geocoder = RecordingGeocoder([result])

    [place] = search_places("75201", geocoder)
    assert search_places("Zzzyzx Road", geocoder)  # no local match, provider asked

    assert geocoder.queries == ["75201", "Zzzyzx Road"]
    assert (place.id, place.name, place.region, place.time_zone) == (
        "here:x",
        "Dallas 75201",
        "TX",
        "America/Chicago",
    )


def test_here_geocode_names_addresses_and_zips(monkeypatch):
    payload = {
        "items": [
            {
                "id": "a1",
                "title": "75201, Dallas, TX, United States",
                "resultType": "locality",
                "position": {"lat": 32.778, "lng": -96.795},
                "address": {"city": "Dallas", "stateCode": "TX", "postalCode": "75201"},
            },
            {
                "id": "a2",
                "title": "500 Main St, Dallas, TX 75202, United States",
                "resultType": "houseNumber",
                "position": {"lat": 32.78, "lng": -96.80},
                "address": {
                    "houseNumber": "500",
                    "street": "Main St",
                    "city": "Dallas",
                    "stateCode": "TX",
                },
            },
            {"id": "no-position", "title": "?"},
        ]
    }
    seen = {}

    def fake_get_json(provider, url, params, *, timeout):
        seen.update(params)
        return payload

    monkeypatch.setattr(here, "get_json", fake_get_json)
    results = HereClient("key").geocode("dallas", limit=6)

    assert seen["in"] == "countryCode:USA" and seen["apiKey"] == "key"
    assert [(r.id, r.name, r.region) for r in results] == [
        ("here:a1", "Dallas 75201", "TX"),
        ("here:a2", "500 Main St, Dallas", "TX"),
    ]
