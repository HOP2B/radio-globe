/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { TextureLoader } from "three";
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
              onClick={() => {
                // Stop previous audio if playing
                if (audioRef && !audioRef.paused) {
                  audioRef.pause();
                }
                setCurrentStation(station);
              }}
            >
              <sphereGeometry args={[0.04, 8, 8]} />
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

        <OrbitControls enableZoom={true} enablePan={false} />
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

      {/* Left panel for selected station - Radio Garden style */}
      {currentStation && (
        <div
          style={{
            position: "absolute",
            left: 20,
            top: "50%",
            transform: "translateY(-50%)",
            width: 300,
            background: "rgba(0,0,0,0.85)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>
              {currentStation.name}
            </h2>
            <button
              onClick={() => setCurrentStation(null)}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "4px" }}>
              Country
            </p>
            <p style={{ fontSize: "16px", fontWeight: "500" }}>
              {currentStation.country}
            </p>
          </div>

          {currentStation.city && (
            <div style={{ marginBottom: "15px" }}>
              <p
                style={{ fontSize: "14px", color: "#aaa", marginBottom: "4px" }}
              >
                City
              </p>
              <p style={{ fontSize: "16px", fontWeight: "500" }}>
                {currentStation.city}
              </p>
            </div>
          )}

          <div style={{ marginBottom: "15px" }}>
            <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "4px" }}>
              Language
            </p>
            <p style={{ fontSize: "16px", fontWeight: "500" }}>
              {currentStation.language || "N/A"}
            </p>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "4px" }}>
              Bitrate
            </p>
            <p style={{ fontSize: "16px", fontWeight: "500" }}>
              {currentStation.bitrate || "N/A"} kbps
            </p>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "4px" }}>
              Codec
            </p>
            <p style={{ fontSize: "16px", fontWeight: "500" }}>
              {currentStation.codec || "N/A"}
            </p>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "4px" }}>
              Votes
            </p>
            <p style={{ fontSize: "16px", fontWeight: "500" }}>
              {currentStation.votes || 0}
            </p>
          </div>

          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
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
