import type { AgentEventChunk } from '../types'

type EventChunkCallback = (chunk: AgentEventChunk) => void
type ErrorCallback = (error: Error) => void
type CompleteCallback = () => void

type StreamEventsOptions = {
	url: string
	message: string
	onEventChunk: EventChunkCallback
	onError?: ErrorCallback
	onEnd?: CompleteCallback
}

export function consumeEventStream({
	url,
	message,
	onEventChunk,
	onError,
	onEnd
}: StreamEventsOptions) {
	const abortController = new AbortController()

	const abort = () => {
		abortController.abort()
	}

	const streamPromise = (async () => {
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message }),
				signal: abortController.signal
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
							onError?.(
								e instanceof Error ? e : new Error(String(e))
							)
						}
					}
				}
			}
		} catch (error) {
			const err =
				error instanceof Error ? error : new Error(String(error))
			// Don't log AbortError - it's expected when user stops
			if (err.name !== 'AbortError') {
				console.error('Stream error:', error)
			}
			onError?.(err)
		} finally {
			// Always call onEnd, whether success or error
			onEnd?.()
		}
	})()

	return { abort, promise: streamPromise }
}
