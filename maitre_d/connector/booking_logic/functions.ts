interface Coordinates {
  lat: number;
  lon: number;
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
