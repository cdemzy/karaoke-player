import Link from 'next/link'

export default function NotFound() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-[#0d0a14] px-6 text-center text-white">
			<div>
				<p className="text-sm font-bold uppercase tracking-widest text-violet-400">404</p>
				<h1 className="mt-2 text-2xl font-bold">Page not found</h1>
				<p className="mt-2 text-zinc-400">This page or karaoke session is unavailable.</p>
				<Link href="/" className="mt-6 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold transition-colors hover:bg-purple-500">Return to Karaoke</Link>
			</div>
		</main>
	)
}
