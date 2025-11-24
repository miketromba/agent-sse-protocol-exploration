import type { AgentEvent } from './types'

// Placeholder events for streaming responses from the server
// Simulates a complex agentic workflow with multiple tool calls
export const placeholderEvents: AgentEvent[] = [
	{
		type: 'message',
		role: 'agent',
		text: "I'll analyze the website performance for you. Let me start by checking the current status."
	},
	{
		type: 'tool',
		toolName: 'fetchWebsiteMetrics',
		input: '{ url: "https://example.com", metrics: ["load_time", "size", "requests"] }',
		output: '{ load_time: "3.2s", total_size: "2.1MB", total_requests: 47, status: "ok" }'
	},
	{
		type: 'message',
		role: 'agent',
		text: 'I see the page takes 3.2 seconds to load with 47 requests. Let me break down where the time is being spent.'
	},
	{
		type: 'tool',
		toolName: 'analyzePerformanceTimeline',
		input: '{ url: "https://example.com" }',
		output: '{ breakdown: { html: "0.8s", css: "0.5s", javascript: "1.4s", images: "0.3s", fonts: "0.2s" } }'
	},
	{
		type: 'message',
		role: 'agent',
		text: 'The JavaScript is taking the most time (1.4s). Let me identify which scripts are causing the bottleneck.'
	},
	{
		type: 'tool',
		toolName: 'identifyLargeAssets',
		input: '{ url: "https://example.com", type: "javascript", minSize: "50KB" }',
		output: '{ assets: [{ name: "bundle.js", size: "450KB", blocking: true }, { name: "analytics.js", size: "120KB", blocking: false }, { name: "vendor.js", size: "380KB", blocking: true }] }'
	},
	{
		type: 'message',
		role: 'agent',
		text: 'Found two large blocking scripts (bundle.js at 450KB and vendor.js at 380KB). Let me check if these are properly optimized.'
	},
	{
		type: 'tool',
		toolName: 'checkAssetOptimization',
		input: '{ assets: ["bundle.js", "vendor.js"], checks: ["minification", "compression", "tree_shaking"] }',
		output: '{ bundle_js: { minified: true, compressed: "gzip", tree_shaking: false, savings_potential: "35%" }, vendor_js: { minified: true, compressed: "gzip", tree_shaking: false, savings_potential: "42%" } }'
	},
	{
		type: 'message',
		role: 'agent',
		text: "Both scripts are minified and compressed, but tree-shaking isn't enabled. This could reduce the bundle sizes significantly. Let me also check the caching strategy."
	},
	{
		type: 'tool',
		toolName: 'analyzeCacheHeaders',
		input: '{ url: "https://example.com" }',
		output: '{ static_assets: { cache_control: "public, max-age=3600", issues: ["short_cache_duration"] }, images: { cache_control: "no-cache", issues: ["no_caching", "missing_etag"] } }'
	},
	{
		type: 'message',
		role: 'agent',
		text: 'The caching configuration needs improvement. Images have no caching enabled, and static assets only cache for 1 hour. Let me compile a final report with recommendations.'
	},
	{
		type: 'tool',
		toolName: 'generateOptimizationReport',
		input: '{ findings: ["large_js_bundles", "no_tree_shaking", "poor_caching"], url: "https://example.com" }',
		output: '{ priority_issues: 3, total_savings: "1.2s", recommendations: ["enable_tree_shaking", "extend_cache_duration", "implement_image_caching", "code_splitting"] }'
	},
	{
		type: 'message',
		role: 'agent',
		text: "Analysis complete! I've identified 3 priority issues that could save 1.2 seconds of load time:\n\n1. **Enable tree-shaking** - Could reduce JavaScript bundles by 35-42% (~300KB savings)\n2. **Extend cache duration** - Set static assets to cache for at least 1 year (max-age=31536000)\n3. **Implement image caching** - Add proper cache headers and ETags for images\n4. **Consider code splitting** - Break large bundles into smaller chunks loaded on demand\n\nImplementing these changes should bring your load time down from 3.2s to under 2 seconds."
	}
]
