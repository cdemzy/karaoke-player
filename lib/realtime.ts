import { Realtime, type InferRealtimeEvents } from '@upstash/realtime'
import { z } from 'zod'
import { redis } from '@/lib/redis'

const videoSchema = z.object({
	id: z.string(),
	title: z.string(),
	channel: z.string(),
	thumbnail: z.string(),
})

const queueItemSchema = z.object({
	id: z.string(),
	video: videoSchema,
})

const sessionSnapshotSchema = z.object({
	nowPlaying: queueItemSchema.nullable(),
	queue: z.array(queueItemSchema),
})

export const realtime = new Realtime({
	redis,
	schema: {
		session: {
			updated: z.object({
				session: sessionSnapshotSchema,
			}),
		},
	},
})

export type RealtimeEvents = InferRealtimeEvents<typeof realtime>
