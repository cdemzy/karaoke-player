import { notFound } from 'next/navigation'
import { isSessionId } from '@/lib/session'
import { GuestView } from './guest-view'

interface SessionPageProps {
	params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: SessionPageProps) {
	const { id } = await params
	if (!isSessionId(id)) notFound()

	return <GuestView sessionId={id} />
}
