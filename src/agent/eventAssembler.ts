import type { AgentEvent, AgentEventChunk } from './types'

/**
 * Shared logic for assembling AgentEventChunks into AgentEvents.
 * Used by both client (useEvents) and server (EventStream) for consistency.
 */
export class EventAssembler {
	private events: AgentEvent[] = []

	getEvents(): AgentEvent[] {
		return this.events
	}

	addChunk(chunk: AgentEventChunk): void {
		if (chunk.type === 'message_delta') {
			const lastEvent = this.events[this.events.length - 1]
			// If last event is an agent message, append to it
			if (lastEvent?.type === 'message' && lastEvent.role === 'agent') {
				lastEvent.text += chunk.delta
			} else {
				// Otherwise, start a new message
				this.events.push({
					type: 'message',
					role: 'agent',
					text: chunk.delta
				})
			}
		} else if (chunk.type === 'tool_start') {
			// Start new tool event
			this.events.push({
				type: 'tool',
				id: chunk.id,
				toolName: chunk.toolName,
				input: '',
				output: ''
			})
		} else if (chunk.type === 'tool_input') {
			// Update tool input by ID
			const event = this.events.find(
				e => e.type === 'tool' && e.id === chunk.id
			)
			if (event && event.type === 'tool') {
				event.input = chunk.input
			}
		} else if (chunk.type === 'tool_output') {
			// Update tool output by ID
			const event = this.events.find(
				e => e.type === 'tool' && e.id === chunk.id
			)
			if (event && event.type === 'tool') {
				event.output = chunk.output
			}
		}
	}
}
