'use client'

import { useEffect, useState } from 'react'
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
		<div className="rounded-xl border border-zinc-800 bg-[#1a1530] px-4 py-5 shrink-0">
			<p className="text-center text-sm font-bold text-white">Scan to join the queue</p>
			<p className="mt-1 text-center text-xs text-zinc-400">Let guests add their songs from their phone.</p>
			{qrCode ? (
				<img src={qrCode.dataUrl} alt="QR code for this karaoke session" className="mx-auto mt-4 w-40 rounded-lg bg-white p-2" />
			) : (
				<div className="mx-auto mt-4 h-40 w-40 animate-pulse rounded-lg bg-zinc-800" />
			)}
			<p className="mt-3 break-all text-center text-xs text-zinc-400">{qrCode?.url}</p>
		</div>
	)
}
