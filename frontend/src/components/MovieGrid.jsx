// src/components/MovieGrid.jsx
import { useState, useCallback } from 'react'
import { Dices, Loader2 } from 'lucide-react'
import MovieCard from './MovieCard'

// ── Surprise Me – picks a random title from a curated seed list and calls
//    /api/recommend-ml to get ML picks, then surfaces one at random. ──────────
const SURPRISE_SEEDS = [
  'Inception', 'The Dark Knight', 'Interstellar', 'Parasite', 'The Matrix',
  'Pulp Fiction', 'Fight Club', 'Forrest Gump', 'Goodfellas', 'The Godfather',
  'Spirited Away', 'Your Name', 'Whiplash', 'La La Land', 'Arrival',
  'Mad Max: Fury Road', 'The Revenant', 'Blade Runner 2049', 'Joker', 'Dune',
]

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '')

async function fetchSurpriseMovie() {
  const seed = SURPRISE_SEEDS[Math.floor(Math.random() * SURPRISE_SEEDS.length)]
  const res = await fetch(
    `${API_BASE}/api/recommend-ml?title=${encodeURIComponent(seed)}&top_n=10`,
    { signal: AbortSignal.timeout(7000) }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const picks = data.results ?? []
  if (!picks.length) return null
  return picks[Math.floor(Math.random() * picks.length)]
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#13161b] border border-white/[0.07] animate-pulse">
      <div className="aspect-[2/3] bg-zinc-800/80" />
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-zinc-700/60 rounded" />
          <div className="h-3 w-12 bg-zinc-800 rounded" />
        </div>
        <div className="h-4 w-3/4 bg-zinc-700/70 rounded" />
        <div className="h-3 w-full bg-zinc-800/80 rounded" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3.5 w-14 bg-zinc-800 rounded" />
          <div className="h-3.5 w-10 bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function MovieGrid({
  movies,
  loading,
  headline,
  subline,
  matchLabel,
  selectedMovie,
  onSelect,
  watchlist,
  onWatchlistToggle,
  watchedMovieIds,
  onWatchedToggle,
  isWatchlistView,
  onPickFromWatchlist,
}) {
  const [surpriseLoading, setSurpriseLoading] = useState(false)
  const [surpriseError, setSurpriseError] = useState(null)

  const handleSurpriseMe = useCallback(async () => {
    setSurpriseLoading(true)
    setSurpriseError(null)
    try {
      const pick = await fetchSurpriseMovie()
      if (pick) {
        onSelect({
          id: pick.id,
          title: pick.title,
          overview: '',
          poster_url: null,
          backdrop_url: null,
          vote_average: 0,
          release_year: null,
          genres: pick.genres ?? [],
          match: Math.floor(Math.random() * 15) + 85,
          hook: 'A surprise pick from your ML engine.',
          providers: { country: null, justwatch_link: null, flatrate: [], rent: [], buy: [] },
        })
      } else {
        setSurpriseError('No pick found — try again!')
      }
    } catch {
      setSurpriseError('Could not reach backend.')
    } finally {
      setSurpriseLoading(false)
    }
  }, [onSelect])

  return (
    <section className="max-w-7xl mx-auto px-6 pt-6 pb-16">
      {/* Section header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white leading-tight">{headline}</h2>
          {subline && <p className="text-zinc-500 text-sm mt-0.5">{subline}</p>}
        </div>

        {/* Surprise Me button */}
        <div className="flex flex-col items-end gap-1">
          {isWatchlistView && (
            <button
              onClick={onPickFromWatchlist}
              className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5
                text-sm text-white hover:bg-[#e50914]/10 hover:border-[#e50914]/30 hover:text-[#e50914]
                transition-all duration-200 cursor-pointer"
              title="Pick a random movie from your watchlist"
            >
              <Dices size={14} />
              Pick For Me
            </button>
          )}
          <button
            onClick={handleSurpriseMe}
            disabled={surpriseLoading}
            className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5
              text-sm text-white hover:bg-[#e50914]/10 hover:border-[#e50914]/30 hover:text-[#e50914]
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
            title="Let the ML engine pick a random movie for you"
          >
            {surpriseLoading ? (
              <Loader2 size={14} className="animate-spin text-[#e50914]" />
            ) : (
              <Dices size={14} className="group-hover:rotate-12 transition-transform duration-200" />
            )}
            {surpriseLoading ? 'Picking…' : 'Surprise Me'}
          </button>
          {surpriseError && (
            <span className="text-[10px] text-amber-400">{surpriseError}</span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                matchLabel={matchLabel}
                onSelect={onSelect}
                inWatchlist={watchlist.some((w) => w.id === movie.id)}
                onWatchlistToggle={onWatchlistToggle}
                isWatched={watchedMovieIds.includes(movie.id)}
                onWatchedToggle={onWatchedToggle}
              />
            ))}
      </div>

      {/* Empty state */}
      {!loading && movies.length === 0 && (
        <div className="text-center py-24 text-zinc-600">
          <p className="text-5xl mb-4">🎬</p>
          <p className="text-lg font-semibold">No movies found.</p>
          <p className="text-sm mt-1">Try a different search or mood.</p>
        </div>
      )}
    </section>
  )
}
