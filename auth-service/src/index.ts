import { InsertPayload, ValidatePayload } from './types';
import { insertUser, validateUser } from './helpers';

export default {
	async fetch(req: Request): Promise<Response> {
		const url = new URL(req.url);

		if (req.method === 'POST' && url.pathname === '/signup') {
			try {
				const body: InsertPayload = await req.json();
				const { email, password, auth_token, payment_id } = body;
				try {
					const token = await insertUser(email, password, auth_token, payment_id);
					return new Response(JSON.stringify({ token }), {
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					});
				} catch (err) {
					console.error('Insert error:', err);
					return new Response(JSON.stringify({ error: (err as Error).message || String(err) }), {
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					});
				}
			} catch (parseErr) {
				console.error('Request parsing error:', parseErr);
				return new Response(JSON.stringify({ error: 'Invalid request format' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		if (req.method === 'POST' && url.pathname === '/signin') {
			let body: ValidatePayload;
			try {
				body = (await req.json()) as ValidatePayload;
			} catch (e) {
				return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			const { email, password } = body;

			const isVerified = await validateUser(email, password);

			if (!isVerified.success) {
				return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			if (isVerified.token) {
				return new Response(JSON.stringify({ token: isVerified.token }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		return new Response('Not found', { status: 404 });
	},
};
