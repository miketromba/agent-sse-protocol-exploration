# Agent SSE Protocol Exploration

Most agent SDKs and APIs make strong, inflexible assumptions about the state of your system and the protocol used to stream it. This is an exploration of reclaiming ownership over the form and streaming protocol of that state.

## Overview

This project demonstrates a custom streaming protocol for AI agent interactions, built with **Bun**, **React**, and the **Vercel AI SDK**. It showcases how to create a flexible, performant agent communication system with full control over the event schema and streaming mechanism.

![image](./src/assets/image.png)

## Features

### 🎯 Custom Event Protocol
- **Event-based architecture** with two core event types:
  - `MessageEvent`: User and agent text messages with streaming deltas
  - `ToolEvent`: Tool calls with streaming input/output
- **Type-safe event system** using TypeScript discriminated unions
- **Chunk-based streaming** with granular delta updates for real-time UI

### 📦 Binary Protocol with MessagePack
- **60-70% size reduction** using MessagePack encoding instead of JSON
- **Length-prefixed framing** (4-byte headers) for reliable message boundaries
- Efficient binary serialization with `@msgpack/msgpack`

### 🔄 Event Assembly
- **Shared `EventAssembler` class** used consistently on both client and server
- Assembles streaming chunks into complete events
- Handles incremental text deltas and tool call updates
- Supports mutation-based updates for optimal performance

### 🚀 Server-Side Streaming
- **`EventStream` class** wraps `ReadableStream` for custom event control
- Integrates with Vercel AI SDK's `streamText` API
- Transforms AI SDK chunks into custom event format
- Built-in abort/cancellation support

### 💾 Event Persistence
- **`onFinish` callback** for post-stream persistence
- In-memory conversation store (easily swappable with database)
- Automatic storage of complete conversations with user messages and responses
- Events tracked even on stream abortion or errors

### 📜 Pagination & History
- Paginated event history with TanStack React Query
- `/event-history` endpoint with configurable page size
- Merges historical events with real-time streams
- Newest-first pagination with chronological ordering

### 🛠️ Tool Calling Support
- Full AI SDK tool integration (example: `getWeatherTool`)
- Streams tool input and output separately
- Unique IDs for tracking multi-tool scenarios
- Visual loading states during execution

### ⚛️ Optimized React Implementation
- **`useAgent` hook** with memoized context to prevent unnecessary re-renders
- **`useEvents` hook** combining historical and real-time events
- **Component memoization** (`React.memo`) for message and tool components
- **Stable references** with `useCallback` and `useMemo`
- Only changed components re-render, not entire tree

### 🎨 React Performance Monitoring
- **React Scan integration** for visual render debugging
- Highlights components that re-render in real-time
- Console logging for detailed performance insights=

### ⚡ Client-Side Streaming
- **`consumeEventStream` function** handles fetch and framing protocol
- Parses length-prefixed MessagePack frames
- Callback-based API for chunks, errors, and completion
- AbortController support for user-initiated stops

## Run the Demo

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Setup

Create a `.env` file with your Anthropic API key:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

Bun automatically loads `.env` files, so no additional configuration is needed.

## Project Structure

```
src/
├── agent/
│   ├── types.ts                 # Event & chunk type definitions
│   ├── eventAssembler.ts        # Shared chunk→event assembly logic
│   ├── client/
│   │   ├── useAgent.tsx         # Context provider with streaming
│   │   ├── useEvents.tsx        # Pagination + real-time events
│   │   ├── consumeEventStream.ts # Fetch + MessagePack parsing
│   │   └── AgentChat.tsx        # React UI components
│   └── server/
│       ├── EventStream.ts       # ReadableStream wrapper
│       ├── streamAgentResponse.ts # AI SDK integration
│       └── getWeatherTool.ts    # Example tool definition
├── index.ts                      # Bun server with routes
├── frontend.tsx                  # React root with providers
└── App.tsx                       # Main UI component
```

## Key Files

- **`types.ts`**: Defines the event schema (`MessageEvent`, `ToolEvent`) and chunk types
- **`eventAssembler.ts`**: Shared logic for assembling chunks into events
- **`EventStream.ts`**: Server-side stream wrapper with MessagePack encoding
- **`streamAgentResponse.ts`**: Bridges AI SDK to custom event protocol
- **`consumeEventStream.ts`**: Client-side MessagePack frame parser
- **`useAgent.tsx`**: React context with optimized memoization
- **`useEvents.tsx`**: Infinite scroll with React Query + real-time merge

## Extending the Project

### Adding New Tools

1. Create a new tool in `src/agent/server/`:

```typescript
import { tool } from 'ai'
import { z } from 'zod'

export const myCustomTool = tool({
  description: 'Description of what your tool does',
  parameters: z.object({
    param: z.string().describe('Parameter description')
  }),
  execute: async ({ param }) => {
    // Tool logic here
    return { result: 'Tool output' }
  }
})
```

2. Add to `tools` object in `streamAgentResponse.ts`:

```typescript
tools: {
  getWeather: getWeatherTool,
  myCustomTool: myCustomTool
}
```

### Adding New Event Types

1. Define the event type in `types.ts`:

```typescript
export type MyCustomEvent = {
  type: 'custom'
  data: string
}

export type AgentEvent = MessageEvent | ToolEvent | MyCustomEvent
```

2. Add chunk types if streaming:

```typescript
export type MyCustomChunk = {
  type: 'custom_delta'
  delta: string
}

export type AgentEventChunk = /* ... */ | MyCustomChunk
```

3. Update `EventAssembler` to handle the new chunk type
4. Update server and client UI to emit and render the new event type

### Swapping Persistence Layer

Replace the in-memory store in `index.ts`:

```typescript
// Replace:
const conversationStore: AgentEvent[] = []

// With your database client:
import { db } from './db'

// In onFinish callback:
onFinish: async (events) => {
  await db.conversations.insert({ events, timestamp: new Date() })
}

// In /event-history endpoint:
const { events, total } = await db.conversations.paginate({ page, limit })
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) v1.3.1+
- **Framework**: React 19
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai) + Anthropic Claude
- **State**: TanStack React Query
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Serialization**: MessagePack
- **Validation**: Zod
- **Performance**: React Scan

## License

MIT

This project was created using `bun init` in bun v1.3.1. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
