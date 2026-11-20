const toRad = (deg: number) => (deg * Math.PI) / 180;

// Great-circle distance in kilometres.
export const distanceKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};
