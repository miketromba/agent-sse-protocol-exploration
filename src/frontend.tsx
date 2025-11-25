/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from 'react-dom/client'
import { scan } from 'react-scan'
import { App } from './App'

// Enable React Scan for render performance auditing
// This will highlight components that re-render in the browser
if (typeof window !== 'undefined') {
	scan({
		enabled: true,
		log: true // Log render info to console
	})
}

function start() {
	const root = createRoot(document.getElementById('root')!)
	root.render(<App />)
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', start)
} else {
	start()
}
