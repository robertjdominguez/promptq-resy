interface Coordinates {
  lat: number;
  lon: number;
}

interface PartyDetails {
  partySize: string;
  date: string;
  cityCode: string;
}

interface Restaurant {
  id: number;
  name: string;
  type: string;
  priceRange: number;
  neighborhood: string;
  rating: number;
  totalRatings: number;
  urlSlug: string;
  imageUrl?: string;
}

interface ResySuggestionResponse {
  query: {
    location_id: string;
    day: string;
    party_size: string;
  };
  results: Array<{
    venue: {
      id: { resy: number };
      name: string;
      type: string;
      price_range: number;
      rating?: number;
      total_ratings?: number;
      url_slug: string;
      location?: {
        neighborhood?: string;
      };
      responsive_images?: {
        urls?: Record<
          string,
          {
            "1:1"?: {
              "400"?: string;
            };
          }
        >;
        file_names?: string[];
      };
    };
  }>;
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
 * @param {number} party_size - The party size to get the restaurants for
 * @returns {Promise<Restaurant[]>} - A promise that resolves to an array of restaurants
 */
export async function getRestaurants(city_code: string, date: string, party_size: string): Promise<Restaurant[]> {
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

  const data = (await res.json()) as ResySuggestionResponse;

  // Transform the complex API response into a simplified restaurant array
  return data.results.map((item) => {
    const venue = item.venue;
    let imageUrl: string | undefined;

    // Try to get first image if available
    if (venue.responsive_images?.file_names?.length && venue.responsive_images.urls) {
      const firstImageKey = venue.responsive_images.file_names[0];
      imageUrl = venue.responsive_images.urls[firstImageKey]?.["1:1"]?.["400"];
    }

    return {
      id: venue.id.resy,
      name: venue.name,
      type: venue.type,
      priceRange: venue.price_range,
      neighborhood: venue.location?.neighborhood || "",
      rating: venue.rating || 0,
      totalRatings: venue.total_ratings || 0,
      urlSlug: venue.url_slug,
      imageUrl,
    };
  });
}
