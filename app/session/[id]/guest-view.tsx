'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiPlusCircle, FiSearch, FiX } from 'react-icons/fi'
import { sessionChannel, type QueueItem, type Video } from '@/lib/session'
import { useRealtime } from '@/lib/realtime-client'

interface GuestViewProps {
	sessionId: string
}

interface SessionState {
	nowPlaying: QueueItem | null
	queue: QueueItem[]
}

const initialSessionState: SessionState = { nowPlaying: null, queue: [] }

export function GuestView({ sessionId }: GuestViewProps) {
	const [session, setSession] = useState<SessionState>(initialSessionState)
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<Video[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)
	const [hasEnded, setHasEnded] = useState(false)

	const loadSession = useCallback(async () => {
		const response = await fetch(`/api/session/${sessionId}`, { cache: 'no-store' })
		if (response.status === 404) {
			setHasEnded(true)
			return
		}
		if (!response.ok) return
		setSession(await response.json() as SessionState)
	}, [sessionId])

	useRealtime({
		channels: [sessionChannel(sessionId)],
		events: ['session.updated'],
		onData: ({ data }) => setSession(data.session),
	})

	useEffect(() => {
		const initialLoad = window.setTimeout(() => void loadSession(), 0)
		return () => {
			window.clearTimeout(initialLoad)
		}
	}, [loadSession])

	async function handleSearch() {
		const searchQuery = query.trim()
		if (!searchQuery) return

		setIsLoading(true)
		setHasSearched(true)
		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
			const data = await response.json() as { items?: Video[] }
			setResults(data.items ?? [])
		} finally {
			setIsLoading(false)
		}
	}

	async function handleAdd(video: Video) {
		const response = await fetch(`/api/session/${sessionId}/queue`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ video }),
		})
		if (response.status === 404) {
			setHasEnded(true)
			return
		}
		if (response.ok) setSession(await response.json() as SessionState)
	}

	async function handleRemove(queueItemId: string) {
		const response = await fetch(`/api/session/${sessionId}/queue`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ queueItemId }),
		})
		if (response.status === 404) {
			setHasEnded(true)
			return
		}
		if (response.ok) setSession(await response.json() as SessionState)
	}

	if (hasEnded) {
		return <main className="flex min-h-screen items-center justify-center bg-[#0d0a14] px-6 text-center text-white"><div><h1 className="text-2xl font-bold">Session ended</h1><p className="mt-2 text-zinc-400">Ask the host to start a new karaoke session.</p></div></main>
	}

	return (
		<main className="min-h-screen bg-[#0d0a14] px-4 py-6 text-white">
			<div className="mx-auto max-w-lg">
				<header className="mb-6 text-center"><img src="/karaoke_icon.png" alt="Karaoke" className="mx-auto mb-2 h-12 w-12 object-contain" /><h1 className="text-xl font-bold">Karaoke queue</h1><p className="text-sm text-zinc-400">Add a song for the host to play.</p></header>

				<section className="mb-5 rounded-xl border border-zinc-800 bg-[#110d1c] p-4">
					<p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Now playing</p>
					{session.nowPlaying ? <div className="flex items-center gap-3"><img src={session.nowPlaying.video.thumbnail} alt="" className="h-12 w-16 rounded object-cover" /><div className="min-w-0"><p className="truncate font-semibold">{session.nowPlaying.video.title}</p><p className="truncate text-sm text-zinc-400">{session.nowPlaying.video.channel}</p></div></div> : <p className="text-sm text-zinc-500">Nothing is playing yet.</p>}
				</section>

				<div className="mb-5 flex gap-2"><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && void handleSearch()} placeholder="Search songs or artists..." className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none" /><button onClick={() => void handleSearch()} disabled={isLoading} aria-label="Search" className="rounded-xl bg-purple-600 p-3 transition-colors hover:bg-purple-500 disabled:opacity-50"><FiSearch size={18} /></button></div>

				{hasSearched && <section className="mb-5 overflow-hidden rounded-xl border border-zinc-800 bg-[#110d1c]">{results.length === 0 && !isLoading ? <p className="p-5 text-center text-sm text-zinc-500">No results found.</p> : results.map(video => <div key={video.id} className="flex items-center gap-3 border-b border-zinc-800 p-3 last:border-0"><img src={video.thumbnail} alt="" className="h-10 w-14 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{video.title}</p><p className="truncate text-xs text-zinc-400">{video.channel}</p></div><button onClick={() => void handleAdd(video)} className="flex shrink-0 items-center gap-1 rounded-lg bg-purple-600 px-2 py-2 text-xs font-semibold hover:bg-purple-500"><FiPlusCircle size={14} /> Add</button></div>)}</section>}

				<section className="overflow-hidden rounded-xl border border-zinc-800 bg-[#110d1c]"><div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3"><h2 className="text-sm font-bold uppercase tracking-widest">Queue</h2><span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-bold">{session.queue.length}</span></div>{session.queue.length === 0 ? <p className="p-5 text-center text-sm text-zinc-500">The queue is empty.</p> : session.queue.map((item, index) => <div key={item.id} className="flex items-center gap-3 border-b border-zinc-800 p-3 last:border-0"><span className="w-4 text-sm font-bold text-zinc-600">{index + 1}</span><img src={item.video.thumbnail} alt="" className="h-10 w-14 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.video.title}</p><p className="truncate text-xs text-zinc-400">{item.video.channel}</p></div><button onClick={() => void handleRemove(item.id)} aria-label={`Remove ${item.video.title}`} className="p-2 text-zinc-500 hover:text-red-400"><FiX size={18} /></button></div>)}</section>
			</div>
		</main>
	)
}
