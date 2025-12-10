import { useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { TextureLoader } from "three";
import type { RadioStation } from "../api/radio";

// RadioStation type with required coordinates

// Props type
type RadioGlobeProps = {
  radios: RadioStation[];
};

// Convert lat/lng to 3D XYZ position on sphere
function latLngToXYZ(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z] as [number, number, number];
}

export default function RadioGlobe({ radios }: RadioGlobeProps) {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(
    null
  );
  const radius = 5;

  // Load Earth texture
  const earthTexture = useLoader(
    TextureLoader,
    "https://upload.wikimedia.org/wikipedia/commons/0/04/Solarsystemscope_texture_8k_earth_daymap.jpg"
  );

  // If no radios loaded yet, show loading
  if (radios.length === 0) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "black",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <h1>Loading radio stations...</h1>
        <p className="text-gray-400 mt-2">Fetching from radio-browser.info</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight intensity={0.5} position={[10, 10, 10]} />

        {/* Earth sphere */}
        <Sphere args={[radius, 64, 64]}>
          <meshStandardMaterial map={earthTexture} />
        </Sphere>

        {/* Radio dots */}
        {radios.map((station) => {
          const pos = latLngToXYZ(
            station.latitude!,
            station.longitude!,
            radius + 0.1
          );

          return (
            <mesh
              key={station.stationuuid}
              position={pos}
              onClick={() => setCurrentStation(station)}
            >
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial
                color={
                  currentStation?.stationuuid === station.stationuuid
                    ? "yellow"
                    : "cyan"
                }
                emissive={
                  currentStation?.stationuuid === station.stationuuid
                    ? "gold"
                    : "darkcyan"
                }
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}

        <OrbitControls enableZoom />
      </Canvas>

      {/* Radio count display */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          background: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        Radio Stations: {radios.length}
      </div>

      {/* Audio player */}
      {currentStation && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            color: "white",
            background: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            maxWidth: "300px",
          }}
        >
          <h3>Selected: {currentStation.name}</h3>
          <p>
            {currentStation.country} - {currentStation.city}
          </p>
          <audio
            src={currentStation.url}
            controls
            onError={(e) => console.error("Audio error:", e)}
            style={{ width: "100%" }}
          />
        </div>
      )}
    </div>
  );
}
