import { useEffect, useState } from "react";
import { fetchRadios } from "./api/radio";
import type { RadioStation } from "./api/radio";
import RadioGlobe from "./components/RadioGlobe";

export default function App() {
  const [radios, setRadios] = useState<RadioStation[]>([]);

  useEffect(() => {
    const loadRadios = async () => {
      const data = await fetchRadios();
      console.log("Loaded radios:", data);
      setRadios(data);
    };

    loadRadios();
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <RadioGlobe radios={radios} />
    </div>
  );
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
