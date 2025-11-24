import { useState } from 'react'
import type { AgentEvent, AgentEventChunk } from '../types'

export function useEvents() {
	const [events, setEvents] = useState<AgentEvent[]>([])

	function addEvent(event: AgentEvent) {
		setEvents(prev => [...prev, event])
	}

	function addEventChunk(chunk: AgentEventChunk) {
		if (chunk.type === 'message_delta') {
			setEvents(prev => {
				const lastEvent = prev[prev.length - 1]
				// If last event is an agent message, append to it
				if (
					lastEvent?.type === 'message' &&
					lastEvent.role === 'agent'
				) {
					return [
						...prev.slice(0, -1),
						{ ...lastEvent, text: lastEvent.text + chunk.delta }
					]
				}
				// Otherwise, start a new message
				return [
					...prev,
					{
						type: 'message',
						role: 'agent',
						text: chunk.delta
					}
				]
			})
		} else if (chunk.type === 'tool_start') {
			// Start new tool event
			const newEvent: AgentEvent = {
				type: 'tool',
				id: chunk.id,
				toolName: chunk.toolName,
				input: '',
				output: ''
			}
			addEvent(newEvent)
		} else if (chunk.type === 'tool_input') {
			// Update tool input by ID
			updateEvent({
				type: 'tool',
				id: chunk.id,
				input: chunk.input
			})
		} else if (chunk.type === 'tool_output') {
			// Update tool output by ID
			updateEvent({
				type: 'tool',
				id: chunk.id,
				output: chunk.output
			})
		}
	}

	function updateEvent(update: Partial<AgentEvent>) {
		setEvents(prev => {
			if ('id' in update) {
				// Update tool event by ID
				const index = prev.findIndex(
					event => 'id' in event && event.id === update.id
				)
				if (index !== -1) {
					return [
						...prev.slice(0, index),
						{ ...prev[index], ...update },
						...prev.slice(index + 1)
					] as AgentEvent[]
				}
			} else if (update.type === 'message') {
				for (let i = prev.length - 1; i >= 0; i--) {
					const event = prev[i]
					if (
						event &&
						event.type === 'message' &&
						event.role === 'agent'
					) {
						return [
							...prev.slice(0, i),
							{ ...event, ...update },
							...prev.slice(i + 1)
						] as AgentEvent[]
					}
				}
			}
			return [...prev, update as AgentEvent]
		})
	}

	return { events, addEvent, addEventChunk }
}
