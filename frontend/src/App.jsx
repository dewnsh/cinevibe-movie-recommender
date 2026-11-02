import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AlertCircle, WifiOff, Shuffle, ScanFace } from 'lucide-react'
import Navbar from './components/Navbar'
import HeroSearch from './components/HeroSearch'
import FilterBar from './components/FilterBar'
import MovieGrid from './components/MovieGrid'
import MovieDetailModal from './components/MovieDetailModal'
import CompatibilityMixer from './components/CompatibilityMixer'
import EmotionScanner from './components/EmotionScanner'
import { fetchRecommendations, fetchDiscoverMovies, fetchProviderMovies } from './services/api'

const OTT_LABELS = {
  netflix: 'NETFLIX',
  prime: 'PRIME VIDEO',
  hotstar: 'DISNEY+ HOTSTAR',
  appletv: 'APPLE TV',
}

export default function App() {
  const [mediaType, setMediaType] = useState('movie')
  const [activeMood, setActiveMood] = useState('trending')
  const [activeOTT, setActiveOTT] = useState([])
  const [movies, setMovies] = useState([])
  const [trendingMovies, setTrendingMovies] = useState([])
  const [providerMovies, setProviderMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const providerRequestId = useRef(0)
  const toastTimeout = useRef(null)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [isWatchlistView, setIsWatchlistView] = useState(false)
  const [watchedMovieIds, setWatchedMovieIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cinevibe_watched') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch (error) {
      console.warn('Failed to load watched movies from localStorage', error)
      return []
    }
  })
  const [hideWatched, setHideWatched] = useState(() => {
    try {
      return localStorage.getItem('cinevibe_hide_watched') === 'true'
    } catch (error) {
      console.warn('Failed to load Hide Watched preference from localStorage', error)
      return false
    }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [headline, setHeadline] = useState('TRENDING TONIGHT')
  const [subline, setSubline] = useState('Most streamed and critically acclaimed cinema right now')
  const [showCompatibility, setShowCompatibility] = useState(false)
  const [showVibeCheck, setShowVibeCheck] = useState(false)

  // Error & offline banners
  const [isOffline, setIsOffline] = useState(false)
  const [searchNotice, setSearchNotice] = useState(null)

  // Load watchlist from localStorage
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('cinevibe_watchlist')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Persist watchlist changes
  useEffect(() => {
    try {
      localStorage.setItem('cinevibe_watchlist', JSON.stringify(watchlist))
    } catch (e) {
      console.warn('Failed to save watchlist to localStorage', e)
    }
  }, [watchlist])

  useEffect(() => {
    try {
      localStorage.setItem('cinevibe_watched', JSON.stringify(watchedMovieIds))
    } catch (error) {
      console.warn('Failed to save watched movies to localStorage', error)
    }
  }, [watchedMovieIds])

  useEffect(() => {
    try {
      localStorage.setItem('cinevibe_hide_watched', String(hideWatched))
    } catch (error) {
      console.warn('Failed to save Hide Watched preference to localStorage', error)
    }
  }, [hideWatched])

  useEffect(() => () => clearTimeout(toastTimeout.current), [])

  const showToast = (message) => {
    setToastMessage(message)
    clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToastMessage(''), 2400)
  }

  // Fetch movies by mood
  const loadMood = useCallback(async (mood, type) => {
    setLoading(true)
    setSearchQuery('')
    setSearchNotice(null)
    setIsWatchlistView(false)

    const moodHeadlines = {
      trending: 'TRENDING TONIGHT',
      scifi:    'MIND-BENDING SCI-FI',
      feelgood: 'FEEL-GOOD & COZY',
      thriller: 'LATE NIGHT THRILLER',
      action:   'POPCORN ACTION',
    }

    setHeadline(moodHeadlines[mood] || 'RECOMMENDED FOR YOU')
    setSubline(
      type === 'tv'
        ? 'Top trending series matching your selected vibe'
        : 'Curated based on cinematic tone, critical reception, and pacing'
    )

    try {
      const res = await fetchDiscoverMovies(mood, type)
      const discoveredMovies = [...(res.movies || [])]
      if (mood === 'trending') {
        for (let i = discoveredMovies.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1))
          const movie = discoveredMovies[i]
          discoveredMovies[i] = discoveredMovies[j]
          discoveredMovies[j] = movie
        }
      }
      setMovies(discoveredMovies)
      if (mood === 'trending') setTrendingMovies(discoveredMovies)
      setIsOffline(Boolean(res.isOffline))
    } catch (err) {
      console.error('Error fetching discovery movies:', err)
      setIsOffline(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial mount: automatically trigger fetchDiscoverMovies('trending', 'movie')
  useEffect(() => {
    loadMood('trending', 'movie')
  }, [loadMood])

  // Search recommendation submission handler
  const handleSearch = async (query) => {
    if (!query.trim()) return
    setLoading(true)
    setSearchQuery(query)
    setIsWatchlistView(false)
    setSearchNotice(null)
    setHeadline(`BECAUSE YOU LOVED "${query.toUpperCase()}"`)
    setSubline('Ranked by cosine thematic similarity, director aesthetic, and cast overlap')

    try {
      const data = await fetchRecommendations(query, 8)
      setMovies(data.movies || [])
      setIsOffline(Boolean(data.isOffline))

      if (!data.found) {
        setSearchNotice(
          'Movie not found in offline ML index — showing closest TMDB matches'
        )
      } else {
        setSearchNotice(null)
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setIsOffline(true)
    } finally {
      setLoading(false)
    }
  }

  // Mood selection change
  const handleMoodSelect = (moodId) => {
    providerRequestId.current += 1
    setActiveOTT([])
    setProviderMovies([])
    setActiveMood(moodId)
    loadMood(moodId, mediaType)
  }

  const handleOTTSelect = async (platform) => {
    const requestId = ++providerRequestId.current
    if (activeOTT[0] === platform) {
      setActiveOTT([])
      setProviderMovies([])
      if (!searchQuery && !isWatchlistView) {
        setActiveMood('trending')
        setHeadline('TRENDING TONIGHT')
        setSubline('Most streamed and critically acclaimed cinema right now')
        if (trendingMovies.length) setMovies(trendingMovies)
      }
      setLoading(false)
      return
    }

    setActiveOTT([platform])
    setLoading(true)
    try {
      const result = await fetchProviderMovies(platform)
      if (requestId === providerRequestId.current) {
        setProviderMovies(result.movies)
        setIsOffline(Boolean(result.isOffline))
      }
    } catch (err) {
      console.error(`Error fetching ${platform} movies:`, err)
      setIsOffline(true)
    } finally {
      if (requestId === providerRequestId.current) setLoading(false)
    }
  }

  // Emotion lock callback from EmotionScanner
  const handleEmotionSelect = useCallback(
    ({ emotion, config }) => {
      setActiveMood(config.mood)
      setHeadline(config.headline)
      setSubline(config.subline)
      loadMood(config.mood, mediaType)
    },
    [loadMood, mediaType]
  )

  // Media type toggle ([Movies | TV Shows])
  const handleMediaTypeChange = (type) => {
    setMediaType(type)
    if (!isWatchlistView) {
      if (searchQuery) {
        // If searched, re-run search or reset to discover for new type
        handleSearch(searchQuery)
      } else {
        loadMood(activeMood, type)
      }
    }
  }

  // Watchlist toggle handler
  const handleWatchlistToggle = (movie) => {
    setWatchlist((prev) => {
      const exists = prev.some((m) => m.id === movie.id)
      if (exists) {
        return prev.filter((m) => m.id !== movie.id)
      } else {
        return [movie, ...prev]
      }
    })
  }

  const handleWatchedToggle = (movie) => {
    const isWatched = watchedMovieIds.includes(movie.id)
    setWatchedMovieIds((prev) => (
      prev.includes(movie.id)
        ? prev.filter((id) => id !== movie.id)
        : [...prev, movie.id]
    ))
    showToast(isWatched ? 'Removed from watched' : 'Marked as watched')
  }

  const handlePickFromWatchlist = () => {
    if (!watchlist.length) {
      showToast('Your watchlist is empty! Add movies first.')
      return
    }
    const pick = watchlist[Math.floor(Math.random() * watchlist.length)]
    setSelectedMovie(pick)
  }

  // Filter movies by active streaming OTT services
  const displayedMovies = useMemo(() => {
    if (activeOTT.length && !isWatchlistView) return providerMovies
    const sourceList = isWatchlistView ? watchlist : movies
    return sourceList
  }, [isWatchlistView, watchlist, movies, activeOTT, providerMovies])

  const visibleMovies = useMemo(
    () => hideWatched
      ? displayedMovies.filter((movie) => !watchedMovieIds.includes(movie.id))
      : displayedMovies,
    [displayedMovies, hideWatched, watchedMovieIds]
  )

  // Watchlist navigation toggle
  const handleWatchlistNavClick = () => {
    if (isWatchlistView) {
      setIsWatchlistView(false)
      loadMood(activeMood, mediaType)
    } else {
      providerRequestId.current += 1
      setActiveOTT([])
      setProviderMovies([])
      setIsWatchlistView(true)
      setSearchQuery('')
      setSearchNotice(null)
      setHeadline('MY SAVED WATCHLIST')
      setSubline(
        watchlist.length > 0
          ? `${watchlist.length} saved titles ready for your next movie night`
          : 'Your watchlist is empty. Click the plus button on any poster to bookmark titles!'
      )
    }
  }

  const handleLogoClick = () => {
    providerRequestId.current += 1
    setActiveOTT([])
    setProviderMovies([])
    setIsWatchlistView(false)
    setSearchQuery('')
    setSearchNotice(null)
    setActiveMood('trending')
    loadMood('trending', mediaType)
  }

  return (
    <div className="min-h-screen text-white flex flex-col font-sans selection:bg-[#e50914] selection:text-white">
      <div className="cinematic-ambient" aria-hidden="true">
        <span className="cinematic-orb cinematic-orb-red" />
        <span className="cinematic-orb cinematic-orb-indigo" />
        <span className="cinematic-orb cinematic-orb-amber" />
        <span className="cinematic-film-grain" />
      </div>
      {/* Sticky Glass Navbar */}
      <Navbar
        mediaType={mediaType}
        setMediaType={handleMediaTypeChange}
        watchlist={watchlist}
        onWatchlistClick={handleWatchlistNavClick}
        isWatchlistView={isWatchlistView}
        onLogoClick={handleLogoClick}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Subtle Offline Warning Banner if backend unreachable */}
        {isOffline && (
          <div className="max-w-7xl mx-auto px-6 pt-4">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm">
              <WifiOff size={16} className="text-amber-400 shrink-0" />
              <span>
                Backend server currently unreachable &mdash; displaying offline cached demo data. Live search &amp; trailers will activate once connected.
              </span>
            </div>
          </div>
        )}

        {/* Hero Search Section (shown in discovery / search mode) */}
        {!isWatchlistView && (
          <>
            <HeroSearch onSearch={handleSearch} loading={loading} />

            {/* ── Feature Toggle Buttons (Vibe Check & Compatibility Mixer) ── */}
            <div className="max-w-7xl mx-auto px-6 mb-3 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => {
                  setShowVibeCheck(v => !v)
                  if (!showVibeCheck) setShowCompatibility(false)
                }}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-semibold transition-all cursor-pointer
                  ${showVibeCheck
                    ? 'bg-gradient-to-r from-violet-600/30 to-[#e50914]/30 border-violet-500/50 text-white shadow-lg shadow-violet-900/30'
                    : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
              >
                <ScanFace size={15} className={showVibeCheck ? 'text-violet-400' : ''} />
                {showVibeCheck ? 'Hide Vibe Check' : 'AI Vibe Check (Webcam)'}
              </button>

              <button
                onClick={() => {
                  setShowCompatibility(v => !v)
                  if (!showCompatibility) setShowVibeCheck(false)
                }}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-semibold transition-all cursor-pointer
                  ${showCompatibility
                    ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                    : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
              >
                <Shuffle size={14} />
                {showCompatibility ? 'Hide Compatibility Mixer' : 'Dual-User Compatibility Mixer'}
              </button>
            </div>

            {/* ── Emotion Scanner (AI Vibe Check Panel) ──────────────────── */}
            {showVibeCheck && (
              <div className="border-y border-violet-500/10 bg-black/40 py-6 px-4 mb-4">
                <EmotionScanner
                  onEmotionSelect={handleEmotionSelect}
                  onClose={() => setShowVibeCheck(false)}
                />
              </div>
            )}

            {/* ── Compatibility Mixer panel ──────────────────────────────── */}
            {showCompatibility && (
              <div className="border-y border-violet-500/10 bg-violet-950/10">
                <CompatibilityMixer />
              </div>
            )}

            {/* Filter Bar with Mood Pills & OTT Badges */}
            <FilterBar
              activeMood={activeMood}
              setActiveMood={handleMoodSelect}
              activeOTT={activeOTT}
              onOTTSelect={handleOTTSelect}
              hideWatched={hideWatched}
              onHideWatchedToggle={() => setHideWatched((prev) => !prev)}
            />
          </>
        )}

        {/* Not-in-ML-Index Friendly Banner */}
        {searchNotice && !isWatchlistView && (
          <div className="max-w-7xl mx-auto px-6 pt-4">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs sm:text-sm">
              <AlertCircle size={16} className="text-blue-400 shrink-0" />
              <span>{searchNotice}</span>
            </div>
          </div>
        )}

        {/* Movie Grid Section */}
        <MovieGrid
          movies={visibleMovies}
          loading={loading}
          headline={
            activeOTT.length && !isWatchlistView
              ? `TRENDING ON ${OTT_LABELS[activeOTT[0]]}`
              : headline
          }
          subline={
            activeOTT.length && !isWatchlistView
              ? 'Popular movies available on this streaming platform'
              : subline
          }
          matchLabel={searchQuery || isWatchlistView || activeMood !== 'trending' ? 'Match' : 'Vibe Score'}
          selectedMovie={selectedMovie}
          onSelect={setSelectedMovie}
          watchlist={watchlist}
          onWatchlistToggle={handleWatchlistToggle}
          watchedMovieIds={watchedMovieIds}
          onWatchedToggle={handleWatchedToggle}
          isWatchlistView={isWatchlistView}
          onPickFromWatchlist={handlePickFromWatchlist}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-zinc-500">
        <p className="flex items-center justify-center gap-1.5">
          <span>CineVibe &copy; {new Date().getFullYear()}</span>
          <span>&middot;</span>
          <span>Designed with high-contrast cinema aesthetics</span>
          <span>&middot;</span>
          <span>Data via TMDB API</span>
        </p>
      </footer>

      {/* Movie Detail & Trailer Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          inWatchlist={watchlist.some((w) => w.id === selectedMovie.id)}
          onWatchlistToggle={handleWatchlistToggle}
        />
      )}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-full border border-white/10
            bg-[#1a1d24] px-4 py-2 text-sm text-white shadow-xl"
        >
          {toastMessage}
        </div>
      )}
    </div>
  )
}
