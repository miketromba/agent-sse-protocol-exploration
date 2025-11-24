import './index.css'
import AgentChat from './agent/client/AgentChat.tsx'
import { AgentProvider } from './agent/client/useAgent.tsx'

export function App() {
	return (
		<AgentProvider>
			<div className="max-w-7xl mx-auto p-8 flex flex-col items-center justify-center gap-8">
				<h1 className="text-3xl font-bold">AI SDK SSE Wrapper</h1>
				<AgentChat />
			</div>
		</AgentProvider>
	)
}

export default App
