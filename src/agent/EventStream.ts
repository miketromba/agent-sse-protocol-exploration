import type { AgentEventChunk } from './types'

export class EventStream {
	private stream: ReadableStream<Uint8Array>
	private controller: ReadableStreamDefaultController<Uint8Array> | null =
		null
	private encoder = new TextEncoder()

	constructor() {
		this.stream = new ReadableStream({
			start: controller => {
				this.controller = controller
			}
		})
	}

	push(chunk: AgentEventChunk) {
		if (!this.controller) {
			throw new Error('Stream controller not initialized')
		}

		const chunkLine = JSON.stringify(chunk) + '\n'
		this.controller.enqueue(this.encoder.encode(chunkLine))
	}

	close() {
		if (this.controller) {
			this.controller.close()
		}
	}

	error(error: Error) {
		if (this.controller) {
			this.controller.error(error)
		}
	}

	getReadableStream(): ReadableStream<Uint8Array> {
		return this.stream
	}

	toNDJSONStreamResponse(): Response {
		return new Response(this.getReadableStream(), {
			headers: {
				'Content-Type': 'application/x-ndjson',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		})
	}
}
