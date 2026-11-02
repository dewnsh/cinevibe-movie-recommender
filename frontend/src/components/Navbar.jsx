// src/components/Navbar.jsx
import { Film, Bookmark, User } from 'lucide-react'
import clsx from 'clsx'

export default function Navbar({ mediaType, setMediaType, watchlist, onWatchlistClick, isWatchlistView, onLogoClick }) {
  return (
    <nav className="navbar sticky top-0 z-40 glass border-b border-white/[0.07]">
      <div className="navbar-inner max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">

        {/* Logo */}
        <button 
          onClick={onLogoClick}
          className="navbar-logo flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#e50914] rounded-lg flex items-center justify-center shadow-lg shadow-[#e50914]/20">
            <Film size={16} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-white">CineVibe</span>
        </button>

        {/* Center pill toggle */}
        <div className="navbar-media-toggle flex items-center bg-white/[0.06] rounded-full p-1 border border-white/[0.08]">
          {['Movies', 'TV Shows'].map((label) => {
            const val = label === 'Movies' ? 'movie' : 'tv'
            const active = mediaType === val
            return (
              <button
                key={label}
                onClick={() => setMediaType(val)}
                className={clsx(
                  'px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer',
                  active
                    ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Right: Watchlist + Avatar */}
        <div className="navbar-actions flex items-center gap-3 shrink-0">
          <button
            onClick={onWatchlistClick}
            aria-label="My Watchlist"
            className={clsx(
              'navbar-watchlist flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition-all cursor-pointer',
              isWatchlistView
                ? 'bg-white/[0.12] border-white/30 text-white'
                : 'border-white/[0.12] text-zinc-300 hover:border-white/30 hover:text-white'
            )}
          >
            <Bookmark size={14} className={isWatchlistView ? 'text-[#e50914]' : ''} />
            <span className="navbar-watchlist-label">My Watchlist</span>
            {watchlist.length > 0 && (
              <span className="navbar-watchlist-count bg-[#e50914] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                {watchlist.length}
              </span>
            )}
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300">
            <User size={15} />
          </div>
        </div>

      </div>
    </nav>
  )
}
