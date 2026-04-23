'use client';

import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FiSearch, FiPlay, FiSkipForward, FiPlusCircle, FiX, FiList } from 'react-icons/fi';

interface Video {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

interface Toast {
  id: number;
  title: string;
}

let toastCounter = 0;

export default function KaraokeApp() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [queue, setQueue] = useState<Video[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function showToast(title: string) {
    const id = ++toastCounter;
    setToasts(t => [...t, { id, title }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }

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
      const videos = data.items ?? [];

      setResults(videos);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  function addToQueue(video: Video) {
    if (queue.some(v => v.id === video.id)) return;
    setQueue(q => [...q, video]);
    showToast(video.title);
  }

  function playNow(video: Video) {
    setNowPlaying(video);
    clearSearch();
  }

  function playNext() {
    if (queue.length === 0) { setNowPlaying(null); return; }
    const [next, ...rest] = queue;
    setNowPlaying(next);
    setQueue(rest);
    clearSearch();
  }

  function removeFromQueue(index: number) {
    setQueue(q => q.filter((_, i) => i !== index));
  }

  const NAV_H = 'h-16';

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* Toast container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="bg-blue-600 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg max-w-xs text-center"
            >
              ✓ Added to queue
              <span className="block text-xs font-normal text-blue-200 truncate">{toast.title}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main player */}
      <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
        {/* Navbar */}
        <header className={`flex items-center justify-between px-8 ${NAV_H} border-b border-zinc-800 shrink-0`}>
          <h1 className="text-3xl font-bold tracking-widest text-blue-500 uppercase">🎤 Karaoke</h1>
          {nowPlaying && (
            <div className="text-right max-w-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Now Playing</p>
              <p className="text-sm text-white truncate">{nowPlaying.title}</p>
            </div>
          )}
        </header>

        {/* Player */}
        <div className="relative flex-1 flex items-center justify-center">
          {nowPlaying ? (
            <>
              <iframe
                key={nowPlaying.id}
                src={`https://www.youtube.com/embed/${nowPlaying.id}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
              <button
                onClick={playNext}
                aria-label="Next"
                className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-full transition-colors"
              >
                <FiSkipForward size={20} />
              </button>
            </>
          ) : queue.length > 0 ? (
            <div className="flex flex-col items-center gap-6 text-zinc-400">
              <FiList size={72} />
              <p className="text-2xl">{queue.length} song{queue.length !== 1 ? 's' : ''} in queue</p>
              <button
                onClick={playNext}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white text-2xl font-bold px-12 py-5 rounded-full transition-colors"
              >
                <FiPlay size={28} /> Play Queue
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-zinc-700">
              <FiList size={72} />
              <p className="text-2xl">Search a song and add it to the queue</p>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-md bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0">

        {/* Search — aligned to navbar height */}
        <div className={`flex items-center gap-2 px-4 ${NAV_H} border-b border-zinc-800 shrink-0`}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search songs..."
            className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-xl border border-zinc-700 placeholder-zinc-500 text-sm"
          />
          <button
            onClick={search}
            disabled={loading}
            aria-label="Search"
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold p-3 rounded-xl transition-colors shrink-0"
          >
            {loading ? <span className="text-xs">...</span> : <FiSearch size={18} />}
          </button>
        </div>

        {/* Results — animated open/close */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="border-b border-zinc-800 overflow-hidden"
            >
              <div>
{results.length === 0 && !loading && (
                  <p className="text-zinc-500 text-sm text-center py-4">No results found.</p>
                )}
                {results.map(video => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 hover:bg-zinc-800 transition-colors"
                  >
                    <img src={video.thumbnail} alt={video.title} className="w-16 h-11 object-cover rounded shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{video.title}</p>
                      <p className="text-zinc-400 text-xs truncate">{video.channel}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => playNow(video)}
                        aria-label="Play"
                        className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FiPlay size={14} />
                      </button>
                      <button
                        onClick={() => addToQueue(video)}
                        disabled={queue.some(v => v.id === video.id)}
                        aria-label="Add to queue"
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-2 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-semibold whitespace-nowrap"
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queue header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Queue</h2>
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{queue.length}</span>
        </div>

        {/* Queue items */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center mt-8 px-4">Queue is empty.</p>
          ) : (
            <AnimatePresence initial={false}>
              {queue.map((video, i) => (
                <motion.div
                  key={`${video.id}-${i}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 hover:bg-zinc-900 transition-colors overflow-hidden"
                >
                  <span className="text-zinc-600 text-sm font-bold w-4 shrink-0">{i + 1}</span>
                  <img src={video.thumbnail} alt={video.title} className="w-12 h-9 object-cover rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{video.title}</p>
                    <p className="text-zinc-500 text-xs truncate">{video.channel}</p>
                  </div>
                  <button
                    onClick={() => removeFromQueue(i)}
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
          <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
            <button
              onClick={playNext}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              <FiSkipForward size={18} /> Play Next in Queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
