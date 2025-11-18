const token = "pk.eyJ1IjoiY29vemlsbGF4IiwiYSI6ImNtZ240eDdxMjFieGcyaXE5OGk0NWY0N3kifQ.iJXQ91f-qIUxbaJ3vGU4PQ";

/**
 * Format a longitude and latitude pair into a human-readable location string.
 * @param lngLat Array containing longitude and latitude, or null for online location
 * @returns Formatted location string
 */
async function formatLocation(lngLat: number[] | null): Promise<string> {
  // Handle online location
  if (!lngLat || lngLat.length !== 2) {
    return "Online";
  }
  // Call Mapbox Geocoding API
  const [lng, lat] = lngLat;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`;
  // Fetch the location data
  const res = await fetch(url);
  const data = (await res.json()) as {
    type: string;
    query: number[];
    features: Array<{
      place_name: string;
    }>;
    attribution: string;
  };
  // Extract and return the place name
  if (data.features && data.features.length > 0) {
    return data.features[0].place_name;
  } else {
    return "Unknown location";
  }
}

export { formatLocation };
