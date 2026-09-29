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
				<img src="/karaoke_icon.png" alt="Karaoke" className="mx-auto h-16 w-16 object-contain" />
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
				<button type="submit" className="relative mt-5 flex w-full items-center justify-center overflow-hidden rounded-xl bg-violet-600 px-4 py-3 font-bold transition-colors hover:bg-violet-500">
					<div aria-hidden style={{ position: 'absolute', inset: 0 }}>
						<div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: '#a855f7', top: '-45%', left: '5%', filter: 'blur(20px)', animation: 'blob-1 7s ease-in-out infinite' }} />
						<div style={{ position: 'absolute', width: 75, height: 75, borderRadius: '50%', background: '#d946ef', top: '15%', left: '48%', filter: 'blur(18px)', animation: 'blob-2 9s ease-in-out infinite' }} />
						<div style={{ position: 'absolute', width: 70, height: 70, borderRadius: '50%', background: '#7c3aed', top: '-20%', left: '72%', filter: 'blur(16px)', animation: 'blob-3 6s ease-in-out infinite' }} />
					</div>
					<span className="relative">Join session</span>
				</button>
			</form>
		</main>
	)
}
