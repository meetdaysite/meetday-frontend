interface RazorpayOptions {
	key: string
	amount: number
	currency: string
	order_id: string
	name: string
	description: string
	handler: (response: RazorpayPaymentResponse) => void
	theme?: { color: string }
	modal?: {
		ondismiss?: () => void
	}
}

interface RazorpayPaymentResponse {
	razorpay_order_id: string
	razorpay_payment_id: string
	razorpay_signature: string
}

interface RazorpayFailureResponse {
	error: {
		code: string
		description: string
		reason: string
		source: string
		step: string
		metadata: { order_id: string; payment_id: string }
	}
}

interface RazorpayInstance {
	open(): void
	on(event: "payment.failed", handler: (response: RazorpayFailureResponse) => void): void
}

interface Window {
	Razorpay: new (options: RazorpayOptions) => RazorpayInstance
}
