import { handle } from '@upstash/realtime'
import { realtime } from '@/lib/realtime'
import { isSessionId } from '@/lib/session'

export const GET = handle({
	realtime,
	middleware: ({ channels }) => {
		const channelPrefix = 'realtime:session:'
		const hasOnlyValidSessionChannels = channels.every(channel => channel.startsWith(channelPrefix) && isSessionId(channel.slice(channelPrefix.length)))
		if (!hasOnlyValidSessionChannels) return new Response('Unauthorized', { status: 401 })
	},
})
