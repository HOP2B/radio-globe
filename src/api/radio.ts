/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  favicon: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}

export const fetchRadios = async (): Promise<RadioStation[]> => {
  try {
    const res = await fetch("https://de1.api.radio-browser.info/json/stations");
    const radios = await res.json();

    // filter to only stations with lat/lon and map to ensure numbers
    return radios
      .filter((r: any) => r.latitude != null && r.longitude != null)
      .map((r: any) => ({
        ...r,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
      }))
      .slice(0, 200); // limit to first 200 for performance
  } catch (err) {
    console.error("Failed to fetch radios:", err);
    return [];
  }
};
