import { serve } from 'bun'
import index from './index.html'
import { streamAgentResponse } from './agent/server/Agent'
import z from 'zod'

// import { simulateEventStream } from './agent/server/simulateEventStream'
// const SIMULATE_ERROR = true

const server = serve({
	routes: {
		'/stream-events': {
			POST: async req => {
				const rawBody = await req.json()
				const body = z.object({ message: z.string() }).parse(rawBody)
				console.log('Received chat message:', body)

				// Set simulateError to true to test error handling
				// const eventStream = simulateEventStream(placeholderEvents, SIMULATE_ERROR)

				const eventStream = streamAgentResponse(body.message)

				return eventStream.toNDJSONStreamResponse()
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
