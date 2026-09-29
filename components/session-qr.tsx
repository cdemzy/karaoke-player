'use client'

import { useEffect, useRef } from 'react'
import { Smartphone } from 'lucide-react'
import QRCodeStyling from 'qr-code-styling'

interface SessionQrProps {
	sessionId: string
	variant?: 'compact' | 'hero' | 'player'
}

export function SessionQr({ sessionId, variant = 'compact' }: SessionQrProps) {
	const qrContainerRef = useRef<HTMLDivElement>(null)
	const isHero = variant === 'hero'
	const isPlayer = variant === 'player'
	const isExpanded = isHero || isPlayer

	useEffect(() => {
		const container = qrContainerRef.current
		if (!container) return

		const qrSize = isPlayer ? 512 : 256
		const qrCode = new QRCodeStyling({
			backgroundOptions: { color: '#ffffff' },
			dotsOptions: { color: '#1a1530', type: 'square' },
			height: qrSize,
			image: '/karaoke_icon.png',
			imageOptions: {
				crossOrigin: 'anonymous',
				hideBackgroundDots: true,
				imageSize: 0.24,
				margin: 4,
				saveAsBlob: false,
			},
			margin: 8,
			qrOptions: { errorCorrectionLevel: 'H' },
			type: 'svg',
			width: qrSize,
		})

		qrCode.update({ data: `${window.location.origin}/join` })
		qrCode.append(container)

		return () => container.replaceChildren()
	}, [isPlayer, sessionId])

	return (
		<section className={`bg-[#0c0a1d] shadow-[0_16px_30px_rgba(0,0,0,0.24)] ${isPlayer ? 'w-full max-w-2xl rounded-3xl border border-violet-500/40 px-8 py-8' : isHero ? 'rounded-2xl border border-white/10 px-6 py-6' : 'border-b border-white/10 px-4 py-4'}`}>
			<div className={`flex flex-col items-center text-center ${isExpanded ? 'gap-3' : 'gap-2'}`}>
				<div className={`flex shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 ${isExpanded ? 'h-11 w-11' : 'h-8 w-8'}`}>
					<Smartphone size={isExpanded ? 23 : 17} aria-hidden="true" />
				</div>
				<div>
					<p className={`${isExpanded ? 'text-base' : 'text-xs'} font-bold uppercase tracking-wide text-white`}>Join on your phone</p>
					<p className={`${isExpanded ? 'mt-1.5 text-sm leading-5' : 'mt-1 text-[11px] leading-4'} text-zinc-400`}>Scan and enter the session code, then play or add songs directly from your phone.</p>
				</div>
			</div>
			<div ref={qrContainerRef} aria-label="QR code to join this karaoke session on your phone" className={`mx-auto overflow-hidden rounded-lg bg-white shadow-[0_0_18px_rgba(139,92,246,0.55)] [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${isPlayer ? 'mt-7 h-96 w-96' : isHero ? 'mt-5 h-56 w-56' : 'mt-3 h-32 w-32'}`} />
			<p className={`${isExpanded ? 'mt-4 text-[11px]' : 'mt-2 text-[9px]'} text-center font-medium uppercase tracking-wider text-zinc-500`}>Session code</p>
			<p className={`${isPlayer ? 'mt-1 text-2xl' : isHero ? 'mt-1 text-lg' : 'mt-0.5 text-sm'} text-center font-bold tracking-[0.18em] text-white`}>{sessionId.toUpperCase()}</p>
		</section>
	)
}
