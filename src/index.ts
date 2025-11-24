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
			GET: async () => {
				return new Response(JSON.stringify(conversationStore))
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
