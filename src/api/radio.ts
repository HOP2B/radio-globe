/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  favicon: string;
  country: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export const fetchRadios = async (): Promise<RadioStation[]> => {
  try {
    const res = await fetch("https://de1.api.radio-browser.info/json/stations");
    const radios = await res.json();

    // Map all stations, parse lat/lon if available
    return radios
      .map((r: any) => ({
        ...r,
        latitude: r.latitude != null ? parseFloat(r.latitude) : undefined,
        longitude: r.longitude != null ? parseFloat(r.longitude) : undefined,
      }))
      .slice(0, 500); // limit to first 500 for performance
  } catch (err) {
    console.error("Failed to fetch radios:", err);
    return [];
  }
};
