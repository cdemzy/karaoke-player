'use client'

import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import QRCode from 'qrcode'

interface SessionQrProps {
	sessionId: string
	variant?: 'compact' | 'hero' | 'player'
}

function loadImage(source: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image)
		image.onerror = () => reject(new Error(`Unable to load image: ${source}`))
		image.src = source
	})
}

export function SessionQr({ sessionId, variant = 'compact' }: SessionQrProps) {
	const [qrCode, setQrCode] = useState<{ dataUrl: string; url: string } | null>(null)
	const isHero = variant === 'hero'
	const isPlayer = variant === 'player'
	const isExpanded = isHero || isPlayer

	useEffect(() => {
		let isCancelled = false
		const sessionUrl = `${window.location.origin}/join`
		const qrSize = isPlayer ? 512 : 256

		async function generateQrCode() {
			setQrCode(null)

			try {
				const qrDataUrl = await QRCode.toDataURL(sessionUrl, {
					color: {
						dark: '#1a1530',
						light: '#ffffff',
					},
					errorCorrectionLevel: 'H',
					margin: 1,
					width: qrSize,
				})
				const [qrImage, appIcon] = await Promise.all([loadImage(qrDataUrl), loadImage('/karaoke_icon.png')])
				const canvas = document.createElement('canvas')
				canvas.width = qrSize
				canvas.height = qrSize
				const context = canvas.getContext('2d')
				if (!context) return

				context.drawImage(qrImage, 0, 0, qrSize, qrSize)
				const badgeSize = Math.round(qrSize * 0.24)
				const badgePosition = (qrSize - badgeSize) / 2
				const badgeCenter = qrSize / 2
				const badgeRadius = badgeSize / 2
				context.fillStyle = '#1a1530'
				context.beginPath()
				context.arc(badgeCenter, badgeCenter, badgeRadius, 0, Math.PI * 2)
				context.fill()
				context.save()
				context.beginPath()
				context.arc(badgeCenter, badgeCenter, badgeRadius, 0, Math.PI * 2)
				context.clip()
				context.drawImage(appIcon, badgePosition, badgePosition, badgeSize, badgeSize)
				context.restore()

				if (!isCancelled) setQrCode({ dataUrl: canvas.toDataURL('image/png'), url: sessionUrl })
			} catch {
				if (!isCancelled) setQrCode(null)
			}
		}

		void generateQrCode()

		return () => {
			isCancelled = true
		}
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
			{qrCode ? (
				<img src={qrCode.dataUrl} alt="QR code to join this karaoke session on your phone" className={`mx-auto rounded-lg bg-white shadow-[0_0_18px_rgba(139,92,246,0.55)] ${isPlayer ? 'mt-7 w-96 p-4' : isHero ? 'mt-5 w-56 p-3' : 'mt-3 w-32 p-2'}`} />
			) : (
				<div className={`mx-auto animate-pulse rounded-lg bg-zinc-800 ${isPlayer ? 'mt-7 h-96 w-96' : isHero ? 'mt-5 h-56 w-56' : 'mt-3 h-32 w-32'}`} />
			)}
			<p className={`${isExpanded ? 'mt-4 text-[11px]' : 'mt-2 text-[9px]'} text-center font-medium uppercase tracking-wider text-zinc-500`}>Session code</p>
			<p className={`${isPlayer ? 'mt-1 text-2xl' : isHero ? 'mt-1 text-lg' : 'mt-0.5 text-sm'} text-center font-bold tracking-[0.18em] text-white`}>{sessionId.toUpperCase()}</p>
		</section>
	)
}
