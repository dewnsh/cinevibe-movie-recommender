"""
services/tmdb.py  –  CineVibe | Async TMDB API Client
======================================================
All network I/O is done with a single shared httpx.AsyncClient that is
created once at application startup and closed at shutdown (lifecycle
managed in main.py via FastAPI lifespan).

Public interface
----------------
fetch_movie_details(tmdb_id)         -> dict
discover_by_mood(mood, media_type)   -> list[dict]
get_trailer_key(tmdb_id, media_type) -> str | None

Mood -> genre mapping
---------------------
scifi      -> 878  (Science Fiction)
thriller   -> 53   (Thriller)
horror     -> 27   (Horror)
feelgood   -> 35   (Comedy) + 10751 (Family)
action     -> 28   (Action)
romance    -> 10749 (Romance)
drama      -> 18   (Drama)
animation  -> 16   (Animation)
"""

import logging
from typing import Any

import httpx

from config import (
    TMDB_API_KEY,
    TMDB_BASE_URL,
    TMDB_IMAGE_BASE,
    PROVIDER_COUNTRIES,
)

logger = logging.getLogger("cinevibe.tmdb")

# ---------------------------------------------------------------------------
# Module-level client – initialised by main.py lifespan
# ---------------------------------------------------------------------------
_client: httpx.AsyncClient | None = None

MOOD_GENRE_MAP: dict[str, list[int]] = {
    "scifi":     [878],
    "thriller":  [53],
    "horror":    [27],
    "feelgood":  [35, 10751],
    "action":    [28],
    "romance":   [10749],
    "drama":     [18],
    "animation": [16],
    "adventure": [12],
    "mystery":   [9648],
    "crime":     [80],
    "fantasy":   [14],
}


def init_client() -> None:
    """Create the shared AsyncClient. Call once at app startup."""
    global _client
    _client = httpx.AsyncClient(
        base_url=TMDB_BASE_URL,
        params={"api_key": TMDB_API_KEY, "language": "en-US"},
        timeout=10.0,
    )
    logger.info("TMDB AsyncClient initialised.")


async def close_client() -> None:
    """Close the shared AsyncClient. Call once at app shutdown."""
    global _client
    if _client:
        await _client.aclose()
        _client = None
        logger.info("TMDB AsyncClient closed.")


def _get_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError("TMDB client is not initialised. Call init_client() first.")
    return _client


def _poster_url(path: str | None, size: str = "w500") -> str | None:
    """Return a full TMDB image URL or None when path is absent."""
    if not path:
        return None
    return f"{TMDB_IMAGE_BASE}/{size}{path}"


def _extract_providers(watch_data: dict) -> dict[str, Any]:
    """
    Pull stream/rent/buy provider lists for the first matching country in
    PROVIDER_COUNTRIES.  Returns a dict with keys: country, justwatch_link,
    flatrate, rent, buy.

    The ``justwatch_link`` field is the canonical JustWatch deep-link that
    TMDB embeds in the watch/providers response for each country.  The
    frontend uses it to open the exact streaming page for the film.
    """
    results: dict = watch_data.get("results", {})
    for country in PROVIDER_COUNTRIES:
        if country in results:
            entry = results[country]
            return {
                "country": country,
                # Direct JustWatch page for this movie in the matched country
                "justwatch_link": entry.get("link") or None,
                "flatrate": [
                    {"name": p["provider_name"], "logo": _poster_url(p.get("logo_path"), "w92")}
                    for p in entry.get("flatrate", [])
                ],
                "rent": [
                    {"name": p["provider_name"], "logo": _poster_url(p.get("logo_path"), "w92")}
                    for p in entry.get("rent", [])
                ],
                "buy": [
                    {"name": p["provider_name"], "logo": _poster_url(p.get("logo_path"), "w92")}
                    for p in entry.get("buy", [])
                ],
            }
    return {"country": None, "justwatch_link": None, "flatrate": [], "rent": [], "buy": []}


# ---------------------------------------------------------------------------
# Public API functions
# ---------------------------------------------------------------------------

async def fetch_movie_details(tmdb_id: int) -> dict[str, Any]:
    """
    Fetch full movie details + streaming providers for a single TMDB movie ID.

    Hits two endpoints concurrently:
      - /movie/{id}?append_to_response=watch/providers
      - (providers are embedded via append_to_response for efficiency)

    Returns
    -------
    dict with keys: id, title, overview, poster_url, backdrop_url,
                    vote_average, release_year, genres, providers
    """
    client = _get_client()
    try:
        resp = await client.get(
            f"/movie/{tmdb_id}",
            params={"append_to_response": "watch/providers"},
        )
        resp.raise_for_status()
        data: dict = resp.json()
    except httpx.HTTPStatusError as exc:
        logger.warning("TMDB movie %s returned %s", tmdb_id, exc.response.status_code)
        return _empty_movie_detail(tmdb_id)
    except httpx.RequestError as exc:
        logger.error("Network error fetching movie %s: %s", tmdb_id, exc)
        return _empty_movie_detail(tmdb_id)

    watch_data = data.get("watch/providers", {})
    release_date: str = data.get("release_date", "")
    release_year: int | None = int(release_date[:4]) if release_date else None

    return {
        "id":           data.get("id"),
        "title":        data.get("title", "Unknown"),
        "overview":     data.get("overview", ""),
        "poster_url":   _poster_url(data.get("poster_path")),
        "backdrop_url": _poster_url(data.get("backdrop_path"), "w1280"),
        "vote_average": round(data.get("vote_average", 0.0), 1),
        "release_year": release_year,
        "genres":       [g["name"] for g in data.get("genres", [])],
        "providers":    _extract_providers(watch_data),
    }


async def discover_by_mood(
    mood: str,
    media_type: str = "movie",
) -> list[dict[str, Any]]:
    """
    Return a curated list of popular/trending items for a given mood string.

    Parameters
    ----------
    mood       : one of the keys in MOOD_GENRE_MAP (case-insensitive)
    media_type : 'movie' or 'tv'

    Strategy
    --------
    1. Map mood -> genre IDs.
    2. Call /discover/{media_type} filtered by those genre IDs, sorted by
       popularity descending.
    3. Return the first 20 results with poster, rating, year, and genres.

    Falls back to popular titles for unknown moods.
    """
    if media_type not in ("movie", "tv"):
        media_type = "movie"

    genre_ids = MOOD_GENRE_MAP.get(mood.lower(), [])
    client    = _get_client()

    params: dict[str, Any] = {
        "sort_by":           "popularity.desc",
        "vote_count.gte":    200,
        "with_original_language": "en",
        "page":              1,
    }
    if genre_ids:
        params["with_genres"] = ",".join(str(g) for g in genre_ids)

    try:
        resp = await client.get(f"/discover/{media_type}", params=params)
        resp.raise_for_status()
        results: list[dict] = resp.json().get("results", [])
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        logger.error("discover_by_mood error (%s/%s): %s", mood, media_type, exc)
        return []

    output = []
    title_key = "title" if media_type == "movie" else "name"
    date_key  = "release_date" if media_type == "movie" else "first_air_date"

    for item in results[:20]:
        raw_date: str = item.get(date_key, "")
        output.append(
            {
                "id":           item.get("id"),
                "title":        item.get(title_key, "Unknown"),
                "overview":     item.get("overview", ""),
                "poster_url":   _poster_url(item.get("poster_path")),
                "backdrop_url": _poster_url(item.get("backdrop_path"), "w1280"),
                "vote_average": round(item.get("vote_average", 0.0), 1),
                "release_year": int(raw_date[:4]) if raw_date else None,
                "genre_ids":    item.get("genre_ids", []),
                "media_type":   media_type,
            }
        )
    return output


async def discover_by_provider(provider_id: int) -> list[dict[str, Any]]:
    """Return popular movies on a streaming provider in the US."""
    client = _get_client()
    params = {
        "with_watch_providers": provider_id,
        "watch_region": "US",
        "sort_by": "popularity.desc",
        "page": 1,
    }

    try:
        resp = await client.get("/discover/movie", params=params)
        resp.raise_for_status()
        results: list[dict] = resp.json().get("results", [])
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        logger.error("discover_by_provider error (%s): %s", provider_id, exc)
        return []

    output = []
    for item in results[:20]:
        raw_date: str = item.get("release_date", "")
        output.append(
            {
                "id": item.get("id"),
                "title": item.get("title", "Unknown"),
                "overview": item.get("overview", ""),
                "poster_url": _poster_url(item.get("poster_path")),
                "backdrop_url": _poster_url(item.get("backdrop_path"), "w1280"),
                "vote_average": round(item.get("vote_average", 0.0), 1),
                "release_year": int(raw_date[:4]) if raw_date else None,
                "genre_ids": item.get("genre_ids", []),
                "media_type": "movie",
            }
        )
    return output


async def get_trailer_key(
    tmdb_id: int,
    media_type: str = "movie",
) -> str | None:
    """
    Fetch the YouTube trailer key for a TMDB movie or TV show.

    Prefers an official trailer, then any YouTube video.
    Returns None when no suitable video is found.

    Parameters
    ----------
    tmdb_id    : TMDB numeric ID
    media_type : 'movie' or 'tv'

    Returns
    -------
    YouTube video key string (e.g. 'YoHD9XEInc0') or None.
    """
    if media_type not in ("movie", "tv"):
        media_type = "movie"

    client = _get_client()
    try:
        resp = await client.get(f"/{media_type}/{tmdb_id}/videos")
        resp.raise_for_status()
        videos: list[dict] = resp.json().get("results", [])
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        logger.warning("Trailer fetch failed for %s/%s: %s", media_type, tmdb_id, exc)
        return None

    # Priority 1: official YouTube Trailer
    for v in videos:
        if v.get("site") == "YouTube" and v.get("type") == "Trailer" and v.get("official"):
            return v["key"]

    # Priority 2: any YouTube Trailer
    for v in videos:
        if v.get("site") == "YouTube" and v.get("type") == "Trailer":
            return v["key"]

    # Priority 3: any YouTube video at all
    for v in videos:
        if v.get("site") == "YouTube":
            return v["key"]

    return None


async def get_watch_providers(
    tmdb_id: int,
    media_type: str = "movie",
) -> dict[str, Any]:
    """
    Fetch raw and processed watch/providers for a movie or TV show.
    Specifically extracts the JustWatch link for India (IN), with fallbacks.
    """
    if media_type not in ("movie", "tv"):
        media_type = "movie"

    client = _get_client()
    try:
        resp = await client.get(f"/{media_type}/{tmdb_id}/watch/providers")
        resp.raise_for_status()
        data = resp.json()
        results: dict = data.get("results", {})
        
        # Priority: India (IN)
        in_entry = results.get("IN", {})
        justwatch_link = in_entry.get("link") or None

        # Fallback to PROVIDER_COUNTRIES if IN link not found
        if not justwatch_link:
            for country in PROVIDER_COUNTRIES:
                if country in results and results[country].get("link"):
                    justwatch_link = results[country]["link"]
                    break

        # Ultimate fallback: first country that has a link
        if not justwatch_link and results:
            for _, c_val in results.items():
                if isinstance(c_val, dict) and c_val.get("link"):
                    justwatch_link = c_val["link"]
                    break

        return {
            "id": tmdb_id,
            "media_type": media_type,
            "justwatch_link": justwatch_link,
            "providers": _extract_providers(data),
            "results": results,
        }
    except Exception as exc:
        logger.warning("Watch providers fetch failed for %s/%s: %s", media_type, tmdb_id, exc)
        return {
            "id": tmdb_id,
            "media_type": media_type,
            "justwatch_link": None,
            "providers": {"country": None, "justwatch_link": None, "flatrate": [], "rent": [], "buy": []},
            "results": {},
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _empty_movie_detail(tmdb_id: int) -> dict[str, Any]:
    """Return a safe empty-shell dict when a TMDB call fails."""
    return {
        "id":           tmdb_id,
        "title":        "Unknown",
        "overview":     "",
        "poster_url":   None,
        "backdrop_url": None,
        "vote_average": 0.0,
        "release_year": None,
        "genres":       [],
        "providers":    {"country": None, "flatrate": [], "rent": [], "buy": []},
    }
