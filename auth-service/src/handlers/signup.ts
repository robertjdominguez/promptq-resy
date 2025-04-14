import { InsertPayload } from '../types';
import { insertUser } from '../helpers';
import { jsonResponse } from '../helpers';

export async function handleSignup(req: Request): Promise<Response> {
	try {
		const body: InsertPayload = await req.json();
		const { email, password, auth_token, payment_id } = body;

		const token = await insertUser(email, password, auth_token, payment_id);
		return jsonResponse({ token }, 200);
	} catch (err) {
		console.error('Signup error:', err);
		return jsonResponse({ error: (err as Error).message || String(err) }, 400);
	}
}
