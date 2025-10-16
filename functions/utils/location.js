const token = "pk.eyJ1IjoiY29vemlsbGF4IiwiYSI6ImNtZ240eDdxMjFieGcyaXE5OGk0NWY0N3kifQ.iJXQ91f-qIUxbaJ3vGU4PQ";

async function formatLocation(lngLat) {
  if (!lngLat || lngLat.length !== 2) {
    return "Online";
  }
  const [lng, lat] = lngLat;
  
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.features && data.features.length > 0) {
    return data.features[0].place_name;
  } else {
    return "Unknown location";
  }
}

module.exports = { formatLocation };
