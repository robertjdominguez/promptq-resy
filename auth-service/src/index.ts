import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false },
});

function generateToken(userId: string, email: string): string {
	try {
		return jwt.sign(
			{
				sub: userId,
				email,
				'claims.jwt.hasura.io': {
					'x-hasura-user-id': userId,
					'x-hasura-default-role': 'user',
					'x-hasura-allowed-roles': ['user'],
				},
			},
			process.env.JWT_SECRET || '',
			{ expiresIn: '1d' }
		);
	} catch (err) {
		console.error('Token generation error:', err);
		throw new Error('Failed to generate authentication token');
	}
}

async function insertUser(email: string, password: string, auth_token: string, payment_id: string): Promise<string> {
	const client = await pool.connect();
	const hashedPassword = await bcrypt.hash(password, 10);
	try {
		const result = await client.query(`INSERT INTO users (email, password, auth_token, payment_id) VALUES ($1, $2, $3, $4) RETURNING id`, [
			email,
			hashedPassword,
			auth_token,
			payment_id,
		]);
		return generateToken(result.rows[0].id, email);
	} finally {
		try {
			client.release();
		} catch (releaseErr) {
			console.warn('Failed to release client:', releaseErr);
		}
	}
}

interface ValidationResponse {
	success: boolean;
	token?: string;
}

async function validateUser(email: string, password: string): Promise<ValidationResponse> {
	const client = await pool.connect();
	try {
		const result = await client.query(`SELECT id, password FROM users WHERE email = $1`, [email]);
		if (result.rowCount === 0) throw new Error('Invalid credentials');

		const user = result.rows[0];
		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			throw new Error('Invalid credentials');
		} else {
			return {
				success: true,
				token: generateToken(user.id, email),
			};
		}
	} catch {
		return {
			success: false,
		};
	}
}

interface InsertPayload {
	email: string;
	password: string;
	auth_token: string;
	payment_id: string;
}

interface ValidatePayload {
	email: string;
	password: string;
}

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
