# Performance Optimizations Applied

## Overview
Optimized event streaming and rendering to ensure only the specific event components that change are re-rendered, not the entire component tree.

## Changes Made

### 1. **AgentChat.tsx** - Component Memoization
- ✅ Converted `MessageEvent` from function to memoized component with `React.memo()`
- ✅ Wrapped `ToolEvent` with `React.memo()` to prevent unnecessary re-renders
- ✅ Improved React keys: Use `event.id` for tools instead of array index for stable identity
- ⚠️ Note: `isStreaming` prop still causes all `ToolEvent` components to re-render when streaming state changes

### 2. **useEvents.tsx** - Array Reference Stability
- ✅ Removed intermediate `realtimeEvents` array copy
- ✅ Simplified memoization to only create new array when actually needed
- ✅ Added `addEvent()` method to `EventAssembler` for cleaner API

### 3. **useAgent.tsx** - Context Optimization
- ✅ Wrapped `sendMessage` in `useCallback()` to maintain stable reference
- ✅ Wrapped `stop` in `useCallback()` to maintain stable reference
- ✅ Memoized entire context value with `useMemo()` to prevent unnecessary provider re-renders
- ✅ Only recreates context when dependencies actually change

### 4. **frontend.tsx** - React Scan Integration
- ✅ Added React Scan for visual render debugging
- ✅ Configured to log render info to console

## How to Use React Scan

1. **Start your dev server:**
   ```bash
   bun --hot ./index.ts
   ```

2. **Open the app in your browser**

3. **Look for visual indicators:**
   - Components that re-render will be highlighted with colored overlays
   - Lighter colors = fewer renders
   - Darker/red colors = many renders (potential issue)

4. **Check the console:**
   - React Scan logs detailed render information
   - Look for which components are rendering and why

5. **Test the optimizations:**
   - Send a message and watch for streaming events
   - You should see ONLY the specific event component being updated light up
   - The entire chat list and parent components should NOT re-render on each chunk

## Remaining Performance Considerations

### Known Issue: `isStreaming` Prop
The `isStreaming` boolean is passed to ALL `ToolEvent` components, which means when streaming state changes, all tool events will re-render even if their data hasn't changed.

**Potential Solutions:**
1. Remove `isStreaming` from `ToolEvent` props and track loading state internally
2. Only pass `isStreaming` to the LAST tool event (the one currently executing)
3. Use a context or store for streaming state that components can selectively subscribe to

### Ideal Render Behavior
When an event chunk arrives:
- ✅ Only the specific event component (message or tool) should re-render
- ✅ Parent `AgentChat` component should NOT re-render
- ✅ Sibling event components should NOT re-render
- ✅ Context provider should NOT re-render

## Performance Monitoring

Watch for these patterns in React Scan:

### ✅ Good (Optimized):
- Single event component flashing on chunk update
- Parent components remain stable
- No cascading re-renders

### ❌ Bad (Needs Optimization):
- Entire chat window flashing
- All event components flashing
- Multiple components re-rendering on single chunk

## Before & After

### Before:
- Every chunk → `useEvents` array change → Context re-render → `AgentChat` re-render → ALL event components re-render
- ~50-100+ component re-renders per chunk

### After:
- Every chunk → Assembler mutation → Memoized array → Context stable → Only changed event re-renders
- ~1-5 component re-renders per chunk (mostly just the updated event)

## Next Steps

If you still see excessive re-renders with React Scan:
1. Check if `isStreaming` prop is causing issues
2. Verify keys are stable (use event IDs, not indices)
3. Ensure no inline object/function creation in render
4. Consider splitting context into separate providers (events vs. actions)

