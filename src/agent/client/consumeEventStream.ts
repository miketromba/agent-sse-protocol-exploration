import type {
	AgentEvent,
	AgentEventChunk,
	MessageEvent,
	ToolEvent
} from '../types'

type EventStartCallback = (event: AgentEvent) => void
type EventUpdateCallback = (event: AgentEvent) => void
type ErrorCallback = (error: Error) => void
type CompleteCallback = () => void

type StreamEventsOptions = {
	url: string
	message: string
	onEventStart: EventStartCallback
	onEventUpdate: EventUpdateCallback
	onError?: ErrorCallback
	onComplete?: CompleteCallback
}

// State for assembling chunks into events
type MessageState = {
	type: 'message'
	event: Partial<MessageEvent>
}

type ToolState = {
	type: 'tool'
	event: Partial<ToolEvent>
}

type AssemblyState = MessageState | ToolState | null

export async function streamEvents({
	url,
	message,
	onEventStart,
	onEventUpdate,
	onError,
	onComplete
}: StreamEventsOptions) {
	let state: AssemblyState = null

	const processChunk = (chunk: AgentEventChunk) => {
		if (chunk.type === 'message_delta') {
			// If current state is a message, append delta
			if (state?.type === 'message') {
				state.event.text = (state.event.text || '') + chunk.delta
				// Emit update to existing message
				onEventUpdate(state.event as AgentEvent)
			} else {
				// Start new message event
				const newEvent: Partial<MessageEvent> = {
					type: 'message',
					role: 'agent',
					text: chunk.delta
				}
				state = { type: 'message', event: newEvent }
				onEventStart(newEvent as AgentEvent)
			}
		} else if (chunk.type === 'tool_start') {
			// Start new tool event
			const newEvent: Partial<ToolEvent> = {
				type: 'tool',
				toolName: chunk.toolName,
				input: '',
				output: ''
			}
			state = { type: 'tool', event: newEvent }
			onEventStart(newEvent as AgentEvent)
		} else if (chunk.type === 'tool_input') {
			// Add input to current tool
			if (state?.type === 'tool') {
				state.event.input = chunk.input
				onEventUpdate(state.event as AgentEvent)
			}
		} else if (chunk.type === 'tool_output') {
			// Add output to current tool and finalize
			if (state?.type === 'tool') {
				state.event.output = chunk.output
				onEventUpdate(state.event as AgentEvent)
				// Reset state after tool is complete
				state = null
			}
		}
	}

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
						processChunk(chunk)
					} catch (e) {
						console.error('Failed to parse final chunk:', e)
					}
				}
				onComplete?.()
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
						processChunk(chunk)
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
	}
}
