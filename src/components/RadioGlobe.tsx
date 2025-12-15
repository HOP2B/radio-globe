/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { TextureLoader, Vector3 } from "three";
import type { RadioStation } from "../api/radio";
import LikeMenu from "./LikeMenu";

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
  isUnavailable,
}: {
  position: [number, number, number];
  station: RadioStation;
  currentStation: RadioStation | null;
  onClick: () => void;
  isUnavailable: boolean;
}) {
  const { camera } = useThree();
  const [size, setSize] = useState(0.04);

  // Update size based on camera distance and selection
  useFrame(() => {
    if (camera) {
      const distance = camera.position.distanceTo({ x: 0, y: 0, z: 0 });
      // Smaller when zoomed in (closer to earth)
      // Larger when zoomed out (farther from earth)
      const baseSize = 0.04;
      const normalizedDistance = Math.max(0, Math.min(1, (distance - 6) / 10));
      let newSize = baseSize * (0.3 + 0.7 * normalizedDistance);

      // Make bigger and yellow when selected
      if (currentStation?.stationuuid === station.stationuuid) {
        newSize *= 2; // Double the size when selected
      }

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
            : isUnavailable
            ? "red"
            : "cyan"
        }
        emissive={
          currentStation?.stationuuid === station.stationuuid
            ? "gold"
            : isUnavailable
            ? "darkred"
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [unavailableStations, setUnavailableStations] = useState<Set<string>>(
    new Set()
  );
  const [showLikeMenu, setShowLikeMenu] = useState(false); // Hide menu by default
  const menuAnimation = "slide-in";
  const [isBalloonRiding, setIsBalloonRiding] = useState(false);
  const [_zoomProgress, setZoomProgress] = useState(0);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const radius = 5;

  // Handle audio setup when station changes
  useEffect(() => {
    if (audioRef && currentStation) {
      audioRef.src = currentStation.url;
      audioRef.volume = volume;
      if (isPlaying) {
        audioRef.play().catch((e) => {
          console.log("Auto-play prevented:", e);
          setIsPlaying(false);
        });
      }
    }
  }, [currentStation, audioRef]);

  // Handle play/pause state changes
  useEffect(() => {
    if (audioRef && currentStation) {
      if (isPlaying) {
        audioRef.play().catch((e) => {
          console.log("Play prevented:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.pause();
      }
    }
  }, [isPlaying, audioRef, currentStation]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef) {
      audioRef.volume = volume;
    }
  }, [volume, audioRef]);

  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Smooth zoom-out animation
  const ZoomAnimation = () => {
    useFrame(() => {
      if (isZoomingOut && cameraRef.current) {
        setZoomProgress((prev) => {
          const newProgress = prev + 0.01;
          if (newProgress >= 1) {
            setIsZoomingOut(false);
            setIsBalloonRiding(false);
            return 1;
          }
          return newProgress;
        });

        // Interpolate camera position
        const targetPos = [0, 0, 12];
        const currentPos = cameraRef.current.position;
        currentPos.lerp(new Vector3(...targetPos), 0.05);
        cameraRef.current.lookAt(0, 0, 0);
        if (controlsRef.current) {
          controlsRef.current.update();
        }
      }
    });
    return null;
  };

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
          backgroundColor: "black",
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
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "black" }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
        }}
      >
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
              isUnavailable={unavailableStations.has(station.stationuuid)}
              onClick={() => {
                if (unavailableStations.has(station.stationuuid)) {
                  // Show message for unavailable station
                  alert(`❌ ${station.name} is currently unavailable`);
                  return;
                }
                // Stop previous audio if playing
                if (audioRef && !audioRef.paused) {
                  audioRef.pause();
                }
                setAudioEnabled(true);
                setCurrentStation(station);
                setIsPlaying(true);
              }}
            />
          );
        })}

        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          enablePan={false}
          minDistance={radius + 1}
          maxDistance={radius + 20}
        />

        {isZoomingOut && <ZoomAnimation />}
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

      {/* Balloon Ride Button */}
      <button
        onClick={() => {
          const randomStation =
            radios[Math.floor(Math.random() * radios.length)];
          setCurrentStation(randomStation);
          setIsBalloonRiding(true);
          setZoomProgress(0);

          if (cameraRef.current && controlsRef.current) {
            // Calculate position for the station
            const pos = latLngToXYZ(
              randomStation.latitude!,
              randomStation.longitude!,
              radius + 0.5
            );

            // Move camera to station location
            controlsRef.current.reset();
            controlsRef.current.target.set(pos[0], pos[1], pos[2]);
            controlsRef.current.update();

            // Zoom in VERY close (move camera much closer)
            const camera = cameraRef.current;
            camera.position.set(pos[0], pos[1] + 1, pos[2] + 3);
            camera.lookAt(pos[0], pos[1], pos[2]);
            controlsRef.current.update();

            // Start smooth zoom-out after 3 seconds
            setTimeout(() => {
              setIsZoomingOut(true);
            }, 3000);
          }
        }}
        style={{
          position: "absolute",
          top: 80,
          right: 20,
          color: "white",
          background: "rgba(0,0,0,0.8)",
          padding: "10px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.2)",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.9)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.8)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        🎈 Balloon Ride
      </button>

      {/* Go Home Button */}
      <button
        onClick={() => {
          if (controlsRef.current) {
            // Reset camera to initial position
            controlsRef.current.reset();
          }
        }}
        style={{
          position: "absolute",
          top: 140,
          right: 20,
          color: "white",
          background: "rgba(0,0,0,0.8)",
          padding: "10px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.2)",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.9)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.8)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        🏠 Go Home
      </button>

      {/* Like Menu Button - Toggle button */}
      <button
        onClick={() => setShowLikeMenu(!showLikeMenu)}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          color: "white",
          background: "rgba(0,0,0,0.8)",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: showLikeMenu ? "0 0 20px rgba(30, 185, 84, 0.3)" : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.9)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.8)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {showLikeMenu ? "❤️ Close Menu" : "🔍 Open Search"}
      </button>

      {/* Spotify-like player panel - hidden during balloon ride */}
      {currentStation && !isBalloonRiding && (
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

          {/* Custom Audio Controls */}
          <div
            style={{
              marginTop: "10px",
              paddingTop: "15px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Hidden audio element */}
            <audio
              ref={(audio) => setAudioRef(audio)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              onError={(e) => {
                console.error("Audio error:", e);
                setIsPlaying(false);
                setIsLoading(false);
                if (currentStation) {
                  setUnavailableStations(
                    (prev) => new Set([...prev, currentStation.stationuuid])
                  );
                }
              }}
              style={{ display: "none" }}
            />

            {/* Progress Bar */}
            <div style={{ marginBottom: "15px" }}>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setCurrentTime(newTime);
                  if (audioRef) {
                    audioRef.currentTime = newTime;
                  }
                }}
                style={{
                  width: "100%",
                  height: "4px",
                  borderRadius: "2px",
                  background: "rgba(255,255,255,0.2)",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "5px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "15px",
              }}
            >
              {/* Skip Backward */}
              <button
                onClick={() => {
                  if (audioRef) {
                    audioRef.currentTime = Math.max(
                      0,
                      audioRef.currentTime - 15
                    );
                  }
                }}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                ⏪
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={() => {
                  if (!audioEnabled) {
                    setAudioEnabled(true);
                  }
                  if (audioRef) {
                    if (isPlaying) {
                      audioRef.pause();
                      setIsPlaying(false);
                    } else {
                      audioRef
                        .play()
                        .catch((e) => console.log("Play prevented:", e));
                      setIsPlaying(true);
                    }
                  }
                }}
                disabled={isLoading}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: isLoading ? "rgba(255,255,255,0.2)" : "#1DB954",
                  border: "none",
                  color: "white",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  transition: "all 0.2s ease",
                  boxShadow: isLoading
                    ? "none"
                    : "0 4px 12px rgba(29, 185, 84, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(29, 185, 84, 0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(29, 185, 84, 0.4)";
                  }
                }}
              >
                {isLoading ? "⏳" : isPlaying ? "⏸️" : "▶️"}
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => {
                  if (audioRef) {
                    audioRef.currentTime = Math.min(
                      duration,
                      audioRef.currentTime + 15
                    );
                  }
                }}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                ⏩
              </button>
            </div>

            {/* Volume Control */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}
              >
                {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  if (audioRef) {
                    audioRef.volume = newVolume;
                  }
                }}
                style={{
                  flex: 1,
                  height: "4px",
                  borderRadius: "2px",
                  background: "rgba(255,255,255,0.2)",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Enjoy Project Text */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          color: "white",
          background: "rgba(0,0,0,0.8)",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "12px",
          fontWeight: "400",
          backdropFilter: "blur(10px)",
          textAlign: "center",
        }}
      >
        {currentStation
          ? `🎵 Listening to ${currentStation.country} Radio`
          : "Enjoy our project! 🌍"}
      </div>

      {/* Like Menu Overlay */}
      {showLikeMenu && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowLikeMenu(false)}
          />
          <LikeMenu
            radios={radios}
            onClose={() => setShowLikeMenu(false)}
            initialAnimation={menuAnimation}
          />
        </>
      )}
    </div>
  );
}
