import { stepCountIs, streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { EventStream } from '../EventStream'
import { getWeatherTool } from './getWeatherTool'

export function streamAgentResponse({
	message,
	abortSignal
}: {
	message: string
	abortSignal?: AbortSignal
}): EventStream {
	const eventStream = new EventStream()

	// Start streaming asynchronously
	;(async () => {
		try {
			const { fullStream } = streamText({
				model: anthropic('claude-haiku-4-5'),
				prompt: message,
				tools: {
					getWeather: getWeatherTool
				},
				stopWhen: stepCountIs(10),
				abortSignal
			})

			// Consume the async iterator directly - more efficient than pipeTo
			for await (const chunk of fullStream) {
				console.log(chunk)
				if (chunk.type === 'text-delta') {
					eventStream.push({
						type: 'message_delta',
						delta: chunk.text
					})
				} else if (chunk.type === 'tool-input-start') {
					eventStream.push({
						type: 'tool_start',
						id: chunk.id,
						toolName: chunk.toolName
					})
				} else if (chunk.type === 'tool-call') {
					eventStream.push({
						type: 'tool_input',
						id: chunk.toolCallId,
						input: JSON.stringify(chunk.input)
					})
				} else if (chunk.type === 'tool-result') {
					eventStream.push({
						type: 'tool_output',
						id: chunk.toolCallId,
						output: JSON.stringify(chunk.output)
					})
				}
			}

			eventStream.close()
		} catch (error) {
			console.error('Error streaming agent response:', error)
			eventStream.error(
				error instanceof Error ? error : new Error(String(error))
			)
		}
	})()

	return eventStream
}
