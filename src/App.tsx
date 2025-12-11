/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { fetchRadios } from "./api/radio";
import type { RadioStation } from "./api/radio";
import RadioGlobe from "./components/RadioGlobe";
// import ApiTest from "./components/ApiTest";

export default function App() {
  const [
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ radios,
    setRadios,
  ] = useState<RadioStation[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);

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

  // Apply dark/light mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="h-screen w-screen bg-black dark:bg-gray-900 flex items-center justify-center relative">
      <RadioGlobe radios={radios} darkMode={darkMode} />
      {/* Dark/Light mode toggle button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300"
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>
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
