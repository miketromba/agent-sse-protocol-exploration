export type MessageEvent = {
	type: 'message'
	text: string
	role: 'user' | 'agent'
}

export type ToolEvent = {
	type: 'tool'
	id: string
	toolName: string
	input: string
	output: string
}

export type AgentEvent = MessageEvent | ToolEvent

// Chunk types for streaming
export type MessageChunk = {
	type: 'message_delta'
	delta: string
}

export type ToolStartChunk = {
	type: 'tool_start'
	id: string
	toolName: string
}

export type ToolInputChunk = {
	type: 'tool_input'
	id: string
	input: string
}

export type ToolOutputChunk = {
	type: 'tool_output'
	id: string
	output: string
}

export type AgentEventChunk =
	| MessageChunk
	| ToolStartChunk
	| ToolInputChunk
	| ToolOutputChunk
