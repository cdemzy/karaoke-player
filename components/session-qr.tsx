'use client'

import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import QRCode from 'qrcode'

interface SessionQrProps {
	sessionId: string
	variant?: 'compact' | 'hero'
}

export function SessionQr({ sessionId, variant = 'compact' }: SessionQrProps) {
	const [qrCode, setQrCode] = useState<{ dataUrl: string; url: string } | null>(null)
	const isHero = variant === 'hero'

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
		<section className={`border-b border-white/10 bg-[#0c0a1d] shadow-[0_16px_30px_rgba(0,0,0,0.24)] ${isHero ? 'px-6 py-6' : 'px-4 py-4'}`}>
			<div className={`flex items-start ${isHero ? 'gap-4' : 'gap-3'}`}>
				<div className={`flex shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 ${isHero ? 'h-11 w-11' : 'h-8 w-8'}`}>
					<Smartphone size={isHero ? 23 : 17} aria-hidden="true" />
				</div>
				<div>
					<p className={`${isHero ? 'text-base' : 'text-xs'} font-bold uppercase tracking-wide text-white`}>Join on your phone</p>
					<p className={`${isHero ? 'mt-1.5 text-sm leading-5' : 'mt-1 text-[11px] leading-4'} text-zinc-400`}>Scan to browse songs and add them to the queue.</p>
				</div>
			</div>
			{qrCode ? (
				<img src={qrCode.dataUrl} alt="QR code to join this karaoke session on your phone" className={`mx-auto rounded-lg bg-white shadow-[0_0_18px_rgba(139,92,246,0.55)] ${isHero ? 'mt-5 w-48 p-2.5' : 'mt-3 w-28 p-1.5'}`} />
			) : (
				<div className={`mx-auto animate-pulse rounded-lg bg-zinc-800 ${isHero ? 'mt-5 h-48 w-48' : 'mt-3 h-28 w-28'}`} />
			)}
			<p className={`${isHero ? 'mt-4 text-[11px]' : 'mt-2 text-[9px]'} text-center font-medium uppercase tracking-wider text-zinc-500`}>Session code</p>
			<p className={`${isHero ? 'mt-1 text-lg' : 'mt-0.5 text-sm'} text-center font-bold tracking-[0.18em] text-white`}>{sessionId.toUpperCase()}</p>
		</section>
	)
}
