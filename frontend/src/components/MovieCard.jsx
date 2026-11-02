// src/components/MovieCard.jsx
import { useState } from 'react'
import { Plus, Check, Star, Film, Eye } from 'lucide-react'
import clsx from 'clsx'

const PROVIDER_COLORS = {
  'Netflix': { bg: '#e50914', text: 'N' },
  'Prime Video': { bg: '#00A8E1', text: 'prime' },
  'Apple TV': { bg: '#555', text: 'Ctv+' },
  'Disney+ Hotstar': { bg: '#1C4EDA', text: 'D+' },
}

function ProviderBadge({ name }) {
  const cfg = PROVIDER_COLORS[name]
  if (!cfg) return null
  return (
    <span
      className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
      style={{ backgroundColor: cfg.bg }}
    >
      {cfg.text}
    </span>
  )
}

function MatchBadge({ match, label, className }) {
  const color = match >= 90 ? '#22c55e' : match >= 80 ? '#eab308' : '#f97316'
  return (
    <span className={clsx('text-xs font-bold', className)} style={{ color }}>
      {match}% {label}
    </span>
  )
}

/** Sleek dark placeholder shown when poster_url is missing or fails to load */
function PosterPlaceholder({ title }) {
  const hues = [220, 260, 290, 320, 0, 30, 180, 150]
  const hue = hues[(title?.charCodeAt(0) ?? 0) % hues.length]

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsl(${hue},25%,10%) 0%, hsl(${hue},18%,7%) 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          background: `radial-gradient(circle at 50% 40%, hsl(${hue},60%,55%), transparent 65%)`,
        }}
      />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center border"
        style={{
          background: `hsl(${hue},30%,14%)`,
          borderColor: `hsl(${hue},30%,22%)`,
        }}
      >
        <Film size={22} style={{ color: `hsl(${hue},50%,55%)` }} strokeWidth={1.5} />
      </div>
      <p
        className="text-center text-[12px] font-semibold leading-snug px-4 max-w-[90%] line-clamp-3"
        style={{ color: `hsl(${hue},20%,65%)` }}
      >
        {title}
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#13161b] to-transparent" />
    </div>
  )
}

export default function MovieCard({
  movie,
  matchLabel,
  onSelect,
  inWatchlist,
  onWatchlistToggle,
  isWatched,
  onWatchedToggle,
}) {
  const [imgErr, setImgErr] = useState(false)
  const providers = movie.providers?.flatrate || []
  const showPlaceholder = imgErr || !movie.poster_url
  const summary = movie.overview?.trim() || movie.hook

  return (
    <article
      className="group relative rounded-xl overflow-hidden bg-[#13161b] border border-white/[0.07] card-lift cursor-pointer"
      onClick={() => onSelect(movie)}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {!showPlaceholder ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <PosterPlaceholder title={movie.title} />
        )}

        {/* Gradient overlay (bottom) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top-left: Watchlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onWatchlistToggle(movie)
          }}
          className={clsx(
            'absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center',
            'border transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer',
            inWatchlist
              ? 'bg-[#e50914] border-[#e50914] text-white'
              : 'bg-black/60 border-white/20 text-white hover:bg-[#e50914] hover:border-[#e50914]'
          )}
          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          {inWatchlist ? <Check size={13} strokeWidth={3} /> : <Plus size={13} strokeWidth={3} />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onWatchedToggle(movie)
          }}
          className={clsx(
            'absolute top-2.5 left-11 w-7 h-7 rounded-full flex items-center justify-center',
            'border transition-all duration-200 cursor-pointer max-sm:opacity-100',
            isWatched
              ? 'opacity-100 bg-[#e50914] border-[#e50914] text-white shadow-lg shadow-[#e50914]/30'
              : 'opacity-0 group-hover:opacity-100 bg-black/60 border-white/20 text-white hover:bg-[#e50914] hover:border-[#e50914]'
          )}
          title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
          aria-label={isWatched ? `Mark ${movie.title} as unwatched` : `Mark ${movie.title} as watched`}
          aria-pressed={isWatched}
        >
          <Eye size={13} />
        </button>

        {/* Top-right: Rating pill */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
          <Star size={11} fill="#f59e0b" stroke="none" />
          <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
        </div>

        {/* Bottom overlay: Title */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pt-8">
          <p className="text-white font-bold text-base tracking-wide uppercase leading-tight drop-shadow-lg">
            {movie.title}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-1.5">
        {/* Match + meta */}
        <div className="flex items-center justify-between">
          <MatchBadge match={movie.match} label={matchLabel} />
          <span className="text-zinc-500 text-[11px]">
            {movie.release_year}
            {movie.runtime && ` · ${movie.runtime}`}
          </span>
        </div>

        {/* Title (text) */}
        <p className="text-white text-[14px] font-semibold leading-snug">{movie.title}</p>

        {/* Plot summary */}
        {summary && (
          <p className="text-zinc-400 text-[12px] leading-snug line-clamp-2">{summary}</p>
        )}

        {/* Genres + streaming badges */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex gap-1.5 flex-wrap">
            {movie.genres.slice(0, 2).map((g) => (
              <span key={g} className="text-[11px] text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {providers.slice(0, 2).map((p) => (
              <ProviderBadge key={p.name} name={p.name} />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
