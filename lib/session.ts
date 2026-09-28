export const SESSION_TTL_SECONDS = 60 * 60 * 6
const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const JOIN_CODE_LENGTH = 6

export interface Video {
	id: string
	title: string
	channel: string
	thumbnail: string
}

export interface QueueItem {
	id: string
	video: Video
	requestedBy?: string
}

export interface SessionData {
	createdAt: number
	nowPlaying: QueueItem | null
	queue: QueueItem[]
}

export function sessionKey(sessionId: string): string {
	return `session:${sessionId}`
}

export function sessionChannel(sessionId: string): string {
	return `realtime:session:${sessionId}`
}

export function isSessionId(value: string): boolean {
	return isJoinCode(value) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function isJoinCode(value: string): boolean {
	return new RegExp(`^[${JOIN_CODE_ALPHABET}]{${JOIN_CODE_LENGTH}}$`).test(value.toUpperCase())
}

export function createJoinCode(): string {
	const randomValues = crypto.getRandomValues(new Uint32Array(JOIN_CODE_LENGTH))
	return Array.from(randomValues, value => JOIN_CODE_ALPHABET[value % JOIN_CODE_ALPHABET.length]).join('')
}

export function isVideo(value: unknown): value is Video {
	if (!value || typeof value !== 'object') return false

	const video = value as Record<string, unknown>
	return ['id', 'title', 'channel', 'thumbnail'].every(key => typeof video[key] === 'string' && video[key].trim().length > 0)
}

export function isRequesterName(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 50
}

export function parseSession(sessionValue: unknown): SessionData {
	const parsedValue = typeof sessionValue === 'string' ? JSON.parse(sessionValue) : sessionValue
	const session = (parsedValue && typeof parsedValue === 'object' ? parsedValue : {}) as Partial<SessionData>
	return {
		createdAt: typeof session.createdAt === 'number' ? session.createdAt : Date.now(),
		nowPlaying: session.nowPlaying ?? null,
		queue: Array.isArray(session.queue) ? session.queue : [],
	}
}
