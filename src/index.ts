import { serve } from 'bun'
import index from './index.html'
import { placeholderEvents } from './agent/placeholderData'
import { simulateEventStream } from './agent/simulateEventStream'

const server = serve({
	routes: {
		'/stream-events': {
			POST: async req => {
				const body = await req.json()
				console.log('Received chat message:', body)

				const stream = simulateEventStream(placeholderEvents)

				return new Response(stream, {
					headers: {
						'Content-Type': 'application/x-ndjson',
						'Cache-Control': 'no-cache',
						Connection: 'keep-alive'
					}
				})
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
