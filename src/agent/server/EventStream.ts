import type { AgentEvent, AgentEventChunk } from '../types'
import { encode } from '@msgpack/msgpack'
import { EventAssembler } from '../eventAssembler'

export class EventStream {
	private stream: ReadableStream<Uint8Array>
	private controller: ReadableStreamDefaultController<Uint8Array> | null =
		null
	private isCancelled = false
	private assembler = new EventAssembler()

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
		// Always track chunks in assembler for persistence
		this.assembler.addChunk(chunk)

		if (!this.controller || this.isCancelled) {
			return
		}

		// Encode chunk with MessagePack for ~60-70% size reduction
		const encoded = encode(chunk)

		// Use length-prefixed framing: prepend 4-byte length header
		const lengthPrefix = new Uint8Array(4)
		const view = new DataView(lengthPrefix.buffer)
		view.setUint32(0, encoded.length, false) // big-endian

		// Combine length prefix + encoded data
		const frame = new Uint8Array(4 + encoded.length)
		frame.set(lengthPrefix)
		frame.set(encoded, 4)

		this.controller.enqueue(frame)
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

	/**
	 * Get all assembled events from the stream.
	 * Call this after the stream has finished to retrieve the complete event history.
	 */
	getEvents(): AgentEvent[] {
		return this.assembler.getEvents()
	}

	getReadableStream(): ReadableStream<Uint8Array> {
		return this.stream
	}

	toNDJSONStreamResponse(): Response {
		return new Response(this.getReadableStream(), {
			headers: {
				'Content-Type': 'application/x-msgpack',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		})
	}
}
