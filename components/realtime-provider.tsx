'use client'

import { RealtimeProvider } from '@upstash/realtime/client'

interface RealtimeProviderProps {
	children: React.ReactNode
}

export function AppRealtimeProvider({ children }: RealtimeProviderProps) {
	return <RealtimeProvider api={{ url: '/api/realtime' }}>{children}</RealtimeProvider>
}
