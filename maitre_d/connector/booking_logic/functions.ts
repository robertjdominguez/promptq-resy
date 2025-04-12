interface Coordinates {
  lat: number;
  lon: number;
}

interface PartyDetails {
  partySize: number;
  date: string;
  cityCode: string;
}

type QueryInfo = {
  location_id: string;
  day: string;
  party_size: number;
  limit?: number;
  time_filter?: string | null;
  url_slug?: string | null;
};

type VenueGroup = {
  id: number;
  name: string;
  venues: number[];
};

type Venue = {
  id: { resy: number };
  name: string;
  type: string;
  url_slug: string;
  price_range: number;
  average_bill_size: number;
  currency_symbol: string;
  hospitality_included: number;
  resy_select: number;
  is_gdc: number;
  is_global_dining_access: boolean;
  is_global_dining_access_only: boolean;
  requires_reservation_transfers: number;
  venue_group: VenueGroup;
};

type ResySuggestionResult = {
  venue: Venue;
};

type ResySuggestionResponse = {
  query: QueryInfo;
  results: ResySuggestionResult[];
};

interface Restaurant {
  id: number;
  name: string;
  type: string;
  price_range: number;
  average_bill_size: number;
  rating: number;
  total_ratings: number;
  neighborhood: string;
  image_url: string;
}

interface CityCode {
  code: string;
}

interface ResyCity {
  query: any;
  results: any;
}

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
 * @param {number} partySize - The party size to get the restaurants for
 * @returns {Promise<Restaurant[]>} - A promise that resolves to an array of restaurants
 */
export async function getRestaurants(): Promise<ResySuggestionResponse> {
  // Check for environment variables
  if (!process.env.RESY_API_KEY) {
    throw new Error("Missing Resy API key");
  }
  if (!process.env.RESY_COOKIE) {
    throw new Error("Missing Resy cookie");
  }
  if (!process.env.RESY_AUTH_TOKEN) {
    throw new Error("Missing Resy auth token");
  }

  const res = await fetch("https://api.resy.com/3/collection/suggestions?location_id=sf&day=2025-04-12&party_size=3", {
    headers: {
      authority: "api.resy.com",
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,la;q=0.8",
      authorization: `ResyAPI api_key="${process.env.RESY_API_KEY}"`,
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
      "x-resy-auth-token": process.env.RESY_AUTH_TOKEN,
      cookie: process.env.RESY_COOKIE,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }

  return (await res.json()) as ResySuggestionResponse;
}
