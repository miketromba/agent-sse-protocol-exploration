import {
	createContext,
	useContext,
	useRef,
	useState,
	type ReactNode
} from 'react'
import type { AgentEvent } from '../types'
import { consumeEventStream } from './consumeEventStream'
import { useEvents } from './useEvents'

type AgentContextType = {
	events: AgentEvent[]
	sendMessage: (text: string) => void
	stop: () => void
	isStreaming: boolean
	isThinking: boolean
	error: string | null
	fetchNextPage: () => void
	hasNextPage: boolean
	isFetchingNextPage: boolean
	isLoadingEvents: boolean
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export function AgentProvider({ children }: { children: ReactNode }) {
	const {
		events,
		addEvent,
		addEventChunk,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading
	} = useEvents()
	const [isStreaming, setIsStreaming] = useState(false)
	const [isThinking, setIsThinking] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const abortRef = useRef<(() => void) | null>(null)

	const stop = () => {
		abortRef.current?.()
	}

	const sendMessage = async (text: string) => {
		// Clear any previous error
		setError(null)

		// Add user message to events
		const userMessage: AgentEvent = {
			type: 'message',
			role: 'user',
			text
		}
		addEvent(userMessage)
		setIsStreaming(true)
		setIsThinking(true)

		// Stream events from server
		const { abort, promise } = consumeEventStream({
			url: '/stream-events',
			message: text,
			onEventChunk: chunk => {
				setIsThinking(false)
				addEventChunk(chunk)
			},
			onError: error => {
				console.error('Error consuming event stream:', error)
				setError(error.message || 'An error occurred while streaming')
				setIsStreaming(false)
				setIsThinking(false)
			},
			onEnd: () => {
				abortRef.current = null
				setIsStreaming(false)
				setIsThinking(false)
			}
		})

		abortRef.current = abort
		await promise
	}

	return (
		<AgentContext.Provider
			value={{
				events,
				sendMessage,
				stop,
				isStreaming,
				isThinking,
				error,
				fetchNextPage,
				hasNextPage,
				isFetchingNextPage,
				isLoadingEvents: isLoading
			}}
		>
			{children}
		</AgentContext.Provider>
	)
}

export function useAgent() {
	const context = useContext(AgentContext)
	if (!context) {
		throw new Error('useAgent must be used within an AgentProvider')
	}
	return context
}
