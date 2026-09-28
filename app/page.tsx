'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FiSearch, FiSkipForward, FiPlusCircle, FiUser, FiX, FiList } from 'react-icons/fi';
import { BsFillPlayFill } from 'react-icons/bs';
import { toast } from 'sonner';
import { SessionQr } from '@/components/session-qr';
import { sessionChannel, type QueueItem, type Video } from '@/lib/session';
import { useRealtime } from '@/lib/realtime-client';

export default function KaraokeApp() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<QueueItem | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPlayerMode = queue.length > 0 || !!nowPlaying;

  const applySession = useCallback((data: { queue: QueueItem[]; nowPlaying: QueueItem | null }) => {
    setQueue(data.queue);
    setNowPlaying(data.nowPlaying);
  }, []);

  useRealtime({
    channels: sessionId ? [sessionChannel(sessionId)] : [],
    events: ['session.updated'],
    enabled: Boolean(sessionId),
    onData: ({ data }) => applySession(data.session),
  });

  useEffect(() => {
    async function initializeSession() {
      const storedSessionId = sessionStorage.getItem('karaoke_session_id');
      if (storedSessionId) {
        const response = await fetch(`/api/session/${storedSessionId}`, { cache: 'no-store' });
        if (response.ok) {
          applySession(await response.json());
          setSessionId(storedSessionId);
          return;
        }
      }

      const response = await fetch('/api/session', { method: 'POST' });
      if (!response.ok) return;
      const { sessionId: createdSessionId } = await response.json() as { sessionId: string };
      sessionStorage.setItem('karaoke_session_id', createdSessionId);
      setSessionId(createdSessionId);
    }

    void initializeSession();
  }, [applySession]);

  function clearSearch() {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  }

  async function search() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.items ?? []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  async function addToQueue(video: Video) {
    if (!sessionId) return;
    const response = await fetch(`/api/session/${sessionId}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video, requestedBy: 'Host' }),
    });
    if (!response.ok) return;
    applySession(await response.json());
    clearSearch();
    toast.success('Added to queue', { description: video.title });
  }

  async function playNow(video: Video) {
    if (!sessionId) return;
    const response = await fetch(`/api/session/${sessionId}/now-playing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video, requestedBy: 'Host' }),
    });
    if (!response.ok) return;
    applySession(await response.json());
    clearSearch();
  }

  async function playNext() {
    if (!sessionId) return;
    const response = await fetch(`/api/session/${sessionId}/now-playing`, { method: 'POST' });
    if (!response.ok) return;
    applySession(await response.json());
    clearSearch();
  }

  async function removeFromQueue(queueItem: QueueItem) {
    if (!sessionId) return;
    const response = await fetch(`/api/session/${sessionId}/queue`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueItemId: queueItem.id }),
    });
    if (response.ok) {
      applySession(await response.json());
      toast.success('Removed from queue', { description: queueItem.video.title });
    }
  }

  /* Shared results list — used in both modes */
  const ResultsList = (
    <AnimatePresence>
      {hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
        >
          {results.length === 0 && !loading && (
            <p className="text-zinc-500 text-sm text-center py-6">No results found.</p>
          )}
          {results.map(video => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 hover:bg-zinc-900 transition-colors"
            >
              <img src={video.thumbnail} alt={video.title} className="w-16 h-11 object-cover rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{video.title}</p>
                <p className="text-zinc-400 text-xs truncate">{video.channel}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => void playNow(video)}
                  aria-label="Play"
                  className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <BsFillPlayFill size={14} />
                </button>
                <button
                  onClick={() => void addToQueue(video)}
                  disabled={!sessionId}
                  aria-label="Add to queue"
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-2 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-semibold whitespace-nowrap"
                >
                  <FiPlusCircle size={12} /> Add to queue
                </button>
              </div>
            </motion.div>
          ))}
          {results.length > 0 && (
            <button onClick={clearSearch} className="w-full text-xs text-zinc-600 hover:text-zinc-400 py-2 transition-colors flex items-center justify-center gap-1">
              <FiX size={12} /> Close results
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const NAV_H = 'h-16';

  return (
    <div className="h-screen text-white overflow-hidden" style={{ fontFamily: 'Arial, sans-serif', background: '#0d0a14' }}>

      <AnimatePresence mode="wait">

        {/* ── DISCOVERY MODE ── */}
        {!isPlayerMode && (
          <motion.div
            key="discovery"
            className="h-full flex flex-col bg-[#110d1c]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {!hasSearched ? (

                /* Centered hero */
                <motion.div
                  key="hero"
                  className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <img src="/karaoke_icon.png" alt="Karaoke" className="h-20 w-20 object-contain" />
                  {sessionId && (
                    <div className="w-full max-w-md">
                      <SessionQr sessionId={sessionId} variant="hero" />
                    </div>
                  )}
                  <div className="w-full max-w-2xl flex flex-col gap-3">
                    {sessionId && (
                      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        <span className="h-px flex-1 bg-zinc-800" />
                        Or search on this TV
                        <span className="h-px flex-1 bg-zinc-800" />
                      </div>
                    )}
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && search()}
                      placeholder="Search songs or artists..."
                      className="w-full bg-zinc-800 text-white px-6 py-4 rounded-2xl text-lg placeholder-zinc-500 focus:outline-none"
                      style={{ border: '1.5px solid transparent', boxShadow: '0 0 0 1.5px #7c3aed, 0 0 18px 4px #a855f766' }}
                    />
                    <button
                      onClick={search}
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? '...' : <><FiSearch size={18} /> Search</>}
                    </button>
                  </div>
                </motion.div>

              ) : (

                /* Search bar above results — both in content area */
                <motion.div
                  key="results"
                  className="flex flex-col h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Minimal nav — icon only */}
                  <div className="flex items-center px-6 h-14 border-b border-zinc-800 shrink-0">
                    <img src="/karaoke_icon.png" alt="Karaoke" className="h-8 w-8 object-contain" />
                  </div>

                  {/* Search bar + results centered in content area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-4 pt-5">
                      {/* Search bar */}
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          ref={inputRef}
                          type="text"
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && search()}
                          placeholder="Search songs or artists..."
                          className="flex-1 bg-zinc-800 text-white px-4 py-2.5 rounded-xl border border-zinc-700 placeholder-zinc-500 text-sm focus:outline-none"
                        />
                        <button
                          onClick={search}
                          disabled={loading}
                          aria-label="Search"
                          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold p-2.5 rounded-xl transition-colors shrink-0"
                        >
                          {loading ? <span className="text-xs px-1">...</span> : <FiSearch size={17} />}
                        </button>
                      </div>
                      {/* Results directly below search bar */}
                      {ResultsList}
                    </div>
                  </div>
                </motion.div>

              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── PLAYER MODE ── */}
        {isPlayerMode && (
          <motion.div
            key="player"
            className="flex h-full overflow-hidden bg-[#050507] p-3 md:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Main player */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-l-xl border border-violet-500/70 bg-black shadow-[0_0_34px_rgba(124,58,237,0.18)]">
              <header className={`flex items-center justify-between bg-[#0c0a1b] px-5 ${NAV_H} shrink-0 border-b border-white/10`}>
                <div className="flex items-center gap-4">
                  <img src="/karaoke_icon.png" alt="Karaoke" className="h-8 w-8 object-contain" />
                  {nowPlaying && <span className="inline-flex max-w-48 items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-200"><FiUser aria-hidden size={14} /><span className="truncate">{nowPlaying.requestedBy ?? 'Unknown'}</span></span>}
                </div>
                <div className="flex items-center gap-4">
                  {nowPlaying && (
                    <div className="max-w-sm text-right">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500">Now playing</p>
                      <p className="truncate text-xs font-semibold text-white">{nowPlaying.video.title}</p>
                    </div>
                  )}
                  {nowPlaying && (
                    <button
                      onClick={() => void playNext()}
                      aria-label="Next"
                      className="rounded-full bg-violet-600 p-2.5 font-bold text-white shadow-[0_0_14px_rgba(139,92,246,0.7)] transition-colors hover:bg-violet-500"
                    >
                      <FiSkipForward size={20} />
                    </button>
                  )}
                </div>
              </header>

              <div className="relative flex flex-1 items-center justify-center bg-black">
                {nowPlaying ? (
                  <iframe
                    key={nowPlaying.id}
                    src={`https://www.youtube.com/embed/${nowPlaying.video.id}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center gap-5 text-zinc-400">
                    <FiList size={48} className="text-violet-400" />
                    <p className="text-xl font-medium text-white">{queue.length} song{queue.length !== 1 ? 's' : ''} in queue</p>
                    <button
                      onClick={() => void playNext()}
                      className="relative flex items-center gap-3 overflow-hidden rounded-xl bg-violet-600 px-8 py-4 text-lg font-bold text-white shadow-[0_0_28px_rgba(139,92,246,0.55)] transition hover:bg-violet-500"
                    >
                      <div aria-hidden style={{ position: 'absolute', inset: 0 }}>
                        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: '#a855f7', top: '-30%', left: '10%', filter: 'blur(22px)', animation: 'blob-1 7s ease-in-out infinite' }} />
                        <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: '#d946ef', top: '20%', left: '50%', filter: 'blur(20px)', animation: 'blob-2 9s ease-in-out infinite' }} />
                        <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: '#7c3aed', top: '-10%', left: '70%', filter: 'blur(18px)', animation: 'blob-3 6s ease-in-out infinite' }} />
                      </div>
                      <span className="relative flex items-center gap-3"><BsFillPlayFill size={28} /> Play</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar — search lives here, not in nav */}
            <aside className="flex w-72 shrink-0 flex-col overflow-hidden rounded-r-xl border-y border-r border-violet-500/70 bg-[#090817] shadow-[0_0_34px_rgba(124,58,237,0.18)]">

              {sessionId && <SessionQr sessionId={sessionId} />}

              {/* Search bar embedded in sidebar content */}
              <div className="hidden items-center gap-2 px-4 h-16 border-b border-zinc-800 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="Search songs or artists..."
                  className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-xl border border-zinc-700 placeholder-zinc-500 text-sm focus:outline-none"
                />
                <button
                  onClick={search}
                  disabled={loading}
                  aria-label="Search"
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold p-3 rounded-xl transition-colors shrink-0"
                >
                  {loading ? <span className="text-xs">...</span> : <FiSearch size={18} />}
                </button>
              </div>

              {/* Results */}
              <AnimatePresence>
                {hasSearched && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="hidden border-b border-zinc-800"
                  >
                    {ResultsList}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Queue header */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Up next</h2>
                <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-bold text-white">{queue.length}</span>
              </div>

              {/* Queue items */}
              <div className="flex-1 overflow-y-auto px-2 py-2">
                {queue.length === 0 ? (
                  <p className="mt-4 px-4 text-center text-xs text-zinc-500">The queue is empty.</p>
                ) : (
                  <AnimatePresence initial={false}>
                    {queue.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mb-1 flex items-center gap-2 overflow-hidden rounded-lg bg-white/[0.045] px-2 py-2 transition-colors hover:bg-white/[0.09]"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/[0.08] text-xs font-bold text-zinc-300">{i + 1}</span>
                        <img src={item.video.thumbnail} alt={item.video.title} className="h-8 w-11 shrink-0 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs font-semibold text-white">{item.video.title}</p>
                          <p className="truncate text-[10px] text-zinc-500">{item.video.channel}</p>
						  <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-xs text-purple-200"><FiUser aria-hidden size={12} /><span className="truncate">{item.requestedBy ?? 'Unknown'}</span></span>
                        </div>
                        <button
                          onClick={() => void removeFromQueue(item)}
                          aria-label="Remove"
                          className="text-zinc-600 hover:text-red-400 shrink-0 transition-colors"
                        >
                          <FiX size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {queue.length > 0 && (
                <div className="shrink-0 border-t border-white/10 p-3">
                  <button
                    onClick={() => void playNext()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-700 to-purple-500 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition hover:brightness-110"
                  >
                    <FiSkipForward size={18} /> Skip song
                  </button>
                </div>
              )}
            </aside>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
