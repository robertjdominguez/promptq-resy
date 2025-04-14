import { ValidatePayload } from '../types';
import { validateUser } from '../helpers';
import { jsonResponse } from '../helpers';

export async function handleSignin(req: Request): Promise<Response> {
	let body: ValidatePayload;

	try {
		body = (await req.json()) as ValidatePayload;
	} catch (err) {
		console.error('Signin parse error:', err);
		return jsonResponse({ error: 'Invalid JSON' }, 400);
	}

	const { email, password } = body;
	const isVerified = await validateUser(email, password);

	if (!isVerified.success) {
		return jsonResponse({ error: 'Invalid credentials' }, 401);
	}

	if (isVerified.token) {
		return jsonResponse({ token: isVerified.token }, 200);
	}

	return jsonResponse({ error: 'Unexpected signin result' }, 500);
}
