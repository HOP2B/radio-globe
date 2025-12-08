import { useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { TextureLoader } from "three";
import type { RadioStation } from "../api/radio";

// RadioStation type with optional coordinates

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

// Generate random position on the sphere for stations without lat/lng
function randomSpherePosition(radius: number) {
  const phi = Math.acos(2 * Math.random() - 1);
  const theta = 2 * Math.PI * Math.random();
  const x = (radius + 0.2) * Math.sin(phi) * Math.cos(theta); // offset outside
  const y = (radius + 0.2) * Math.cos(phi);
  const z = (radius + 0.2) * Math.sin(phi) * Math.sin(theta);
  return [x, y, z] as [number, number, number];
}

export default function RadioGlobe({ radios }: RadioGlobeProps) {
  console.log("RadioGlobe received", radios.length, "radios");
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(
    null
  );
  const radius = 5;

  // Load Earth texture
  const earthTexture = useLoader(
    TextureLoader,
    "https://upload.wikimedia.org/wikipedia/commons/0/04/Solarsystemscope_texture_8k_earth_daymap.jpg"
  );

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
          const pos =
            station.latitude !== undefined && station.longitude !== undefined
              ? latLngToXYZ(station.latitude, station.longitude, radius + 0.2)
              : randomSpherePosition(radius);

          return (
            <mesh
              key={station.stationuuid}
              position={pos}
              onClick={() => setCurrentStation(station)}
            >
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial
                color={
                  currentStation?.stationuuid === station.stationuuid
                    ? "green"
                    : "red"
                }
                emissive={
                  currentStation?.stationuuid === station.stationuuid
                    ? "darkgreen"
                    : "darkred"
                }
                emissiveIntensity={0.3}
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
          style={{ position: "absolute", bottom: 20, left: 20, color: "white" }}
        >
          <h3>Playing: {currentStation.name}</h3>
          <audio src={currentStation.url} autoPlay controls />
        </div>
      )}
    </div>
  );
}
