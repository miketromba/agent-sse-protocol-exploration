import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { EventStream } from '../EventStream'

export function streamAgentResponse(message: string): EventStream {
	const eventStream = new EventStream()

	// Start streaming asynchronously
	;(async () => {
		try {
			const { textStream } = streamText({
				model: anthropic('claude-haiku-4-5'),
				prompt: message
			})

			// Consume the async iterator directly - more efficient than pipeTo
			for await (const chunk of textStream) {
				eventStream.push({
					type: 'message_delta',
					delta: chunk
				})
			}

			eventStream.close()
		} catch (error) {
			console.error('Error streaming agent response:', error)
			eventStream.error(
				error instanceof Error ? error : new Error(String(error))
			)
		}
	})()

	return eventStream
}
