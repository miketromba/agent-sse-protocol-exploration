import { useState, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { AgentEvent, AgentEventChunk } from '../types'
import { EventAssembler } from '../eventAssembler'

const PAGE_SIZE = 5

type EventHistoryResponse = {
	events: AgentEvent[]
	page: number
	limit: number
	hasMore: boolean
	total: number
}

async function fetchEventHistory({
	projectId,
	page = 0,
	limit = 20
}: {
	projectId?: string
	page: number
	limit: number
}): Promise<EventHistoryResponse> {
	const params = new URLSearchParams({
		page: page.toString(),
		limit: limit.toString()
	})

	if (projectId) {
		params.append('projectId', projectId)
	}

	const response = await fetch(`/event-history?${params}`)

	if (!response.ok) {
		throw new Error('Failed to fetch event history')
	}

	return response.json()
}

export function useEvents(projectId?: string) {
	// Use EventAssembler for shared chunk processing logic (real-time events)
	const [assembler] = useState(() => new EventAssembler())
	const [updateCounter, setUpdateCounter] = useState(0)

	// Fetch paginated event history
	const {
		data,
		isLoading,
		isError,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		error
	} = useInfiniteQuery({
		queryKey: ['events', projectId],
		queryFn: ({ pageParam = 0 }) =>
			fetchEventHistory({ projectId, page: pageParam, limit: PAGE_SIZE }),
		getNextPageParam: lastPage =>
			lastPage.hasMore ? lastPage.page + 1 : undefined,
		initialPageParam: 0
	})

	// Combine historical events from all pages
	// Pages are ordered newest-first (page 0 = newest), so we need to reverse
	// to get chronological order (oldest to newest)
	const historicalEvents = useMemo(() => {
		if (!data?.pages) return []
		return [...data.pages].reverse().flatMap(page => page.events)
	}, [data])

	// Merge historical and real-time events
	const events = useMemo(() => {
		const realtimeEvents = assembler.getEvents()
		return [...historicalEvents, ...realtimeEvents]
	}, [historicalEvents, assembler, updateCounter])

	function addEvent(event: AgentEvent) {
		assembler.addEvent(event)
		setUpdateCounter(c => c + 1)
	}

	function addEventChunk(chunk: AgentEventChunk) {
		assembler.addChunk(chunk)
		setUpdateCounter(c => c + 1)
	}

	return {
		// Combined events
		events,

		// Real-time event methods (backward compatible)
		addEvent,
		addEventChunk,

		// Pagination data
		data,
		isLoading: isLoading,
		isError,
		error,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage
	}
}
