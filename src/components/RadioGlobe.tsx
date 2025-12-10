/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { TextureLoader, Camera } from "three";
import type { RadioStation } from "../api/radio";

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

// Component for radio dots with dynamic sizing
function RadioDot({
  position,
  station,
  currentStation,
  onClick,
}: {
  position: [number, number, number];
  station: RadioStation;
  currentStation: RadioStation | null;
  onClick: () => void;
}) {
  const { camera } = useThree();
  const [size, setSize] = useState(0.04);

  // Update size based on camera distance
  useFrame(() => {
    if (camera) {
      const distance = camera.position.distanceTo({ x: 0, y: 0, z: 0 });
      // Smaller when zoomed in (closer to earth)
      // Larger when zoomed out (farther from earth)
      const baseSize = 0.04;
      const minSize = 0.01;
      const maxSize = 0.06;
      const normalizedDistance = Math.max(0, Math.min(1, (distance - 6) / 10));
      const newSize = baseSize * (0.3 + 0.7 * normalizedDistance);
      setSize(newSize);
    }
  });

  return (
    <mesh position={position} onClick={onClick}>
      <sphereGeometry args={[size, 8, 8]} />
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
}

export default function RadioGlobe({ radios }: RadioGlobeProps) {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(
    null
  );
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
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

        {/* Radio dots - size scales with zoom */}
        {radios.map((station) => {
          const pos = latLngToXYZ(
            station.latitude!,
            station.longitude!,
            radius + 0.1
          );

          return (
            <RadioDot
              key={station.stationuuid}
              position={pos}
              station={station}
              currentStation={currentStation}
              onClick={() => {
                // Stop previous audio if playing
                if (audioRef && !audioRef.paused) {
                  audioRef.pause();
                }
                setCurrentStation(station);
              }}
            />
          );
        })}

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={radius + 1}
          maxDistance={radius + 20}
        />
      </Canvas>

      {/* Radio count display */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          background: "rgba(0,0,0,0.8)",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
        }}
      >
        📻 {radios.length} Stations
      </div>

      {/* Spotify-like player panel */}
      {currentStation && (
        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 20,
            width: 300,
            background: "rgba(0,0,0,0.9)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Radio name - big green text like Spotify */}
          <div style={{ marginBottom: "10px" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#1DB954",
                margin: "0",
                lineHeight: "1.2",
                letterSpacing: "-0.02em",
              }}
            >
              {currentStation.name}
            </h1>
          </div>

          {/* City and country - small white text */}
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.8)",
                margin: "0",
                fontWeight: "400",
              }}
            >
              {currentStation.city ? `${currentStation.city}, ` : ""}
              {currentStation.country}
            </p>
          </div>

          {/* Audio player controls */}
          <div
            style={{
              marginTop: "10px",
              paddingTop: "15px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <audio
              ref={(audio) => {
                if (audio && currentStation) {
                  audio.src = currentStation.url;
                  audio
                    .play()
                    .catch((e) => console.log("Auto-play prevented:", e));
                }
              }}
              controls
              onError={(e) => console.error("Audio error:", e)}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
