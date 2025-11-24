import { useState, useMemo } from 'react'
import type { AgentEvent, AgentEventChunk } from '../types'
import { EventAssembler } from '../eventAssembler'

export function useEvents() {
	// Use EventAssembler for shared chunk processing logic
	const [assembler] = useState(() => new EventAssembler())
	const [updateCounter, setUpdateCounter] = useState(0)

	// Get events from assembler (memoized to avoid unnecessary re-renders)
	const events = useMemo(
		() => assembler.getEvents(),
		[assembler, updateCounter]
	)

	function addEvent(event: AgentEvent) {
		// Directly add to the events array
		assembler.getEvents().push(event)
		setUpdateCounter(c => c + 1)
	}

	function addEventChunk(chunk: AgentEventChunk) {
		// Use shared assembler logic
		assembler.addChunk(chunk)
		setUpdateCounter(c => c + 1)
	}

	return { events, addEvent, addEventChunk }
}
