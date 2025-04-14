import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ValidationResponse } from './types';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false },
});

export function generateToken(userId: string, email: string): string {
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
			{ expiresIn: '1d' },
		);
	} catch (err) {
		console.error('Token generation error:', err);
		throw new Error('Failed to generate authentication token');
	}
}

export async function insertUser(email: string, password: string, auth_token: string, payment_id: string): Promise<string> {
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

export async function validateUser(email: string, password: string): Promise<ValidationResponse> {
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

export function jsonResponse(body: object, status: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
