import { useCallback, useState } from "react";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  label: string;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async (): Promise<GeoPosition | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location is not supported on this device.");
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
        });
      });
      const next: GeoPosition = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        label: `${result.coords.latitude.toFixed(5)}, ${result.coords.longitude.toFixed(5)}`,
      };
      setPosition(next);
      return next;
    } catch {
      setError("We could not read your location. You can still send the alert.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { position, loading, error, locate };
}
