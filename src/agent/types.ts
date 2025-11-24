export type MessageEvent = {
	type: 'message'
	text: string
	role: 'user' | 'agent'
}

export type ToolEvent = {
	type: 'tool'
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
	toolName: string
}

export type ToolInputChunk = {
	type: 'tool_input'
	input: string
}

export type ToolOutputChunk = {
	type: 'tool_output'
	output: string
}

export type AgentEventChunk =
	| MessageChunk
	| ToolStartChunk
	| ToolInputChunk
	| ToolOutputChunk
