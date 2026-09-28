'use client'

import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import QRCode from 'qrcode'

interface SessionQrProps {
	sessionId: string
}

export function SessionQr({ sessionId }: SessionQrProps) {
	const [qrCode, setQrCode] = useState<{ dataUrl: string; url: string } | null>(null)

	useEffect(() => {
		const sessionUrl = `${window.location.origin}/session/${sessionId}`
		void QRCode.toDataURL(sessionUrl, {
			color: {
				dark: '#1a1530',
				light: '#ffffff',
			},
			margin: 1,
			width: 256,
		}).then(dataUrl => setQrCode({ dataUrl, url: sessionUrl }))
	}, [sessionId])

	return (
		<section className="border-b border-white/10 bg-[#0c0a1d] px-4 py-4 shadow-[0_16px_30px_rgba(0,0,0,0.24)]">
			<div className="flex items-start gap-3">
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
					<Smartphone size={17} aria-hidden="true" />
				</div>
				<div>
					<p className="text-xs font-bold uppercase tracking-wide text-white">Join on your phone</p>
					<p className="mt-1 text-[11px] leading-4 text-zinc-400">Scan to browse songs and add them to the queue.</p>
				</div>
			</div>
			{qrCode ? (
				<img src={qrCode.dataUrl} alt="QR code to join this karaoke session on your phone" className="mx-auto mt-3 w-28 rounded-lg bg-white p-1.5 shadow-[0_0_18px_rgba(139,92,246,0.55)]" />
			) : (
				<div className="mx-auto mt-3 h-28 w-28 animate-pulse rounded-lg bg-zinc-800" />
			)}
			<p className="mt-2 text-center text-[9px] font-medium uppercase tracking-wider text-zinc-500">Session code</p>
			<p className="mt-0.5 text-center text-sm font-bold tracking-[0.18em] text-white">{sessionId.toUpperCase()}</p>
		</section>
	)
}
