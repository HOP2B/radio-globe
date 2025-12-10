// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useState } from "react";

// export default function ApiTest() {
//   const [stations, setStations] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetch("https://de1.api.radio-browser.info/json/stations")
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response not OK");
//         return res.json();
//       })
//       .then((data) => {
//         setStations(data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, []);

//   if (loading) return <div>Loading…</div>;
//   if (error) return <div>Error: {error}</div>;

//   return (
//     <div>
//       <h2>First 5 Radio Stations from API:</h2>
//       <ul>
//         {stations.slice(0, 5).map((station, index) => (
//           <li key={index}>
//             {station.name} — <a href={station.url} target="_blank" rel="noreferrer">Play</a>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
