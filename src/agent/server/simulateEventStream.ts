import type { AgentEvent, AgentEventChunk } from '../types'
import { EventStream } from './EventStream'
import { placeholderEvents } from './placeholderData'

// Helper to generate a random number between min and max
function rand(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper to sleep for ms milliseconds
function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// Split text into chunks of n characters
function chunkString(str: string, chunkSize: number) {
	const chunks: string[] = []
	for (let i = 0; i < str.length; i += chunkSize) {
		chunks.push(str.slice(i, i + chunkSize))
	}
	return chunks
}

// Convert events into streamable chunks
function* eventToChunks(event: AgentEvent): Generator<AgentEventChunk> {
	if (event.type === 'message') {
		// Split message text into smaller deltas
		const textChunks = chunkString(event.text, 5)
		for (const delta of textChunks) {
			yield { type: 'message_delta', delta }
		}
	} else if (event.type === 'tool') {
		// Tool call: start, input, output
		// Use the tool's ID from the event
		yield { type: 'tool_start', id: event.id, toolName: event.toolName }
		yield { type: 'tool_input', id: event.id, input: event.input }
		yield { type: 'tool_output', id: event.id, output: event.output }
	}
}

export function simulateEventStream(
	events: AgentEvent[] = placeholderEvents,
	simulateError: boolean = false
) {
	const stream = new EventStream()

	// Start the simulation asynchronously
	;(async () => {
		try {
			// Simulate thinking time before first chunk
			await sleep(1000)
			let eventCount = 0
			let chunkCount = 0
			for (const event of events) {
				eventCount++
				// Convert event to chunks and stream them
				for (const chunk of eventToChunks(event)) {
					chunkCount++

					// Simulate an error after a few chunks (for testing)
					if (simulateError && chunkCount === 5) {
						throw new Error(
							'Simulated streaming error: Connection interrupted'
						)
					}

					stream.push(chunk)
					const delay =
						chunk.type === 'message_delta' ? rand(10, 50) : 500
					await sleep(delay)
				}
			}
			stream.close()
		} catch (error) {
			console.error('Error in simulateEventStream:', error)
			stream.error(
				error instanceof Error ? error : new Error(String(error))
			)
		}
	})()

	return stream
}
