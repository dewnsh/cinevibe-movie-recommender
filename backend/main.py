"""
main.py  –  CineVibe Backend | FastAPI Application Entry Point
==============================================================
Endpoints
---------
GET /api/health                              -> service liveness check
GET /api/recommend?title=&limit=            -> content-based recommendations (TMDB-enriched)
GET /api/recommend-ml?title=&top_n=         -> pure ML recommendations (pickle-powered, fast)
GET /api/compatibility?title1=&title2=      -> dual-user taste-midpoint recommendations
GET /api/discover?mood=&type=               -> mood-based TMDB discovery
GET /api/trailer?id=&type=                  -> YouTube trailer key lookup

Dev server
----------
    cd backend
    uvicorn main:app --reload --port 8000

Interactive docs
----------------
    http://127.0.0.1:8000/docs          (Swagger UI)
    http://127.0.0.1:8000/redoc         (ReDoc)
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pydantic import BaseModel

from config import APP_TITLE, APP_VERSION, APP_DESCRIPTION, CORS_ORIGINS
from services import tmdb as tmdb_svc
from services import recommender as rec_svc

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("cinevibe.main")


# ---------------------------------------------------------------------------
# Lifespan – initialise / teardown shared resources
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup:  load pickle artifacts + create TMDB HTTP client.
    Shutdown: gracefully close the HTTP client.
    """
    logger.info("CineVibe API starting up …")

    # 1. Warm up TMDB async client
    tmdb_svc.init_client()

    # 2. Load recommendation artifacts into memory
    rec_svc.load_artifacts()

    logger.info("Startup complete. Ready to serve requests.")
    yield

    # Teardown
    await tmdb_svc.close_client()
    logger.info("CineVibe API shut down cleanly.")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS middleware (dynamically allows FRONTEND_URL + localhost)
# ---------------------------------------------------------------------------
allowed_origins = list(CORS_ORIGINS)
frontend_env = os.getenv("FRONTEND_URL", "")
if frontend_env:
    for u in frontend_env.split(","):
        u_clean = u.strip()
        if u_clean and u_clean not in allowed_origins:
            allowed_origins.append(u_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from your Vercel URL and any domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Response models (Pydantic)
# ---------------------------------------------------------------------------
class Provider(BaseModel):
    name: str
    logo: str | None = None


class ProvidersDetail(BaseModel):
    country:        str | None = None
    justwatch_link: str | None = None
    flatrate: list[Provider] = []
    rent:     list[Provider] = []
    buy:      list[Provider] = []


class MovieDetail(BaseModel):
    id:           int | None = None
    title:        str
    overview:     str = ""
    poster_url:   str | None = None
    backdrop_url: str | None = None
    vote_average: float = 0.0
    release_year: int | None = None
    genres:       list[str] = []
    providers:    ProvidersDetail = ProvidersDetail()
    media_type:   str = "movie"


class RecommendResponse(BaseModel):
    query:   str
    found:   bool
    results: list[MovieDetail]


class DiscoverResponse(BaseModel):
    mood:       str
    media_type: str
    results:    list[MovieDetail]


class TrailerResponse(BaseModel):
    id:         int
    media_type: str
    trailer_key: str | None = None
    embed_url:   str | None = None


class HealthResponse(BaseModel):
    status:  str
    version: str


class MLRecommendItem(BaseModel):
    rank:   int
    id:     int
    title:  str
    genres: list[str] = []


class MLRecommendResponse(BaseModel):
    query:   str
    found:   bool
    top_n:   int
    results: list[MLRecommendItem]


class CompatibilityItem(BaseModel):
    rank:                int
    id:                  int
    title:               str
    genres:              list[str] = []
    compatibility_score: float = 0.0


class CompatibilityResponse(BaseModel):
    title1:  str
    title2:  str
    found1:  bool
    found2:  bool
    results: list[CompatibilityItem]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["Utility"],
    summary="Service liveness check",
)
async def health() -> dict[str, str]:
    """Returns `{"status": "ok"}` when the service is up and artifacts are loaded."""
    return {"status": "ok", "version": APP_VERSION}


@app.get(
    "/api/recommend",
    response_model=RecommendResponse,
    tags=["Recommendations"],
    summary="Content-based movie recommendations",
)
async def recommend(
    title: str = Query(
        ...,
        description="Movie title to find recommendations for (case-insensitive).",
        examples={"inception": {"value": "Inception"}},
        min_length=1,
    ),
    limit: int = Query(
        default=8,
        ge=1,
        le=10,
        description="Number of recommendations to return (1–10, default 8).",
    ),
) -> dict[str, Any]:
    """
    **Content-based recommendation endpoint.**

    Performs a case-insensitive lookup in the local TMDB 5000 dataset,
    retrieves the top similar movie IDs from the pre-computed similarity
    artifact, then enriches each result with live TMDB data (poster,
    rating, streaming providers).

    Falls back to TMDB popular movies if the title is not found locally,
    so the response is always useful rather than a bare error.
    """
    try:
        result = await rec_svc.get_recommendations(movie_title=title, limit=limit)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return result


@app.get(
    "/api/recommend-ml",
    response_model=MLRecommendResponse,
    tags=["Recommendations"],
    summary="Pure ML recommendations powered by cosine-similarity pickle",
)
async def recommend_ml(
    title: str = Query(
        ...,
        description="Movie title to find recommendations for (case-insensitive).",
        examples={"inception": {"value": "Inception"}},
        min_length=1,
        alias="title",
    ),
    top_n: int = Query(
        default=5,
        ge=1,
        le=10,
        description="Number of recommendations to return (1–10, default 5).",
    ),
) -> dict[str, Any]:
    """
    **Pure ML recommendation endpoint.**

    Performs a case-insensitive lookup in the pre-loaded ``movies.pkl``
    DataFrame, resolves the top ``top_n`` similar movie IDs from
    ``similarity.pkl`` (pre-computed cosine-similarity matrix), and returns
    lightweight result objects that include each movie's **TMDB ID** so the
    frontend can independently call ``/api/trailer`` or fetch posters via
    the TMDB image CDN.

    This endpoint makes **zero** live network calls – all data comes from
    the in-memory pickle artifacts loaded at startup.  Typical latency is
    sub-millisecond once the server is warm.

    Returns ``found: false`` with an empty ``results`` list when the title
    is not present in the local dataset (no fallback to TMDB popular here).
    Use ``/api/recommend`` if you want TMDB-enriched results with a fallback.
    """
    import asyncio

    loop = asyncio.get_event_loop()
    try:
        # get_ml_recommendations is a synchronous CPU-bound function; run it
        # on the default thread pool to avoid blocking the event loop.
        result = await loop.run_in_executor(
            None, rec_svc.get_ml_recommendations, title, top_n
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return {**result, "top_n": top_n}


@app.get(
    "/api/discover",
    response_model=DiscoverResponse,
    tags=["Discovery"],
    summary="Mood-based TMDB discovery",
)
async def discover(
    mood: str = Query(
        default="action",
        description=(
            "Mood / genre filter. One of: action, thriller, horror, scifi, "
            "feelgood, romance, drama, animation, adventure, mystery, crime, fantasy."
        ),
        examples={"scifi": {"value": "scifi"}, "thriller": {"value": "thriller"}},
    ),
    type: str = Query(
        default="movie",
        description="Media type: 'movie' or 'tv'.",
        examples={"movie": {"value": "movie"}, "tv": {"value": "tv"}},
    ),
    provider_id: int | None = Query(
        default=None,
        ge=1,
        description="TMDB watch provider ID for US movie discovery.",
    ),
) -> dict[str, Any]:
    """
    **Mood-driven discovery endpoint.**

    Maps a mood keyword to one or more TMDB genre IDs and returns the most
    popular matching titles from TMDB Discover, filtered to English-language
    content with at least 200 votes.

    Supported moods: `action`, `thriller`, `horror`, `scifi`, `feelgood`,
    `romance`, `drama`, `animation`, `adventure`, `mystery`, `crime`, `fantasy`.
    """
    media_type = type if type in ("movie", "tv") else "movie"
    try:
        if provider_id is not None:
            results = await tmdb_svc.discover_by_provider(provider_id=provider_id)
            media_type = "movie"
        else:
            results = await tmdb_svc.discover_by_mood(mood=mood, media_type=media_type)
    except Exception as exc:
        logger.error("discover error: %s", exc)
        raise HTTPException(status_code=502, detail="TMDB discovery request failed.")

    return {"mood": mood, "media_type": media_type, "results": results}


@app.get(
    "/api/trailer",
    response_model=TrailerResponse,
    tags=["Trailers"],
    summary="YouTube trailer key for a movie or TV show",
)
async def trailer(
    id: int = Query(
        ...,
        description="TMDB numeric movie or TV show ID.",
        examples={"inception": {"value": 27205}},
    ),
    type: str = Query(
        default="movie",
        description="Media type: 'movie' or 'tv'.",
        examples={"movie": {"value": "movie"}, "tv": {"value": "tv"}},
    ),
) -> dict[str, Any]:
    """
    **Trailer lookup endpoint.**

    Fetches the YouTube video key for embedding a trailer modal in the
    frontend.  Returns `trailer_key: null` (not a 404) when no trailer is
    available, so the UI can gracefully hide the play button.

    The `embed_url` field is the ready-to-use YouTube embed URL:
    `https://www.youtube.com/embed/{key}?autoplay=1`
    """
    media_type = type if type in ("movie", "tv") else "movie"
    try:
        key = await tmdb_svc.get_trailer_key(tmdb_id=id, media_type=media_type)
    except Exception as exc:
        logger.error("trailer lookup error: %s", exc)
        raise HTTPException(status_code=502, detail="TMDB trailer request failed.")

    embed_url = f"https://www.youtube.com/embed/{key}?autoplay=1" if key else None
    return {"id": id, "media_type": media_type, "trailer_key": key, "embed_url": embed_url}


@app.get(
    "/api/watch-providers",
    tags=["Watch Providers"],
    summary="TMDB watch providers and JustWatch link (specifically for India)",
)
async def watch_providers(
    id: int = Query(
        ...,
        description="TMDB numeric movie or TV show ID.",
        examples={"inception": {"value": 27205}},
    ),
    type: str = Query(
        default="movie",
        description="Media type: 'movie' or 'tv'.",
        examples={"movie": {"value": "movie"}, "tv": {"value": "tv"}},
    ),
) -> dict[str, Any]:
    """
    **Watch Providers lookup endpoint.**

    Hits TMDB `/{media_type}/{id}/watch/providers` and extracts the specific
    JustWatch link for India (`results.IN.link`), falling back gracefully if needed.
    """
    media_type = type if type in ("movie", "tv") else "movie"
    try:
        return await tmdb_svc.get_watch_providers(tmdb_id=id, media_type=media_type)
    except Exception as exc:
        logger.error("watch providers lookup error: %s", exc)
        raise HTTPException(status_code=502, detail="TMDB watch providers request failed.")


@app.get(
    "/api/compatibility",
    response_model=CompatibilityResponse,
    tags=["Recommendations"],
    summary="Dual-User Compatibility – find the taste midpoint between two movies",
)
async def compatibility(
    title1: str = Query(
        ...,
        description="First movie title (case-insensitive).",
        examples={"inception": {"value": "Inception"}},
        min_length=1,
    ),
    title2: str = Query(
        ...,
        description="Second movie title (case-insensitive).",
        examples={"interstellar": {"value": "Interstellar"}},
        min_length=1,
    ),
    top_n: int = Query(
        default=5,
        ge=1,
        le=10,
        description="Number of compromise recommendations to return (1–10, default 5).",
    ),
) -> dict[str, Any]:
    """
    **Dual-User Compatibility endpoint.**

    Accepts two movie titles and returns the top movies that sit at the
    *taste midpoint* between them — perfect for finding a film that both
    users will enjoy.

    **Algorithm:**
    1. Locate both movies in the ``movies.pkl`` DataFrame.
    2. For each movie, reconstruct a proxy similarity score vector from
       its ranked recommendation list in ``similarity.pkl`` using a
       rank-decay formula: ``score = 1 / (rank + 1)``.
    3. Average the two proxy vectors element-wise to find the midpoint.
    4. Return the ``top_n`` candidates with the highest midpoint scores,
       excluding the two query movies themselves.

    This endpoint makes **zero** live network calls – all data comes from
    the in-memory pickle artifacts.

    Returns ``found1: false`` / ``found2: false`` when a title is not
    present in the local dataset (results may still be non-empty if the
    other title was found).
    """
    import asyncio

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None,
            rec_svc.get_compatibility_recommendations,
            title1,
            title2,
            top_n,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return result
