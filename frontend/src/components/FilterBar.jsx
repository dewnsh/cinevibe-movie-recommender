// src/components/FilterBar.jsx
import clsx from 'clsx'

const MOOD_CHIPS = [
  { id: 'trending',  label: '🔥 Trending Tonight' },
  { id: 'scifi',     label: '🧠 Mind-Bending Sci-Fi' },
  { id: 'feelgood',  label: '✨ Feel-Good & Cozy' },
  { id: 'thriller',  label: '🌙 Late Night Thriller' },
  { id: 'action',    label: '🍿 Popcorn Action' },
]

const OTT_BADGES = [
  {
    id: 'netflix',
    label: 'Netflix',
    logo: (
      <svg width="16" height="16" viewBox="0 0 111 30" fill="#e50914" xmlns="http://www.w3.org/2000/svg">
        <path d="M105.062 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l6.031-13.75L94.468 0h5.063l3.062 7.874L105.875 0h5.124l-5.937 14.28zM90.47 0h-4.965v28.564c1.656.094 3.312.156 4.965.343V0zm-8.937 27.938c-4.528-.75-9.092-1.22-13.656-1.22V0h4.966v23.032c2.906.25 5.875.53 8.69.937v3.969zM64.25 10.78v3.969H57.06v8.25h7.19v3.937c-2.063 0-10.065 0-11.968.032V0H64.25v3.969H57.06V10.78h7.19zM44.6 0v25.406c-1.563-.032-3.156-.032-4.688 0V0H44.6zM30.913 0l7.5 17.938V0h4.688v30c-1.5 0-3.031-.063-4.531-.063L30.913 11.25V30c-1.656 0-3.312.063-4.969.125V0h4.969zM0 0h5.375l7.5 17.938V0h4.688v30L13 29.938 5.375 12.25V30H0V0z"/>
      </svg>
    ),
  },
  {
    id: 'prime',
    label: 'Prime Video',
    logo: (
      <span className="text-[10px] font-bold text-[#00A8E1] leading-none">prime</span>
    ),
  },
  {
    id: 'hotstar',
    label: 'Disney+ Hotstar',
    logo: (
      <span className="text-[10px] font-bold text-[#1C4EDA] leading-none">D+</span>
    ),
  },
  {
    id: 'appletv',
    label: 'Apple TV',
    logo: (
      <span className="text-[10px] font-bold text-white leading-none">Ctv+</span>
    ),
  },
]

export default function FilterBar({
  activeMood,
  setActiveMood,
  activeOTT,
  onOTTSelect,
  hideWatched,
  onHideWatchedToggle,
}) {
  return (
    <div className="max-w-7xl mx-auto px-6 space-y-4 pb-2">

      {/* Mood row */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-semibold text-white shrink-0">What&apos;s your vibe tonight?</span>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 pb-1">
          {MOOD_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveMood(chip.id)}
              className={clsx(
                'chip shrink-0 cursor-pointer',
                activeMood === chip.id ? 'active' : ''
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onHideWatchedToggle}
          aria-pressed={hideWatched}
          className={clsx(
            'chip shrink-0 text-xs',
            hideWatched ? 'active' : 'text-zinc-400'
          )}
        >
          Hide Watched
        </button>
      </div>

      {/* OTT row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-zinc-500 shrink-0">
          Streaming On
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {OTT_BADGES.map((ott) => {
            const on = activeOTT.includes(ott.id)
            return (
              <button
                key={ott.id}
                onClick={() => onOTTSelect(ott.id)}
                className={clsx(
                  'chip gap-2',
                  on ? 'border-white/30 bg-white/[0.07]' : ''
                )}
              >
                <span className="w-5 h-5 flex items-center justify-center">{ott.logo}</span>
                <span className={clsx('text-[13px]', on ? 'text-white' : 'text-zinc-400')}>
                  {ott.label}
                </span>
                {on && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#e50914]">
                    <path d="M2 6l3 3 5-5" stroke="#e50914" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
          <span className="text-zinc-500 text-xs italic hidden md:block">Your services. Your next obsession.</span>
        </div>
      </div>
    </div>
  )
}
