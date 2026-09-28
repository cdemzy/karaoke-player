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
		<div className="rounded-xl border border-purple-500/30 bg-[#1a1530] px-4 py-5 shadow-lg shadow-purple-950/20 shrink-0">
			<div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15 text-purple-300">
				<Smartphone size={22} aria-hidden="true" />
			</div>
			<p className="mt-3 text-center text-base font-bold text-white">Join on your phone</p>
			<p className="mt-1 text-center text-xs leading-5 text-zinc-300">Scan to browse songs, add to the queue, and control this TV player.</p>
			{qrCode ? (
				<img src={qrCode.dataUrl} alt="QR code to join this karaoke session on your phone" className="mx-auto mt-4 w-44 rounded-lg bg-white p-2" />
			) : (
				<div className="mx-auto mt-4 h-44 w-44 animate-pulse rounded-lg bg-zinc-800" />
			)}
			<p className="mt-3 break-all text-center text-xs text-zinc-500">{qrCode?.url}</p>
		</div>
	)
}
