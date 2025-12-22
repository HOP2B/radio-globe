/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { fetchRadios } from "./api/radio";
import type { RadioStation } from "./api/radio";
import RadioGlobe from "./components/RadioGlobe";
import SplashScreen from "./components/SplashScreen";
// import ApiTest from "./components/ApiTest";

// Mock data as fallback
const getMockRadios = (): RadioStation[] => {
  const mockStations = [
    {
      stationuuid: "mock-1",
      name: "BBC World Service",
      url: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
      favicon: "https://www.bbc.co.uk/favicon.ico",
      country: "GB",
      city: "London",
      latitude: 51.5074,
      longitude: -0.1278,
      language: "English",
      bitrate: 128,
      codec: "MP3",
      votes: 1000,
    },
    {
      stationuuid: "mock-2",
      name: "Radio France International",
      url: "https://stream.radiofrance.fr/rfi/rfi.m3u8",
      favicon: "https://www.rfi.fr/favicon.ico",
      country: "FR",
      city: "Paris",
      latitude: 48.8566,
      longitude: 2.3522,
      language: "French",
      bitrate: 128,
      codec: "AAC",
      votes: 800,
    },
    {
      stationuuid: "mock-3",
      name: "NHK World Radio",
      url: "https://stream.nhk.jp/radio/nhkworld/nhkworld.m3u8",
      favavicon: "https://www.nhk.or.jp/favicon.ico",
      country: "JP",
      city: "Tokyo",
      latitude: 35.6762,
      longitude: 139.6503,
      language: "Japanese",
      bitrate: 128,
      codec: "AAC",
      votes: 600,
    },
    {
      stationuuid: "mock-4",
      name: "Voice of America",
      url: "https://voa-lh.akamaihd.net/i/voa_1@320272/master.m3u8",
      favicon: "https://www.insidevoa.com/favicon.ico",
      country: "US",
      city: "Washington",
      latitude: 38.9072,
      longitude: -77.0369,
      language: "English",
      bitrate: 128,
      codec: "AAC",
      votes: 900,
    },
    {
      stationuuid: "mock-5",
      name: "Deutsche Welle",
      url: "https://liveradio.dw.com/dwr/live/de.m3u8",
      favavicon: "https://www.dw.com/favicon.ico",
      country: "DE",
      city: "Berlin",
      latitude: 52.52,
      longitude: 13.405,
      language: "German",
      bitrate: 128,
      codec: "AAC",
      votes: 700,
    },
  ];
  return mockStations.map((station) => ({
    ...station,
    favicon: station.favicon || "",
  }));
};

export default function App() {
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const loadRadios = async () => {
      console.log("Starting to load radios...");
      try {
        const data = await fetchRadios();
        console.log("Fetched radios:", data.length);
        setRadios(data);
        setError(null);
      } catch (err) {
        console.error("Error loading radios:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load radio stations";
        setError(errorMessage);

        // Fallback to mock data if API fails
        console.log("Falling back to mock data...");
        const mockData = getMockRadios();
        setRadios(mockData);
      } finally {
        console.log("Setting loading to false");
        setLoading(false);
      }
    };

    loadRadios();
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      {showSplash ? (
        <SplashScreen
          onStart={() => {
            setShowSplash(false);
            // Small delay to ensure smooth transition
            setTimeout(() => {
              // Force re-render to ensure splash is fully gone
            }, 100);
          }}
          stationCount={radios.length}
          error={error}
          loading={loading}
        />
      ) : (
        <RadioGlobe radios={radios} />
      )}
    </div>
  );
  // return (
  //   <div>
  //     <h1>Radio API Test</h1>
  //     <ApiTest />
  //   </div>
  // );
}
// import ApiTest from "./components/ApiTest";

// function App() {
//   return (
//     <div>
//       <h1>Radio API Test</h1>
//       <ApiTest />
//     </div>
//   );
// }

// export default App;
