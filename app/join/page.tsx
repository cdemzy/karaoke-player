'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const JOIN_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/

export default function JoinSessionPage() {
	const router = useRouter()
	const [code, setCode] = useState('')
	const [error, setError] = useState('')

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const joinCode = code.trim().toUpperCase()
		if (!JOIN_CODE_PATTERN.test(joinCode)) {
			setError('Enter the six-character code shown on the TV.')
			return
		}

		setError('')
		router.push(`/session/${joinCode}`)
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#0d0a14] px-5 text-white">
			<form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-violet-500/40 bg-[#110d1c] p-6 shadow-[0_0_36px_rgba(124,58,237,0.18)]">
				<p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300">Karaoke remote</p>
				<h1 className="mt-2 text-2xl font-bold">Join a session</h1>
				<p className="mt-2 text-sm leading-6 text-zinc-400">Enter the code shown on the TV to browse songs and control the queue.</p>
				<label className="mt-6 block text-sm font-medium" htmlFor="session-code">Session code</label>
				<input
					autoFocus
					id="session-code"
					value={code}
					onChange={event => setCode(event.target.value.toUpperCase())}
					placeholder="ABC123"
					maxLength={6}
					className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.25em] text-white uppercase placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
				/>
				{error && <p className="mt-2 text-sm text-red-300" role="alert">{error}</p>}
				<button type="submit" className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-3 font-bold transition hover:bg-violet-500">Join session</button>
			</form>
		</main>
	)
}
