// src/services/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Structured API helpers targeting the CineVibe FastAPI backend.
// Reads base URL from import.meta.env.VITE_API_BASE_URL (falls back to http://localhost:8000).
// Gracefully falls back to mock data if the backend server is unreachable.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const BASE = `${API_BASE_URL.replace(/\/+$/, '')}/api`
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

// ── Mock data for graceful offline fallback ──────────────────────────────────
export const MOCK_MOVIES = [
  {
    id: 27205,
    title: 'Inception',
    overview:
      'Dom Cobb is a skilled thief who steals secrets from deep within the subconscious. Offered a chance to reclaim his life, he must attempt the impossible: plant an idea in someone\'s mind.',
    poster_url: `${TMDB_IMG}/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg`,
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    vote_average: 8.8,
    release_year: 2010,
    genres: ['Sci-Fi', 'Thriller', 'Action'],
    match: 96,
    runtime: '2h 28m',
    rating: 'PG-13',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
    hook: 'Layered realities. Impossible heists.',
    providers: {
      flatrate: [
        { name: 'Netflix', logo: null },
        { name: 'Prime Video', logo: null },
      ],
    },
  },
  {
    id: 157336,
    title: 'Interstellar',
    overview:
      'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival. When Earth becomes uninhabitable, Cooper must leave his family behind.',
    poster_url: `${TMDB_IMG}/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`,
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/pbrkL804c8yAv3zBZR4QPEafpAR.jpg',
    vote_average: 8.7,
    release_year: 2014,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    match: 94,
    runtime: '2h 49m',
    rating: 'PG-13',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    hook: 'Big ideas. Even bigger emotions.',
    providers: {
      flatrate: [
        { name: 'Prime Video', logo: null },
        { name: 'Apple TV', logo: null },
      ],
    },
  },
  {
    id: 603,
    title: 'The Matrix',
    overview:
      'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.',
    poster_url: `${TMDB_IMG}/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg`,
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/7u3fh9nfmg4Hb3muJ92ApYWYnmD.jpg',
    vote_average: 8.2,
    release_year: 1999,
    genres: ['Sci-Fi', 'Action'],
    match: 91,
    runtime: '2h 16m',
    rating: 'R',
    director: 'Lana & Lilly Wachowski',
    cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss', 'Hugo Weaving'],
    hook: 'Question your reality. Choose the red pill.',
    providers: {
      flatrate: [
        { name: 'Netflix', logo: null },
        { name: 'Disney+ Hotstar', logo: null },
      ],
    },
  },
  {
    id: 264660,
    title: 'Ex Machina',
    overview:
      'A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence by evaluating the human qualities of a highly advanced humanoid A.I.',
    poster_url: `${TMDB_IMG}/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg`,
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/vL5E4mNq0b0jL4R2iUa8O6xNlA2.jpg',
    vote_average: 7.7,
    release_year: 2014,
    genres: ['Sci-Fi', 'Drama'],
    match: 88,
    runtime: '1h 48m',
    rating: 'R',
    director: 'Alex Garland',
    cast: ['Domhnall Gleeson', 'Alicia Vikander', 'Oscar Isaac'],
    hook: 'There is nothing more human than the will to survive.',
    providers: {
      flatrate: [
        { name: 'Apple TV', logo: null },
      ],
    },
  },
]

export const MOCK_DISCOVER = {
  trending: MOCK_MOVIES,
  action: [
    {
      id: 550,
      title: 'Fight Club',
      overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
      poster_url: `${TMDB_IMG}/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg`,
      backdrop_url: 'https://image.tmdb.org/t/p/w1280/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
      vote_average: 8.4,
      release_year: 1999,
      genres: ['Action', 'Drama'],
      match: 95,
      hook: 'Mischief. Mayhem. Soap.',
      providers: { flatrate: [{ name: 'Prime Video' }] }
    },
    ...MOCK_MOVIES
  ],
  scifi: MOCK_MOVIES,
  feelgood: [
    {
      id: 13,
      title: 'Forrest Gump',
      overview: 'A man with a low IQ has accomplished great things in his life and been present during significant historic events.',
      poster_url: `${TMDB_IMG}/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg`,
      backdrop_url: 'https://image.tmdb.org/t/p/w1280/qdIMHd4sEfJSckfVJfKQvisL02a.jpg',
      vote_average: 8.5,
      release_year: 1994,
      genres: ['Comedy', 'Drama', 'Romance'],
      match: 96,
      hook: 'Life is like a box of chocolates.',
      providers: { flatrate: [{ name: 'Netflix' }] }
    },
    ...MOCK_MOVIES
  ],
  thriller: [
    {
      id: 807,
      title: 'Se7en',
      overview: 'Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.',
      poster_url: `${TMDB_IMG}/6yoghtyTpznpBik8EngEmJskVUO.jpg`,
      backdrop_url: 'https://image.tmdb.org/t/p/w1280/ba4Vu0mK1981F54v9u3n47Q0yXU.jpg',
      vote_average: 8.4,
      release_year: 1995,
      genres: ['Crime', 'Mystery', 'Thriller'],
      match: 93,
      hook: 'Seven deadly sins. Seven ways to die.',
      providers: { flatrate: [{ name: 'Netflix' }, { name: 'Apple TV' }] }
    },
    ...MOCK_MOVIES
  ],
}

const STREAMING_PROVIDER_FALLBACKS = {
  netflix: {
    id: 8,
    movies: [
      { id: 512195, title: 'Red Notice', release_year: 2021, vote_average: 6.3 },
      { id: 661374, title: 'Glass Onion: A Knives Out Mystery', release_year: 2022, vote_average: 7.1 },
      { id: 426426, title: 'Roma', release_year: 2018, vote_average: 7.7 },
      { id: 545609, title: 'Extraction', release_year: 2020, vote_average: 7.1 },
      { id: 405774, title: 'Bird Box', release_year: 2018, vote_average: 6.8 },
      { id: 725201, title: 'The Gray Man', release_year: 2022, vote_average: 6.9 },
      { id: 646380, title: "Don't Look Up", release_year: 2021, vote_average: 7.1 },
      { id: 398978, title: 'The Irishman', release_year: 2019, vote_average: 7.6 },
    ],
  },
  prime: {
    id: 119,
    movies: [
      { id: 157336, title: 'Interstellar', release_year: 2014, vote_average: 8.4 },
      { id: 312221, title: 'Creed', release_year: 2015, vote_average: 7.4 },
      { id: 588228, title: 'The Tomorrow War', release_year: 2021, vote_average: 7.5 },
      { id: 502033, title: 'Sound of Metal', release_year: 2019, vote_average: 7.7 },
      { id: 1008409, title: 'The Burial', release_year: 2023, vote_average: 7.1 },
      { id: 964980, title: 'Air', release_year: 2023, vote_average: 7.4 },
      { id: 416477, title: 'The Big Sick', release_year: 2017, vote_average: 7.3 },
      { id: 484718, title: 'Coming 2 America', release_year: 2021, vote_average: 6.5 },
    ],
  },
  hotstar: {
    id: 122,
    movies: [
      { id: 299534, title: 'Avengers: Endgame', release_year: 2019, vote_average: 8.3 },
      { id: 118340, title: 'Guardians of the Galaxy', release_year: 2014, vote_average: 7.9 },
      { id: 19995, title: 'Avatar', release_year: 2009, vote_average: 7.6 },
      { id: 508442, title: 'Soul', release_year: 2020, vote_average: 8.1 },
      { id: 1022789, title: 'Inside Out 2', release_year: 2024, vote_average: 7.6 },
      { id: 354912, title: 'Coco', release_year: 2017, vote_average: 8.2 },
      { id: 568124, title: 'Encanto', release_year: 2021, vote_average: 7.6 },
      { id: 284054, title: 'Black Panther', release_year: 2018, vote_average: 7.4 },
    ],
  },
  appletv: {
    id: 350,
    movies: [
      { id: 466420, title: 'Killers of the Flower Moon', release_year: 2023, vote_average: 7.5 },
      { id: 776503, title: 'CODA', release_year: 2021, vote_average: 8.0 },
      { id: 516486, title: 'Greyhound', release_year: 2020, vote_average: 7.4 },
      { id: 597891, title: 'Finch', release_year: 2021, vote_average: 7.9 },
      { id: 726759, title: 'Tetris', release_year: 2023, vote_average: 7.7 },
      { id: 441130, title: 'Wolfwalkers', release_year: 2020, vote_average: 8.2 },
      { id: 613093, title: 'On the Rocks', release_year: 2020, vote_average: 6.5 },
      { id: 803700, title: 'Causeway', release_year: 2022, vote_average: 6.6 },
    ],
  },
}

// ── Normaliser: maps backend shape → UI shape ────────────────────────────
export function normalise(item, index = 0) {
  // Rank-tiered match scoring descending from 96%
  const matchValues = [96, 93, 89, 86, 83, 81, 78, 75, 72, 70]
  const hooks = [
    'Layered realities. Impossible heists.',
    'Big ideas. Even bigger emotions.',
    'A mystery that changes everything.',
    'Atmospheric worlds. Human questions.',
    'Action-packed thrills await.',
    'A story you will not forget.',
    'Stunning visuals, deep story.',
    'Pure cinematic experience.',
  ]

  let genres = []
  if (Array.isArray(item.genres)) {
    genres = item.genres
  } else if (typeof item.genres === 'string' && item.genres) {
    genres = item.genres.split('|')
  }

  return {
    id:           item.id,
    title:        item.title || item.name || 'Unknown',
    overview:     item.overview || '',
    poster_url:   item.poster_url || null,
    backdrop_url: item.backdrop_url || null,
    vote_average: typeof item.vote_average === 'number' ? item.vote_average : 0,
    release_year: item.release_year || null,
    genres:       genres,
    match:        item.match || matchValues[index % matchValues.length],
    runtime:      item.runtime || null,
    rating:       item.rating || null,
    director:     item.director || null,
    cast:         item.cast || [],
    hook:         item.hook || hooks[index % hooks.length],
    providers:    item.providers || { country: null, justwatch_link: null, flatrate: [], rent: [], buy: [] },
  }
}

// ── API Functions ────────────────────────────────────────────────────────────

/**
 * fetchRecommendations(title: string, limit?: number)
 * Calls GET /api/recommend?title={title}&limit={limit}
 * Returns { query, found, movies, isOffline: boolean }
 */
export async function fetchRecommendations(title, limit = 8) {
  try {
    const res = await fetch(
      `${BASE}/recommend?title=${encodeURIComponent(title)}&limit=${limit}`,
      { signal: AbortSignal.timeout(9000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      query:     data.query,
      found:     data.found !== false,
      movies:    (data.results || []).map(normalise),
      isOffline: false,
    }
  } catch (err) {
    console.warn('[api] fetchRecommendations: backend unreachable, falling back to cached mock data', err)
    return {
      query:     title,
      found:     true,
      movies:    MOCK_MOVIES.map(normalise),
      isOffline: true,
    }
  }
}

/**
 * fetchDiscoverMovies(mood: string, mediaType: string)
 * Calls GET /api/discover?mood={mood}&type={mediaType}
 * Returns { movies: Movie[], isOffline: boolean }
 */
export async function fetchDiscoverMovies(mood = 'trending', mediaType = 'movie') {
  try {
    const res = await fetch(
      `${BASE}/discover?mood=${encodeURIComponent(mood)}&type=${encodeURIComponent(mediaType)}`,
      { signal: AbortSignal.timeout(9000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const results = data.results || []
    if (results.length === 0) {
      console.warn(`[api] fetchDiscoverMovies: no results for ${mood}, falling back to trending demo data`)
      return {
        movies: MOCK_DISCOVER.trending.map(normalise),
        isOffline: false,
      }
    }
    return {
      movies:    results.map(normalise),
      isOffline: false,
    }
  } catch (err) {
    console.warn('[api] fetchDiscoverMovies: backend unreachable, falling back to cached mock data', err)
    const fallbackList = MOCK_DISCOVER[mood] || MOCK_MOVIES
    return {
      movies:    fallbackList.map(normalise),
      isOffline: true,
    }
  }
}

export async function fetchProviderMovies(platform) {
  const provider = STREAMING_PROVIDER_FALLBACKS[platform]
  if (!provider) throw new Error(`Unknown streaming platform: ${platform}`)

  try {
    const res = await fetch(
      `${BASE}/discover?provider_id=${provider.id}&type=movie`,
      { signal: AbortSignal.timeout(9000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const results = data.results || []
    if (!results.length) {
      console.warn(`[api] fetchProviderMovies: no results for ${platform}, using curated titles`)
      return { movies: provider.movies.map(normalise), isOffline: false }
    }
    return { movies: results.map(normalise), isOffline: false }
  } catch (err) {
    console.warn(`[api] fetchProviderMovies: request failed for ${platform}, using curated titles`, err)
    return { movies: provider.movies.map(normalise), isOffline: true }
  }
}

/**
 * fetchTrailerKey(id: number, mediaType: string)
 * Calls GET /api/trailer?id={id}&type={mediaType}
 * Returns { id, media_type, trailer_key: string | null, embed_url: string | null }
 */
export async function fetchTrailerKey(id, mediaType = 'movie') {
  try {
    const res = await fetch(
      `${BASE}/trailer?id=${id}&type=${encodeURIComponent(mediaType)}`,
      { signal: AbortSignal.timeout(7000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      trailer_key: data.trailer_key || null,
      embed_url:   data.embed_url || null,
    }
  } catch (err) {
    console.warn('[api] fetchTrailerKey: trailer request failed', err)
    return {
      trailer_key: null,
      embed_url:   null,
    }
  }
}

// ── Backwards-compatible aliases ─────────────────────────────────────────────
export const getRecommendations = (title, limit) =>
  fetchRecommendations(title, limit).then(res => res)

export const discoverMovies = (mood, type) =>
  fetchDiscoverMovies(mood, type).then(res => res.movies)

export const getTrailer = (id, type) =>
  fetchTrailerKey(id, type)

/**
 * fetchCompatibility(title1: string, title2: string, topN?: number)
 * Calls GET /api/compatibility?title1={t1}&title2={t2}&top_n={topN}
 * Returns { title1, title2, found1, found2, results, isOffline: boolean }
 */
export async function fetchCompatibility(title1, title2, topN = 5) {
  try {
    const res = await fetch(
      `${BASE}/compatibility?title1=${encodeURIComponent(title1)}&title2=${encodeURIComponent(title2)}&top_n=${topN}`,
      { signal: AbortSignal.timeout(9000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      title1:   data.title1,
      title2:   data.title2,
      found1:   data.found1,
      found2:   data.found2,
      results:  data.results || [],
      isOffline: false,
    }
  } catch (err) {
    console.warn('[api] fetchCompatibility: request failed', err)
    return {
      title1,
      title2,
      found1:    false,
      found2:    false,
      results:   [],
      isOffline: true,
    }
  }
}

/**
 * fetchWatchProviders(id: number, mediaType?: string)
 * Hits the TMDB /movie/{id}/watch/providers endpoint (via backend or direct fallback),
 * and extracts the JustWatch link specifically for India (IN).
 * Returns { justwatch_link: string | null, providers: object, results: object }
 */
export async function fetchWatchProviders(id, mediaType = 'movie') {
  try {
    const res = await fetch(
      `${BASE}/watch-providers?id=${id}&type=${encodeURIComponent(mediaType)}`,
      { signal: AbortSignal.timeout(7000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      justwatch_link: data.justwatch_link || data.results?.IN?.link || null,
      providers: data.providers || null,
      results: data.results || {},
    }
  } catch (err) {
    console.warn('[api] fetchWatchProviders: request failed', err)
    return {
      justwatch_link: null,
      providers: null,
      results: {},
    }
  }
}
