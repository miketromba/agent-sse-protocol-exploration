import type { AgentEventChunk } from '../types'

export class EventStream {
	private stream: ReadableStream<Uint8Array>
	private controller: ReadableStreamDefaultController<Uint8Array> | null =
		null
	private encoder = new TextEncoder()
	private isCancelled = false

	constructor() {
		this.stream = new ReadableStream({
			start: controller => {
				this.controller = controller
			},
			cancel: () => {
				this.isCancelled = true
			}
		})
	}

	push(chunk: AgentEventChunk) {
		if (!this.controller || this.isCancelled) {
			return
		}

		const chunkLine = JSON.stringify(chunk) + '\n'
		this.controller.enqueue(this.encoder.encode(chunkLine))
	}

	close() {
		if (this.controller && !this.isCancelled) {
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
