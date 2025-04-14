export interface ValidationResponse {
	success: boolean;
	token?: string;
}

export interface InsertPayload {
	email: string;
	password: string;
	auth_token: string;
	payment_id: string;
}

export interface ValidatePayload {
	email: string;
	password: string;
}
