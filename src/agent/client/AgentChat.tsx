import { useAgent } from './useAgent.tsx'
import { ChevronRight, Send, Loader2, AlertCircle } from 'lucide-react'
import { useState } from 'react'

function MessageEvent(text: string, role: 'user' | 'agent') {
	return (
		<div
			className={`flex mb-2 ${
				role === 'user' ? 'justify-end' : 'justify-start'
			}`}
		>
			<div
				className={`max-w-xs px-4 py-2 rounded-lg shadow ${
					role === 'user'
						? 'bg-blue-600 text-white rounded-br-none'
						: 'bg-gray-700 text-gray-100 rounded-bl-none'
				}`}
			>
				<span>{text}</span>
			</div>
		</div>
	)
}

function ToolEvent({
	toolName,
	input,
	output,
	isStreaming
}: {
	toolName: string
	input: string
	output: string
	isStreaming: boolean
}) {
	const [isExpanded, setIsExpanded] = useState(false)
	const isLoading = isStreaming && !output

	return (
		<div className="my-2">
			<button
				onClick={() => setIsExpanded(expanded => !expanded)}
				className={`w-full flex items-center gap-2 ${
					isExpanded ? 'bg-gray-700' : 'bg-gray-800'
				} text-gray-100 text-xs font-mono px-3 py-2 rounded hover:bg-gray-600 transition-colors`}
			>
				<ChevronRight
					className={`w-3 h-3 transition-transform ${
						isExpanded ? 'rotate-90' : ''
					}`}
				/>
				<span className="flex items-center gap-2">
					🛠️ {toolName}
					{isLoading && (
						<Loader2 className="w-3 h-3 animate-spin text-blue-400" />
					)}
				</span>
			</button>
			{isExpanded && (
				<div className="mt-1 ml-5 space-y-1 text-xs">
					<div className="bg-gray-800 text-gray-300 font-mono px-3 py-2 rounded">
						<div className="text-gray-500 font-semibold mb-1">
							Input:
						</div>
						<div className="break-all">{input || '...'}</div>
					</div>
					<div className="bg-gray-800 text-gray-300 font-mono px-3 py-2 rounded">
						<div className="text-gray-500 font-semibold mb-1">
							Output:
						</div>
						{isLoading ? (
							<div className="flex items-center gap-2 text-gray-400">
								<Loader2 className="w-3 h-3 animate-spin" />
								<span>Processing...</span>
							</div>
						) : (
							<div className="break-all">{output}</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

function ChatInput({ onSend }: { onSend: (message: string) => void }) {
	const [input, setInput] = useState('')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (input.trim()) {
			onSend(input.trim())
			setInput('')
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex gap-2 items-center pt-4 border-t border-gray-700"
		>
			<input
				type="text"
				value={input}
				onChange={e => setInput(e.target.value)}
				placeholder="Type a message..."
				className="flex-1 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
			/>
			<button
				type="submit"
				className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!input.trim()}
			>
				<Send className="w-5 h-5" />
			</button>
		</form>
	)
}

function ThinkingIndicator() {
	return (
		<div className="flex items-center gap-2 my-2">
			<div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg rounded-bl-none shadow">
				<div className="flex items-center gap-2">
					<Loader2 className="w-4 h-4 animate-spin text-blue-400" />
					<span className="text-sm">Thinking...</span>
				</div>
			</div>
		</div>
	)
}

function ErrorEvent({ message }: { message: string }) {
	return (
		<div className="flex items-center gap-2 my-2">
			<div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-2 rounded-lg shadow">
				<div className="flex items-center gap-2">
					<AlertCircle className="w-4 h-4 text-red-400" />
					<div>
						<div className="text-xs font-semibold text-red-300">
							Error
						</div>
						<div className="text-sm">{message}</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function AgentChat() {
	const { events, sendMessage, isStreaming, isThinking, error } = useAgent()

	return (
		<div className="w-full max-w-lg text-sm mx-auto p-4 border border-gray-700 rounded-lg">
			<div className="flex flex-col gap-2 mb-4">
				{events.length === 0 ? (
					MessageEvent('Hello, how can I help you today?', 'agent')
				) : (
					<>
						{events.map((event, index) => {
							if (event.type === 'message') {
								return (
									<div key={index}>
										{MessageEvent(event.text, event.role)}
									</div>
								)
							} else if (event.type === 'tool') {
								const isLastEvent = index === events.length - 1
								return (
									<div key={index}>
										<ToolEvent
											toolName={event.toolName}
											input={event.input}
											output={event.output}
											isStreaming={
												isStreaming && isLastEvent
											}
										/>
									</div>
								)
							}
							return null
						})}
						{isThinking && <ThinkingIndicator />}
						{error && <ErrorEvent message={error} />}
					</>
				)}
			</div>
			<ChatInput onSend={sendMessage} />
		</div>
	)
}
