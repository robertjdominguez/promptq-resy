import { Pool } from "pg";
import jwt from "jsonwebtoken";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * This is a convenience function that — absent of a built-out UI — inserts a user into the database.
 * The following fields are required:
 * @param {string} email - The email of the user
 * @param {string} auth_token - The auth token of the user in Resy
 * @param {string} payment_id - The payment ID of the user in Resy
 *
 * The function will return a JWT that can be used to authenticate the user in the app.
 */
export async function insertUser(email: string, auth_token: string, payment_id: string): Promise<string> {
  const client = await pool.connect();
  try {
    const insertQuery = `
      INSERT INTO users (email, auth_token, payment_id)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const values = [email, auth_token, payment_id];

    const result = await client.query(insertQuery, values);
    const userId = result.rows[0].id;

    client.release();

    const token = jwt.sign(
      {
        sub: userId,
        email,
        "https://claims.jwt.hasura.io": {
          "x-hasura-user-id": userId,
          "x-hasura-default-role": "user",
          "x-hasura-allowed-roles": ["user"],
        },
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    return token;
  } catch (err) {
    console.error("Error inserting user:", err);
    throw new Error("Failed to insert user");
  }
}
