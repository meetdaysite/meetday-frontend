export class ApiError extends Error {
	statusCode: number
	data: unknown

	constructor(message: string, statusCode: number, data?: unknown) {
		super(message)
		this.name = "ApiError"
		this.statusCode = statusCode
		this.data = data
	}
}

export function getApiErrorMessage(error: unknown): string {
	if (error instanceof ApiError) return error.message
	if (error instanceof Error) return error.message
	return "Something went wrong. Please try again."
}
