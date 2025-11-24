import type { AgentEventChunk } from '../types'

type EventChunkCallback = (chunk: AgentEventChunk) => void
type ErrorCallback = (error: Error) => void
type CompleteCallback = () => void

type StreamEventsOptions = {
	url: string
	message: string
	onEventChunk: EventChunkCallback
	onError?: ErrorCallback
	onComplete?: CompleteCallback
}

export async function consumeEventStream({
	url,
	message,
	onEventChunk,
	onError,
	onComplete
}: StreamEventsOptions) {
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ message })
		})

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		if (!response.body) {
			throw new Error('Response body is null')
		}

		const reader = response.body.getReader()
		const decoder = new TextDecoder()
		let buffer = ''

		while (true) {
			const { done, value } = await reader.read()

			if (done) {
				// Process any remaining data in buffer
				if (buffer.trim()) {
					try {
						const chunk = JSON.parse(buffer) as AgentEventChunk
						onEventChunk(chunk)
					} catch (e) {
						console.error('Failed to parse final chunk:', e)
					}
				}
				break
			}

			// Decode the chunk and add to buffer
			buffer += decoder.decode(value, { stream: true })

			// Process complete lines
			const lines = buffer.split('\n')
			// Keep the last incomplete line in the buffer
			buffer = lines.pop() || ''

			for (const line of lines) {
				if (line.trim()) {
					try {
						const chunk = JSON.parse(line) as AgentEventChunk
						onEventChunk(chunk)
					} catch (e) {
						console.error(
							'Failed to parse chunk:',
							e,
							'Line:',
							line
						)
						onError?.(e instanceof Error ? e : new Error(String(e)))
					}
				}
			}
		}
	} catch (error) {
		console.error('Stream error:', error)
		onError?.(error instanceof Error ? error : new Error(String(error)))
	} finally {
		// Always call onComplete, whether success or error
		onComplete?.()
	}
}
