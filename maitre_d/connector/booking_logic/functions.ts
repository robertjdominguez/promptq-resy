interface Coordinates {
  lat: number;
  lon: number;
}

interface CityCode {
  code: string;
}

type ResyCity = {
  all_cities_header: number;
  blog_url: string | null;
  code: string;
  content_tier: number;
  country_code: string;
  country_id: number;
  country_name: string;
  has_rga_venues: boolean;
  id: number;
  latitude: number;
  longitude: number;
  map_center: {
    latitude: number;
    longitude: number;
  };
  name: string;
  radius: number;
  shape_data: any;
  show_in_app: number;
  show_in_display: number;
  show_on_web: number;
  time_zone: string;
  url_slug: string;
  waitlist_max_distance: number;
  waitlist_travel_mode: string;
  metadata: {
    description: string;
    keywords: string[];
    all_cities: {
      header: string;
      tagline: string;
    };
  };
};

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
