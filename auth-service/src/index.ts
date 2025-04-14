import { handleSignin, handleSignup } from './handlers';

export default {
	async fetch(req: Request): Promise<Response> {
		const url = new URL(req.url);

		if (req.method === 'POST' && url.pathname === '/signup') {
			return handleSignup(req);
		}

		if (req.method === 'POST' && url.pathname === '/signin') {
			return handleSignin(req);
		}

		return new Response('Not found', { status: 404 });
	},
};
