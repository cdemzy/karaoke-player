'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { FiPlusCircle, FiSearch, FiSkipForward, FiUser, FiX } from 'react-icons/fi'
import { BsFillPlayFill } from 'react-icons/bs'
import { toast } from 'sonner'
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

function RequesterPill({ name, isLarge = false, isCurrentUser = true }: { name?: string; isLarge?: boolean; isCurrentUser?: boolean }) {
	const sizeClasses = isLarge ? 'gap-2 px-4 py-2 text-base font-semibold' : 'gap-1 px-2 py-0.5 text-xs'
	const colorClasses = isCurrentUser ? 'bg-purple-500/15 text-purple-200' : 'bg-zinc-700/50 text-zinc-500'
	return <span className={`mt-1 inline-flex max-w-full items-center rounded-full ${colorClasses} ${sizeClasses}`}><FiUser aria-hidden size={isLarge ? 18 : 12} /><span className="truncate">{name ?? 'Unknown'}</span></span>
}

export function GuestView({ sessionId }: GuestViewProps) {
	const [session, setSession] = useState<SessionState>(initialSessionState)
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<Video[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)
	const [hasEnded, setHasEnded] = useState(false)
	const [isAdvancing, setIsAdvancing] = useState(false)
	const [isPlayingVideoId, setIsPlayingVideoId] = useState<string | null>(null)
	const [nameInput, setNameInput] = useState('')
	const [nameVersion, setNameVersion] = useState(0)
	const requesterName = typeof window === 'undefined' ? '' : sessionStorage.getItem(`karaoke_requester_name:${sessionId}`)?.trim() ?? ''

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

	function clearSearch() {
		setQuery('')
		setResults([])
		setHasSearched(false)
	}

	function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const nextName = nameInput.trim()
		if (!nextName) return

		sessionStorage.setItem(`karaoke_requester_name:${sessionId}`, nextName)
		setNameVersion(nameVersion + 1)
	}

	async function handleAdd(video: Video) {
		const response = await fetch(`/api/session/${sessionId}/queue`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ video, requestedBy: requesterName }),
		})
		if (response.status === 404) {
			setHasEnded(true)
			return
		}
		if (response.ok) {
			setSession(await response.json() as SessionState)
			clearSearch()
			toast.success('Added to queue', { description: video.title })
		}
	}

	async function handlePlayNow(video: Video) {
		if (isPlayingVideoId) return

		setIsPlayingVideoId(video.id)
		try {
			const response = await fetch(`/api/session/${sessionId}/now-playing`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ video, requestedBy: requesterName }),
			})
			if (response.status === 404) {
				setHasEnded(true)
				return
			}
			if (response.ok) {
				setSession(await response.json() as SessionState)
				clearSearch()
			}
		} finally {
			setIsPlayingVideoId(null)
		}
	}

	async function handleRemove(queueItem: QueueItem) {
		const response = await fetch(`/api/session/${sessionId}/queue`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ queueItemId: queueItem.id }),
		})
		if (response.status === 404) {
			setHasEnded(true)
			return
		}
		if (response.ok) {
			setSession(await response.json() as SessionState)
			toast.success('Removed from queue', { description: queueItem.video.title })
		}
	}

	async function handlePlayNext() {
		if (session.queue.length === 0 || isAdvancing) return

		setIsAdvancing(true)
		try {
			const response = await fetch(`/api/session/${sessionId}/now-playing`, { method: 'POST' })
			if (response.status === 404) {
				setHasEnded(true)
				return
			}
			if (response.ok) {
				setSession(await response.json() as SessionState)
				clearSearch()
			}
		} finally {
			setIsAdvancing(false)
		}
	}

	if (hasEnded) {
		return <main className="flex min-h-screen items-center justify-center bg-[#0d0a14] px-6 text-center text-white"><div><h1 className="text-2xl font-bold">Session ended</h1><p className="mt-2 text-zinc-400">Ask the host to start a new karaoke session.</p></div></main>
	}

	return (
		<main className="min-h-screen bg-[#0d0a14] px-4 py-6 text-white">
			<div className="mx-auto max-w-lg">
				<header className="relative mb-6 text-center"><img src="/karaoke_icon.png" alt="Karaoke" className="mx-auto h-12 w-12 object-contain" />{requesterName && <div className="absolute right-0 top-1/2 max-w-[45%] -translate-y-1/2"><RequesterPill name={requesterName} isLarge /></div>}</header>

				<div className="mb-5 flex gap-2"><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && void handleSearch()} placeholder="Search songs or artists..." className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none" /><button onClick={() => void handleSearch()} disabled={isLoading} aria-label="Search" className="rounded-xl bg-purple-600 p-3 transition-colors hover:bg-purple-500 disabled:opacity-50"><FiSearch size={18} /></button></div>

				{hasSearched && <section className="mb-5 overflow-hidden rounded-xl border border-zinc-800 bg-[#110d1c]">{results.length === 0 && !isLoading ? <p className="p-5 text-center text-sm text-zinc-500">No results found.</p> : results.map(video => <div key={video.id} className="flex items-center gap-3 border-b border-zinc-800 p-3 last:border-0"><img src={video.thumbnail} alt="" className="h-10 w-14 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{video.title}</p><p className="truncate text-xs text-zinc-400">{video.channel}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => void handlePlayNow(video)} disabled={Boolean(isPlayingVideoId)} aria-label={`Play ${video.title}`} className="rounded-lg bg-green-600 p-2 text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"><BsFillPlayFill size={16} /></button><button onClick={() => void handleAdd(video)} className="flex items-center gap-1 rounded-lg bg-purple-600 px-2 py-2 text-xs font-semibold hover:bg-purple-500"><FiPlusCircle size={14} /> Add</button></div></div>)}</section>}

				<section className="overflow-hidden rounded-xl border border-zinc-800 bg-[#110d1c]">
					<div className="p-4">
						<p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Now playing</p>
						{session.nowPlaying ? <div className="flex items-center gap-3"><img src={session.nowPlaying.video.thumbnail} alt="" className="h-12 w-16 rounded object-cover" /><div className="min-w-0"><p className="truncate font-semibold">{session.nowPlaying.video.title}</p><p className="truncate text-sm text-zinc-400">{session.nowPlaying.video.channel}</p><RequesterPill name={session.nowPlaying.requestedBy} isCurrentUser={session.nowPlaying.requestedBy === requesterName} /></div></div> : <p className="text-sm text-zinc-500">Nothing is playing yet.</p>}
						{session.queue.length > 0 && <button onClick={() => void handlePlayNext()} disabled={isAdvancing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"><FiSkipForward size={18} />{isAdvancing ? 'Playing next...' : 'Play next'}</button>}
					</div>
					<div className="flex items-center justify-between border-y border-zinc-800 px-4 py-3"><h2 className="text-sm font-bold uppercase tracking-widest">Up next</h2><span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-bold">{session.queue.length}</span></div>
					{session.queue.length === 0 ? <p className="p-5 text-center text-sm text-zinc-500">The queue is empty.</p> : session.queue.map((item, index) => <div key={item.id} className="flex items-center gap-3 border-b border-zinc-800 p-3 last:border-0"><span className="w-4 text-sm font-bold text-zinc-600">{index + 1}</span><img src={item.video.thumbnail} alt="" className="h-10 w-14 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.video.title}</p><p className="truncate text-xs text-zinc-400">{item.video.channel}</p><RequesterPill name={item.requestedBy} isCurrentUser={item.requestedBy === requesterName} /></div><button onClick={() => void handleRemove(item)} aria-label={`Remove ${item.video.title}`} className="p-2 text-zinc-500 hover:text-red-400"><FiX size={18} /></button></div>)}
				</section>
			</div>
			{!requesterName && <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 px-4"><form onSubmit={handleNameSubmit} className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-[#110d1c] p-6 shadow-2xl"><h1 className="text-xl font-bold">What&apos;s your name?</h1><p className="mt-2 text-sm text-zinc-400">We&apos;ll attach it to every song you add or play.</p><label className="mt-5 block text-sm font-medium" htmlFor="requester-name">Your name</label><input autoFocus id="requester-name" value={nameInput} onChange={event => setNameInput(event.target.value)} maxLength={50} required className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" /><button type="submit" className="mt-4 w-full rounded-xl bg-purple-600 px-4 py-3 font-bold transition-colors hover:bg-purple-500">Join session</button></form></div>}
		</main>
	)
}
