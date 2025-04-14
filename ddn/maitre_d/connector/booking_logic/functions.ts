import FormData from "form-data";
import axios from "axios";
import { Pool } from "pg";
import { finalConfig, getBookToken } from "./utils/config";
import { Coordinates, VenueInfo, CityCode, BookingResponse } from "./utils/types";

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_URI,
  ssl: { rejectUnauthorized: false }, // optional, based on your PG setup
});

/**
 *
 * This function fetches the coordinates of a city using the OpenCage Geocoding API.
 *
 * @readonly
 * @param {string} city - The city to get the coordinates for
 * @returns {Promise<Coordinates>} - A promise that resolves to an object containing the latitude and longitude of the city
 */
export async function getLatLon(city: string): Promise<Coordinates> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "MyApp/1.0 (contact@example.com)",
    },
  });

  if (!response.ok) {
    console.warn(`Geocoding failed: ${response.statusText}`);
    return { lat: 0, lon: 0 };
  }

  const data = (await response.json()) as { lat: string; lon: string }[];

  if (data.length === 0) {
    console.warn(`No results found for city: ${city}`);
    return { lat: 0, lon: 0 };
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };
}

/**
 * This function takes a pair of coordinates, and returns a city code from the Resy API.
 *
 * @readonly
 * @param {Coordinates} coordinates - The coordinates to get the city code for
 * @returns {Promise<CityCode>} - A promise that resolves to the city code
 */
export async function getCityCode(coordinates: Coordinates): Promise<CityCode> {
  const url = `https://api.resy.com/3/location/config?lat=${coordinates.lat}&long=${coordinates.lon}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`City code fetch failed: ${response.statusText}`);
    return { code: "" };
  }
  const data: any = await response.json();
  const code = data[0].code;
  return { code: code };
}

/**
 * This function takes in a city code, the current date, and a party size to show the list of restaurants with availability.
 *
 * @readonly
 * @param {string} cityCode - The city code to get the restaurants for
 * @param {string} date - The date to get the restaurants for in YYYY-MM-DD format
 * @param {number} party_size - The party size to get the restaurants for
 * @returns {Promise<VenuInfo[]>} - A promise that resolves to an array of restaurants with only the necessary information
 */
export async function getRestaurants(city_code: string, date: string, party_size: string): Promise<VenueInfo[]> {
  // Check for environment variables
  const requiredEnvVars = ["RESY_API_KEY", "RESY_COOKIE", "RESY_AUTH_TOKEN"];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing ${envVar}`);
    }
  }

  const apiKey = process.env.RESY_API_KEY!;
  const authToken = process.env.RESY_AUTH_TOKEN!;
  const cookie = process.env.RESY_COOKIE!;

  const url = `https://api.resy.com/3/collection/suggestions?location_id=${city_code}&day=${date}&party_size=${party_size}`;

  const headers = {
    authority: "api.resy.com",
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,la;q=0.8",
    authorization: `ResyAPI api_key="${apiKey}"`,
    "cache-control": "no-cache",
    origin: "https://resy.com",
    referer: "https://resy.com/",
    "sec-ch-ua": '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "x-origin": "https://resy.com",
    "x-resy-auth-token": authToken,
    cookie: cookie,
  };

  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }

  const data = (await res.json()) as any;

  return data.results
    .map((item: any) => {
      if (!item || !item.venue || !item.venue.id || !item.venue.id.resy) {
        console.warn("Skipping invalid venue:", item);
        return null;
      }

      const slots = item.slots ?? [];

      return {
        id: item.venue.id.resy,
        name: item.venue.name,
        type: item.venue.type,
        description: item.venue.content?.[0]?.body || null,
        priceRange: item.venue.price_range,
        neighborhood: item.venue.location?.neighborhood || "Unknown",
        rating: item.venue.rating || 0,
        totalRatings: item.venue.total_ratings || 0,
        location: {
          lat: item.venue.location?.geo?.lat || 0,
          lon: item.venue.location?.geo?.lon || 0,
        },
        slots: slots.map((slot: any) => ({
          start: slot.date.start,
          end: slot.date.end,
          type: slot.config.type,
          slot_id: slot.config.token,
        })),
      };
    })
    .filter(Boolean);
}

/**
 *
 * @description You should use this function when booking a reservation. One parameter that will be needed inside of it is notes for the reservation. You should make something up based on the restaurant's description and the conversation with the user that led to the reservation.
 *
 * @param {string} slot_id - The slot ID to get the booking config for; this looks like rgs://resy/701/2791420/2/2025-04-17/2025-04-17/20:30:00/3/Dining Room
 * @param {string} user_id - The user ID to make the booking for; this is the unique identifier for the user in the Resy system
 * @param {string} restaurant_name - The name of the restaurant to make the booking for
 * @param {string} date - The date to make the booking for in YYYY-MM-DD format
 * @param {string} party_size - The party size to make the booking config for
 * @param {string} auth_token — This is unique to each user and is contained in their public_user record
 * @param {string} payment_id — This is the payment method ID and is unique to each user also found in their public_user record
 * @returns
 */
export async function makeBooking(
  slot_id: string,
  user_id: string,
  restaurant_name: string,
  date: string,
  party_size: string,
  auth_token: string,
  payment_id: string
): Promise<BookingResponse> {
  let config = finalConfig(auth_token);
  const formData = new FormData();
  const bookingToken = await getBookToken(slot_id, date, party_size);
  formData.append("struct_payment_method", JSON.stringify({ id: payment_id }));
  formData.append("book_token", bookingToken);
  formData.append("source_id", "resy.com-venue-details");

  try {
    const response = await axios.post(config.url, formData, {
      headers: {
        ...config.headers,
        ...formData.getHeaders(),
      },
    });

    console.log(response.data);

    // 🗃 Insert into reservations table
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO reservations (user_id, venue_id, notes)
         VALUES ($1, $2, $3)`,
        [user_id, restaurant_name, ""]
      );
    } finally {
      client.release();
    }

    return {
      token: response.data.resy_token,
      success: true,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      token: "",
    };
  }
}
