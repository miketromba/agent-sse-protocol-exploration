import { tool } from 'ai'
import z from 'zod'

function rand(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}
function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export const getWeatherTool = tool({
	description: 'Get the weather for a given location',
	inputSchema: z.object({
		location: z.string()
	}),
	outputSchema: z.object({
		weather: z.string()
	}),
	execute: async ({ location }) => {
		const randomWeather = ['sunny', 'cloudy', 'rainy', 'snowy'][rand(0, 3)]
		await sleep(rand(1000, 3000))
		return {
			weather: `The weather in ${location} is ${randomWeather}`
		}
	}
})
