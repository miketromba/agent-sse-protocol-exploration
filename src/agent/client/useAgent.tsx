import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AgentEvent } from '../types'
import { consumeEventStream } from './consumeEventStream'
import { useEvents } from './useEvents'

type AgentContextType = {
	events: AgentEvent[]
	sendMessage: (text: string) => void
	isStreaming: boolean
	isThinking: boolean
	error: string | null
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export function AgentProvider({ children }: { children: ReactNode }) {
	const { events, addEvent, addEventChunk } = useEvents()
	const [isStreaming, setIsStreaming] = useState(false)
	const [isThinking, setIsThinking] = useState(false)
	const [error, setError] = useState<string | null>(null)

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
		await consumeEventStream({
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
			onComplete: () => {
				setIsStreaming(false)
				setIsThinking(false)
			}
		})
	}

	return (
		<AgentContext.Provider
			value={{ events, sendMessage, isStreaming, isThinking, error }}
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
