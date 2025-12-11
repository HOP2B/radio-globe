/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { TextureLoader /*, Camera */ } from "three";
import type { RadioStation } from "../api/radio";

// Props type
type RadioGlobeProps = {
  radios: RadioStation[];
  darkMode?: boolean;
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
      // const _minSize = 0.01;
      // const _maxSize = 0.06;
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

export default function RadioGlobe({
  radios,
  darkMode = true,
}: RadioGlobeProps) {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(
    null
  );
  const [audioRef] = useState<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRefObj = useRef<HTMLAudioElement | null>(null);
  const radius = 5;

  // Update progress bar and playing state
  useEffect(() => {
    const audio = audioRefObj.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const updatePlayingState = () => {
      setIsPlaying(!audio.paused);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("play", updatePlayingState);
    audio.addEventListener("pause", updatePlayingState);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("play", updatePlayingState);
      audio.removeEventListener("pause", updatePlayingState);
    };
  }, []);

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
          background: darkMode ? "black" : "#f5f5f5",
          color: darkMode ? "white" : "#333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white dark:border-white mb-4"></div>
        <h1 style={{ color: darkMode ? "white" : "#333" }}>
          Loading radio stations...
        </h1>
        <p style={{ color: darkMode ? "#9ca3af" : "#666", marginTop: "8px" }}>
          Fetching from radio-browser.info
        </p>
        {/* Animated radio wave loading indicator */}
        <div className="mt-8 flex space-x-2">
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "100ms" }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-300 rounded-full animate-bounce"
            style={{ animationDelay: "200ms" }}
          ></div>
        </div>
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

          // eslint-disable-next-line no-console
          console.log("station pos:", station.name, station.stationuuid, pos);

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
                setErrorMessage(null); // Clear any previous error
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
          color: darkMode ? "white" : "#333",
          background: darkMode ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)",
          padding: "12px 16px",
          borderRadius: "8px",
          border: darkMode
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(0,0,0,0.1)",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          boxShadow: darkMode
            ? "0 4px 12px rgba(0,0,0,0.3)"
            : "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        📻 {radios.length} Stations
      </div>

      {/* Enhanced Spotify-like player panel */}
      {currentStation && (
        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 20,
            width: 320,
            background: darkMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
            borderRadius: "12px",
            padding: "20px",
            color: darkMode ? "white" : "#333",
            backdropFilter: "blur(10px)",
            border: darkMode
              ? "1px solid rgba(255,255,255,0.15)"
              : "1px solid rgba(0,0,0,0.1)",
            boxShadow: darkMode
              ? "0 8px 32px rgba(0,0,0,0.5)"
              : "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          {/* Radio name - big green text like Spotify */}
          <div style={{ marginBottom: "8px" }}>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#1DB954",
                margin: "0",
                lineHeight: "1.2",
                letterSpacing: "-0.02em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📻</span>
              {currentStation.name}
            </h1>
          </div>

          {/* City and country - small text */}
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                fontSize: "13px",
                color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                margin: "0",
                fontWeight: "400",
              }}
            >
              {currentStation.city ? `${currentStation.city}, ` : ""}
              {currentStation.country}
            </p>
          </div>

          {/* Error message display */}
          {errorMessage && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px 12px",
                background: darkMode
                  ? "rgba(255, 0, 0, 0.2)"
                  : "rgba(255, 0, 0, 0.1)",
                borderRadius: "6px",
                color: "#ff6b6b",
                fontSize: "13px",
                textAlign: "center",
                border: `1px solid ${
                  darkMode
                    ? "rgba(255, 107, 107, 0.3)"
                    : "rgba(255, 107, 107, 0.2)"
                }`,
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Enhanced audio player with custom controls */}
          <div
            style={{
              marginTop: errorMessage ? "0" : "12px",
              paddingTop: "16px",
              borderTop: darkMode
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <audio
              ref={(audio) => {
                if (audio && currentStation) {
                  audio.src = currentStation.url;
                  audioRefObj.current = audio;
                  audio
                    .play()
                    .then(() => {
                      console.log("Radio started successfully");
                      setErrorMessage(null); // Clear any previous error
                    })
                    .catch((e) => {
                      console.log("Auto-play prevented or error:", e);
                      // Don't show error in catch - only show on actual error event
                    });
                }
              }}
              id="radio-audio"
              onError={(e) => {
                console.error("Audio error:", e);
                setErrorMessage(
                  "This radio station is not available at the moment"
                );
              }}
              onPlay={() => {
                setErrorMessage(null);
              }}
              style={{ display: "none" }}
            />

            {/* Custom player controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => {
                  const audio = document.getElementById(
                    "radio-audio"
                  ) as HTMLAudioElement;
                  if (audio) {
                    if (audio.paused) {
                      audio
                        .play()
                        .then(() => {
                          setIsPlaying(true);
                        })
                        .catch((e) => console.log("Playback prevented:", e));
                    } else {
                      audio.pause();
                      setIsPlaying(false);
                    }
                  }
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: darkMode
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.1)",
                  border: "none",
                  color: "#1DB954",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
                className="hover:bg-white/30 dark:hover:bg-white/20"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    onClick={() => {
                      const audio = document.getElementById(
                        "radio-audio"
                      ) as HTMLAudioElement;
                      if (audio)
                        audio.currentTime = Math.max(0, audio.currentTime - 10);
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: darkMode
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                      border: "none",
                      color: darkMode ? "white" : "#666",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                    className="hover:bg-white/20 dark:hover:bg-white/10"
                    title="Skip back 10 seconds"
                  >
                    ⏪
                  </button>

                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: darkMode
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.1)",
                      borderRadius: "2px",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const audio = document.getElementById(
                        "radio-audio"
                      ) as HTMLAudioElement;
                      if (audio && audio.duration) {
                        const clickPosition = e.clientX - rect.left;
                        const percentage = clickPosition / rect.width;
                        audio.currentTime = percentage * audio.duration;
                      }
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "#1DB954",
                        borderRadius: "2px",
                        transition: "width 0.1s",
                      }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      const audio = document.getElementById(
                        "radio-audio"
                      ) as HTMLAudioElement;
                      if (audio)
                        audio.currentTime = Math.min(
                          audio.duration || 100,
                          audio.currentTime + 10
                        );
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: darkMode
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                      border: "none",
                      color: darkMode ? "white" : "#666",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                    className="hover:bg-white/20 dark:hover:bg-white/10"
                    title="Skip forward 10 seconds"
                  >
                    ⏩
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  const audio = document.getElementById(
                    "radio-audio"
                  ) as HTMLAudioElement;
                  if (audio) {
                    if (audio.muted) {
                      audio.muted = false;
                    } else {
                      audio.muted = true;
                    }
                  }
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: darkMode
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                  border: "none",
                  color: darkMode ? "white" : "#666",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  fontSize: "18px",
                }}
                className="hover:bg-white/20 dark:hover:bg-white/10"
                title="Toggle mute"
              >
                🔇
              </button>
            </div>

            {/* Volume slider */}
            <div style={{ marginTop: "12px", padding: "0 4px" }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                defaultValue="0.7"
                onChange={(e) => {
                  const audio = document.getElementById(
                    "radio-audio"
                  ) as HTMLAudioElement;
                  if (audio) audio.volume = parseFloat(e.target.value);
                }}
                style={{
                  width: "100%",
                  height: "4px",
                  borderRadius: "2px",
                  background: darkMode
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.1)",
                  outline: "none",
                  WebkitAppearance: "none",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
