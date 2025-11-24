import type { AgentEventChunk } from '../types'
import { decode } from '@msgpack/msgpack'

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
			let buffer = new Uint8Array(0)

			while (true) {
				const { done, value } = await reader.read()

				if (done) {
					break
				}

				// Append new data to buffer
				const newBuffer = new Uint8Array(buffer.length + value.length)
				newBuffer.set(buffer)
				newBuffer.set(value, buffer.length)
				buffer = newBuffer

				// Process complete messages using length-prefixed framing
				while (buffer.length >= 4) {
					// Read 4-byte length prefix (big-endian)
					const view = new DataView(
						buffer.buffer,
						buffer.byteOffset,
						buffer.byteLength
					)
					const messageLength = view.getUint32(0, false)

					// Check if we have the complete message
					if (buffer.length < 4 + messageLength) {
						// Not enough data yet, wait for more
						break
					}

					// Extract the message bytes (skip the 4-byte length prefix)
					const messageBytes = buffer.slice(4, 4 + messageLength)
					// Keep remaining buffer after this message
					buffer = buffer.slice(4 + messageLength)

					try {
						const chunk = decode(messageBytes) as AgentEventChunk
						onEventChunk(chunk)
					} catch (e) {
						console.error('Failed to decode chunk:', e)
						onError?.(e instanceof Error ? e : new Error(String(e)))
					}
				}
			}
		} catch (error) {
			const err =
				error instanceof Error ? error : new Error(String(error))
			// Don't log AbortError - it's expected when user stops
			if (err.name !== 'AbortError') {
				console.error('Stream error:', error)
				onError?.(err)
			}
		} finally {
			// Always call onEnd, whether success or error
			onEnd?.()
		}
	})()

	return { abort, promise: streamPromise }
}
