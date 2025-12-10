/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { fetchRadios } from "./api/radio";
import type { RadioStation } from "./api/radio";
import RadioGlobe from "./components/RadioGlobe";
// import ApiTest from "./components/ApiTest";

export default function App() {
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRadios = async () => {
      console.log("Starting to load radios...");
      try {
        const data = await fetchRadios();
        console.log("Fetched radios:", data.length);
        setRadios(data);
      } catch (err) {
        console.error("Error loading radios:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load radio stations"
        );
      } finally {
        console.log("Setting loading to false");
        setLoading(false);
      }
    };

    loadRadios();
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <RadioGlobe radios={radios} />
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
