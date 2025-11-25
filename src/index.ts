import { serve } from 'bun'
import index from './index.html'
import { streamAgentResponse } from './agent/server/streamAgentResponse'
import type { AgentEvent } from './agent/types'
import z from 'zod'

// import { simulateEventStream } from './agent/server/simulateEventStream'

// In-memory persistence store (would be a database in production)
const conversationStore: AgentEvent[] = []

const server = serve({
	// Increase timeout for long-running AI streams (default is 10 seconds)
	idleTimeout: 255,

	routes: {
		'/stream-events': {
			POST: async req => {
				const rawBody = await req.json()
				const body = z.object({ message: z.string() }).parse(rawBody)

				const eventStream = streamAgentResponse({
					message: body.message,
					abortSignal: req.signal,
					onFinish: async events => {
						console.log(
							`💾 Persisting ${events.length} events for conversation`
						)
						console.log(events)
						conversationStore.push(...events)
					}
				})

				return eventStream.toNDJSONStreamResponse()
			}
		},

		'/event-history': {
			GET: async req => {
				// Sleep to see loading state
				await new Promise(resolve => setTimeout(resolve, 500))

				// Parse query params for pagination
				const url = new URL(req.url)
				const page = parseInt(url.searchParams.get('page') || '0')
				const limit = parseInt(url.searchParams.get('limit') || '20')

				// Calculate pagination from the end (newest first)
				const totalEvents = conversationStore.length
				const start = Math.max(0, totalEvents - (page + 1) * limit)
				const end = totalEvents - page * limit

				// Get events in chronological order (oldest to newest within page)
				const paginatedEvents = conversationStore.slice(start, end)
				const hasMore = start > 0

				return new Response(
					JSON.stringify({
						events: paginatedEvents,
						page,
						limit,
						hasMore,
						total: totalEvents
					})
				)
			}
		},
		// Serve index.html for all unmatched routes.
		'/*': index
	},

	development: process.env.NODE_ENV !== 'production' && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true
	}
})

console.log(`🚀 Server running at ${server.url}`)
