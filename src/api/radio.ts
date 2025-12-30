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
  language?: string;
  bitrate?: number;
  codec?: string;
  votes?: number;
}
const countryCenters: Record<string, [number, number]> = {
  US: [39.8283, -98.5795], // USA center
  GB: [54.7024, -3.2766], // UK center
  DE: [51.1657, 10.4515], // Germany center
  FR: [46.6034, 1.8883], // France center
  IT: [41.9028, 12.4964], // Italy center
  ES: [40.4637, -3.7492], // Spain center
  CA: [56.1304, -106.3468], // Canada center
  AU: [-25.2744, 133.7751], // Australia center
  JP: [36.2048, 138.2529], // Japan center
  BR: [-14.235, -51.9253], // Brazil center
  RU: [61.524, 105.3188], // Russia center
  CN: [35.8617, 104.1954], // China center
  IN: [20.5937, 78.9629], // India center
  MX: [23.6345, -102.5528], // Mexico center
  AR: [-38.4161, -63.6167], // Argentina center
  ZA: [-30.5595, 22.9375], // South Africa center
  KR: [35.9078, 127.7669], // South Korea center
  NL: [52.1326, 5.2913], // Netherlands center
  SE: [60.1282, 18.6435], // Sweden center
  NO: [60.472, 8.4689], // Norway center
  DK: [56.2639, 9.5018], // Denmark center
  FI: [61.9241, 25.7482], // Finland center
  PL: [51.9194, 19.1451], // Poland center
  CZ: [49.8175, 15.473], // Czech Republic center
  AT: [47.5162, 14.5501], // Austria center
  CH: [46.8182, 8.2275], // Switzerland center
  BE: [50.5039, 4.4699], // Belgium center
  PT: [39.3999, -8.2245], // Portugal center
  GR: [39.0742, 21.8243], // Greece center
  TR: [38.9637, 35.2433], // Turkey center
  EG: [26.0963, 29.9876], // Egypt center
  TH: [15.87, 100.9925], // Thailand center
  MY: [4.2105, 101.9758], // Malaysia center
  ID: [-0.7893, 113.9213], // Indonesia center
  PH: [12.8797, 121.774], // Philippines center
  VN: [14.0583, 108.2772], // Vietnam center
  PK: [30.3753, 69.3451], // Pakistan center
  BD: [23.685, 90.3563], // Bangladesh center
  NG: [9.082, 8.6753], // Nigeria center
  KE: [-0.0236, 37.9062], // Kenya center
  GH: [7.9465, -1.0232], // Ghana center
  TN: [33.8869, 9.5375], // Tunisia center
  MA: [31.7917, -7.0926], // Morocco center
  DZ: [28.0339, 1.6596], // Algeria center
  LY: [26.3351, 17.2283], // Libya center
  SD: [12.8628, 30.2176], // Sudan center
  ET: [9.145, 38.7379], // Ethiopia center
  UG: [1.3733, 32.2903], // Uganda center
  TZ: [-6.369, 34.8888], // Tanzania center
  ZW: [-19.0154, 29.1549], // Zimbabwe center
  ZM: [-13.1339, 27.8493], // Zambia center
  BW: [-22.3285, 24.6849], // Botswana center
  NA: [-22.9576, 18.4904], // Namibia center
  AO: [-11.2027, 17.8739], // Angola center
  MZ: [-18.6657, 35.5296], // Mozambique center
  MG: [-18.7669, 46.8691], // Madagascar center
  CM: [7.3697, 12.3547], // Cameroon center
  CI: [7.5399, -5.5471], // Ivory Coast center
  SN: [14.4974, -14.4524], // Senegal center
  ML: [17.5707, -3.9962], // Mali center
  BF: [12.2383, -1.5616], // Burkina Faso center
  NE: [17.6078, 8.0817], // Niger center
  TD: [15.4542, 18.7322], // Chad center
  CF: [6.6111, 20.9394], // Central African Republic center
  SS: [6.877, 31.307], // South Sudan center
  ER: [15.1794, 39.7823], // Eritrea center
  DJ: [11.8251, 42.5903], // Djibouti center
  SO: [5.1521, 46.1996], // Somalia center
  YE: [15.5527, 48.5164], // Yemen center
  OM: [21.4735, 55.9754], // Oman center
  SA: [23.8859, 45.0792], // Saudi Arabia center
  IQ: [33.2232, 43.6793], // Iraq center
  SY: [34.8021, 38.9968], // Syria center
  LB: [33.8547, 35.8623], // Lebanon center
  JO: [30.5852, 36.2384], // Jordan center
  IL: [31.0461, 34.8516], // Israel center
  PS: [31.9522, 35.2332], // Palestine center
  KW: [29.3117, 47.4818], // Kuwait center
  BH: [25.9304, 50.6378], // Bahrain center
  QA: [25.3548, 51.1839], // Qatar center
  AE: [23.4241, 53.8478], // UAE center
  IR: [32.4279, 53.688], // Iran center
  AF: [33.9391, 67.71], // Afghanistan center
  TM: [38.9697, 59.5563], // Turkmenistan center
  UZ: [41.3775, 64.5853], // Uzbekistan center
  KZ: [48.0196, 66.9237], // Kazakhstan center
  KG: [41.2044, 74.7661], // Kyrgyzstan center
  TJ: [38.861, 71.2761], // Tajikistan center
  MN: [46.8625, 103.8467], // Mongolia center
  NP: [28.3949, 84.124], // Nepal center
  BT: [27.5142, 90.4336], // Bhutan center
  LK: [7.8731, 80.7718], // Sri Lanka center
  MM: [21.9162, 95.956], // Myanmar center
  KH: [12.5657, 104.991], // Cambodia center
  LA: [19.8563, 102.4955], // Laos center
  TL: [-8.8742, 125.7275], // Timor-Leste center
  PG: [-6.3149, 143.9555], // Papua New Guinea center
  SB: [-9.6457, 160.1562], // Solomon Islands center
  VU: [-15.3767, 166.9592], // Vanuatu center
  FJ: [-17.7134, 178.065], // Fiji center
  TO: [-21.1789, -175.1982], // Tonga center
  WS: [-13.759, -172.1046], // Samoa center
  KI: [-3.3704, -168.734], // Kiribati center
  MH: [7.1315, 171.1845], // Marshall Islands center
  PW: [7.5149, 134.5825], // Palau center
  FM: [7.4256, 150.5508], // Micronesia center
  NR: [-0.5228, 166.9315], // Nauru center
  TV: [-7.1095, 177.6493], // Tuvalu center
  CK: [-21.2367, -159.7777], // Cook Islands center
  NU: [-19.0544, -169.8672], // Niue center
  AS: [-14.27, -170.1322], // American Samoa center
  GU: [13.4443, 144.7937], // Guam center
  MP: [17.3308, 145.3847], // Northern Mariana Islands center
  PR: [18.2208, -66.5901], // Puerto Rico center
  VI: [18.3358, -64.8963], // US Virgin Islands center
  KY: [19.5135, -80.566], // Cayman Islands center
  BM: [32.3214, -64.7574], // Bermuda center
  GL: [71.7069, -42.6043], // Greenland center
  FO: [61.8926, -6.9118], // Faroe Islands center
  IS: [64.9631, -19.0208], // Iceland center
  AX: [60.1785, 19.9156], // Åland Islands center
  SJ: [77.5536, 23.6703], // Svalbard and Jan Mayen center
  // Add more as needed
};

export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  favicon: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  language?: string;
  bitrate?: number;
  codec?: string;
  votes?: number;
}

// ------------------ Fetch Radios ------------------
export const fetchRadios = async (): Promise<RadioStation[]> => {
  console.log("Starting radio fetch...");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const endpoints = [
      "https://de1.api.radio-browser.info/json/stations?limit=1000",
      "https://all.api.radio-browser.info/json/stations?limit=1000",
      "https://fr1.api.radio-browser.info/json/stations?limit=1000",
    ];

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const res = await fetch(endpoint, {
          signal: controller.signal,
          headers: { "User-Agent": "RadioGlobe/1.0" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const radios = await res.json();
        if (!Array.isArray(radios) || radios.length === 0)
          throw new Error("API returned empty or invalid data");

        // Process stations
        const processed: RadioStation[] = radios
          .filter((r: any) => r.name && r.url)
          .slice(0, 300)
          .map((r: any) => {
            let lat = parseFloat(r.geo_lat);
            let lng = parseFloat(r.geo_long);
            const hasValidCoords =
              !isNaN(lat) &&
              !isNaN(lng) &&
              lat >= -90 &&
              lat <= 90 &&
              lng >= -180 &&
              lng <= 180;

            if (!hasValidCoords) {
              const center = countryCenters[r.countrycode];
              [lat, lng] = center || [
                (Math.random() - 0.5) * 180,
                (Math.random() - 0.5) * 360,
              ];
            }

            return {
              stationuuid: r.stationuuid || `${r.name}-${Math.random()}`,
              name: r.name,
              url: r.url_resolved || r.url,
              favicon: r.favicon || "",
              country: r.country || "Unknown",
              city: r.state || r.country || "Unknown",
              latitude: lat,
              longitude: lng,
              language: r.language,
              bitrate: r.bitrate,
              codec: r.codec,
              votes: r.votes,
            };
          });

        clearTimeout(timeoutId);
        console.log("Processed radios:", processed.length);

        // Make Mexican radios very rare by limiting to only 5
        const mexicanRadios = processed.filter((r) => r.country === "Mexico");
        const otherRadios = processed.filter((r) => r.country !== "Mexico");
        const selectedMexican = mexicanRadios
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);
        const filteredRadios = [...otherRadios, ...selectedMexican];

        console.log(
          "Filtered radios:",
          filteredRadios.length,
          "Mexican radios kept:",
          selectedMexican.length
        );
        return filteredRadios;
      } catch (err) {
        console.warn(`Endpoint ${endpoint} failed:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    throw lastError || new Error("All API endpoints failed");
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch radios"
    );
  }
};

// ------------------ Process for Map ------------------
export const processRadiosForMap = (
  stations: RadioStation[]
): RadioStation[] => {
  const mexicoStations = stations.filter((s) => s.country === "Mexico");
  const otherStations = stations.filter((s) => s.country !== "Mexico");

  const maxMexico = Math.max(1, Math.floor(otherStations.length * 0.1));
  const limitedMexico = mexicoStations.slice(0, maxMexico);

  const combined = [...otherStations, ...limitedMexico];
  return combined.sort(() => Math.random() - 0.5);
};

// ------------------ Pick Balloon Station ------------------
export const pickBalloonStation = (stations: RadioStation[]): RadioStation => {
  const mexicoStations = stations.filter((s) => s.country === "Mexico");
  const otherStations = stations.filter((s) => s.country !== "Mexico");

  const maxMexico = Math.max(1, Math.floor(otherStations.length * 0.1));
  const limitedMexico = mexicoStations.slice(0, maxMexico);

  const combined = [...otherStations, ...limitedMexico];
  const shuffled = combined.sort(() => Math.random() - 0.5);

  const weighted = shuffled.flatMap((station) => {
    const weight = station.country === "Mexico" ? 1 : 5;
    return Array(weight).fill(station);
  });

  const index = Math.floor(Math.random() * weighted.length);
  return weighted[index];
};
