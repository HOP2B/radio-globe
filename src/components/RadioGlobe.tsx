/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Stars } from "@react-three/drei";
import { TextureLoader, Vector3 } from "three";
import type { RadioStation } from "../api/radio";
import LikeMenu from "./LikeMenu";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaVolumeMute,
  FaVolumeDown,
  FaVolumeUp,
  FaSearch,
  FaHeart,
  FaGlobe,
  FaHome,
  FaCloud,
  FaBroadcastTower,
} from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";

type RadioGlobeProps = { radios: RadioStation[] };

// Convert lat/lng to 3D XYZ position on sphere
function latLngToXYZ(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z] as [number, number, number];
}

// Radio dot component
function RadioDot({
  position,
  station,
  currentStation,
  onClick,
  isUnavailable,
  onPointerOver,
  onPointerOut,
}: {
  position: [number, number, number];
  station: RadioStation;
  currentStation: RadioStation | null;
  onClick: () => void;
  isUnavailable: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}) {
  const { camera } = useThree();
  const [size, setSize] = useState(0.04);

  useFrame(() => {
    if (camera) {
      const distance = camera.position.distanceTo({ x: 0, y: 0, z: 0 });
      const baseSize = 0.04;
      const normalizedDistance = Math.max(0, Math.min(1, (distance - 6) / 10));
      let newSize = baseSize * (0.3 + 0.7 * normalizedDistance);
      if (currentStation?.stationuuid === station.stationuuid) newSize *= 2;
      setSize(newSize);
    }
  });

  return (
    <mesh
      position={position}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
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
  const [showLikeMenu, setShowLikeMenu] = useState(false);
  const [isBalloonRiding, setIsBalloonRiding] = useState(false);
  const [_zoomProgress, setZoomProgress] = useState(0);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
<<<<<<< HEAD
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    station: RadioStation;
    message: string;
  } | null>(null);
  const [hoveredStation, setHoveredStation] = useState<RadioStation | null>(
    null
  );
  const [filterType, setFilterType] = useState<"all" | "country" | "language">(
    "all"
  );
  const [filterValue, setFilterValue] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
=======
  const [isZoomingIn, setIsZoomingIn] = useState(false);

  // Hover text states
  const [showSearchText, setShowSearchText] = useState(false);
  const [showBalloonText, setShowBalloonText] = useState(false);
  const [showHomeText, setShowHomeText] = useState(false);

>>>>>>> 16-bilguune
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const radius = 5;

<<<<<<< HEAD
  // Handle audio setup when station changes
=======
  const autoZoomToStation = useCallback(
    (station: RadioStation) => {
      if (cameraRef.current && controlsRef.current && !isBalloonRiding) {
        const pos = latLngToXYZ(
          station.latitude!,
          station.longitude!,
          radius + 0.8
        );

        setIsZoomingIn(true);
        controlsRef.current.reset();
        controlsRef.current.target.set(pos[0], pos[1], pos[2]);
        controlsRef.current.update();

        const camera = cameraRef.current;
        const targetPosition = {
          x: pos[0] * 0.3,
          y: pos[1] * 0.3 + 1,
          z: pos[2] * 0.3 + 2,
        };

        const animateZoom = () => {
          const currentPos = camera.position;
          const targetVector = new Vector3(
            targetPosition.x,
            targetPosition.y,
            targetPosition.z
          );
          currentPos.lerp(targetVector, 0.05);
          camera.lookAt(pos[0], pos[1], pos[2]);
          controlsRef.current?.update();
          if (currentPos.distanceTo(targetVector) > 0.1)
            requestAnimationFrame(animateZoom);
        };
        animateZoom();
      }
    },
    [isBalloonRiding, isZoomingIn]
  );

>>>>>>> 16-bilguune
  useEffect(() => {
    if (audioRef && currentStation) {
      audioRef.src = currentStation.url;
      audioRef.volume = volume;
      if (isPlaying) audioRef.play().catch(() => setIsPlaying(false));
    }
  }, [currentStation, audioRef, volume, isPlaying]);

  useEffect(() => {
    if (audioRef && currentStation) {
<<<<<<< HEAD
      if (isPlaying) {
        audioRef.play().catch((e) => {
          console.log("Play prevented:", e);
          // Don't set to false, keep trying or let user click play button
        });
      } else {
        audioRef.pause();
      }
    }
  }, [isPlaying, audioRef, currentStation]);

  // Handle volume changes
=======
      if (isPlaying) audioRef.play().catch(() => setIsPlaying(false));
      else audioRef.pause();
    }
  }, [isPlaying, audioRef, currentStation]);

  useEffect(() => {
    if (isPlaying && currentStation && !isBalloonRiding)
      autoZoomToStation(currentStation);
  }, [isPlaying, currentStation, isBalloonRiding, autoZoomToStation]);

>>>>>>> 16-bilguune
  useEffect(() => {
    if (audioRef) audioRef.volume = volume;
  }, [volume, audioRef]);

<<<<<<< HEAD
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.code) {
        case "Space":
          event.preventDefault();
          if (!audioEnabled) {
            setAudioEnabled(true);
          }
          if (audioRef) {
            if (isPlaying) {
              audioRef.pause();
              setIsPlaying(false);
            } else {
              audioRef.play().catch((e) => console.log("Play prevented:", e));
              setIsPlaying(true);
            }
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (audioRef) {
            audioRef.currentTime = Math.max(0, audioRef.currentTime - 15);
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (audioRef) {
            audioRef.currentTime = Math.min(
              duration,
              audioRef.currentTime + 15
            );
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          event.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case "KeyM":
          event.preventDefault();
          setVolume(volume === 0 ? 0.7 : 0);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [audioEnabled, audioRef, isPlaying, volume, duration]);

  // Format time in MM:SS format
=======
>>>>>>> 16-bilguune
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

<<<<<<< HEAD
  // AI recommendation using Gemini
  const getAIRecommendation = async (
    currentStation: RadioStation,
    allStations: RadioStation[]
  ) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not found");
    }

    const prompt = `Based on the radio station "${currentStation.name}" from ${
      currentStation.country
    }, recommend ONE similar radio station from this list: ${allStations
      .slice(0, 50)
      .map((s) => `${s.name} (${s.country})`)
      .join(", ")}. Respond with just the station name, nothing else.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0]
      ) {
        throw new Error("Invalid API response format");
      }

      const recommendedName = data.candidates[0].content.parts[0].text.trim();

      // Find the station by name (more flexible matching)
      const recommendedStation = allStations.find(
        (s) =>
          s.name.toLowerCase().includes(recommendedName.toLowerCase()) ||
          recommendedName.toLowerCase().includes(s.name.toLowerCase()) ||
          s.name
            .toLowerCase()
            .split(" ")
            .some((word: string) =>
              recommendedName.toLowerCase().includes(word)
            ) ||
          recommendedName
            .toLowerCase()
            .split(" ")
            .some((word: string) => s.name.toLowerCase().includes(word))
      );
      return (
        recommendedStation ||
        allStations[Math.floor(Math.random() * allStations.length)]
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("AI request timed out");
      }
      throw error;
    }
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
          // Reset controls target to earth center
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
    });
    return null;
  };

  // Load Earth texture
=======
>>>>>>> 16-bilguune
  const earthTexture = useLoader(
    TextureLoader,
    "https://upload.wikimedia.org/wikipedia/commons/0/04/Solarsystemscope_texture_8k_earth_daymap.jpg"
  );

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

        <Sphere args={[radius, 64, 64]}>
          <meshStandardMaterial map={earthTexture} />
        </Sphere>
<<<<<<< HEAD
        {/* Radio dots - size scales with zoom */}
        {radios
          .filter((station) => {
            if (filterType === "all" || !filterValue) return true;
            if (filterType === "country")
              return station.country
                .toLowerCase()
                .includes(filterValue.toLowerCase());
            if (filterType === "language")
              return station.language
                ?.toLowerCase()
                .includes(filterValue.toLowerCase());
            return true;
          })
          .map((station) => {
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
                onClick={async () => {
                  if (unavailableStations.has(station.stationuuid)) {
                    // Show message for unavailable station
                    alert(`${station.name} is currently unavailable`);
                    return;
                  }
                  // Stop previous audio if playing
                  if (audioRef && !audioRef.paused) {
                    audioRef.pause();
                  }
                  setAudioEnabled(true);
                  setCurrentStation(station);
                  setIsPlaying(true);
                  // Auto-play immediately on click with better error handling
                  if (audioRef) {
                    audioRef.src = station.url;
                    audioRef.volume = volume;
                    try {
                      await audioRef.play();
                      console.log("Auto-play successful for:", station.name);
                    } catch (e) {
                      console.log("Auto-play failed:", e);
                      // Try again after a short delay
                      setTimeout(() => {
                        if (audioRef && audioRef.src === station.url) {
                          audioRef
                            .play()
                            .catch((e2) =>
                              console.log("Retry auto-play failed:", e2)
                            );
                        }
                      }, 100);
                    }
                  }
                }}
                onPointerOver={() => setHoveredStation(station)}
                onPointerOut={() => setHoveredStation(null)}
              />
            );
          })}
=======
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
                if (unavailableStations.has(station.stationuuid))
                  return alert(`${station.name} is unavailable`);
                if (audioRef && !audioRef.paused) audioRef.pause();
                setAudioEnabled(true);
                setCurrentStation(station);
                setIsPlaying(true);
              }}
            />
          );
        })}
>>>>>>> 16-bilguune

        <OrbitControls
          ref={controlsRef}
          enableZoom
          enablePan={false}
<<<<<<< HEAD
          minDistance={radius + 3}
          maxDistance={radius + 20}
        />

        {/* Starfield background */}
        <Stars
          radius={300}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
        />

        {isZoomingOut && <ZoomAnimation />}
=======
          minDistance={radius + 1}
          maxDistance={radius + 10}
        />
>>>>>>> 16-bilguune
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
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <FaBroadcastTower style={{ color: "#1DB954" }} />
        {radios.length} Stations
      </div>

      {/* Enjoy Project Text - Top Right */}
      <div
        style={{
          position: "absolute",
          top: 30,
          right: 30,
          color: "white",
<<<<<<< HEAD
          background: "rgba(0,0,0,0.8)",
          padding: "10px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.2)",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "8px",
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
        <FaCloud style={{ color: "#87CEEB" }} />
        Balloon Ride
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
          display: "flex",
          alignItems: "center",
          gap: "8px",
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
        <FaHome style={{ color: "#1DB954" }} />
        Go Home
      </button>

      {/* Filter Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        style={{
          position: "absolute",
          top: 240,
          right: 20,
          color: "white",
          background: showFilters
            ? "rgba(30, 185, 84, 0.8)"
            : "rgba(0,0,0,0.8)",
          padding: "10px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.2)",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = showFilters
            ? "rgba(30, 185, 84, 0.9)"
            : "rgba(0,0,0,0.9)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = showFilters
            ? "rgba(30, 185, 84, 0.8)"
            : "rgba(0,0,0,0.8)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <FaSearch style={{ color: showFilters ? "#fff" : "#1DB954" }} />
        {filterType === "all"
          ? "Filter"
          : `${filterType}: ${filterValue || "All"}`}
      </button>

      {/* AI Suggest Button */}
      <button
        onClick={async () => {
          if (!currentStation) {
            setAiRecommendation({
              station: null as any,
              message:
                "Please select a station first to get AI recommendations",
            });
            setTimeout(() => setAiRecommendation(null), 3000);
            return;
          }
          setIsAISuggesting(true);
          try {
            const suggestedStation = await getAIRecommendation(
              currentStation,
              radios
            );
            // Auto-play the suggested station
            if (audioRef && !audioRef.paused) {
              audioRef.pause();
            }
            setAudioEnabled(true);
            setCurrentStation(suggestedStation);
            setIsPlaying(true);
            if (audioRef) {
              audioRef.src = suggestedStation.url;
              audioRef.volume = volume;
              audioRef.play().catch((e) => console.log("Auto-play failed:", e));
            }
            setAiRecommendation({
              station: suggestedStation,
              message: `🤖 AI suggests: ${suggestedStation.name} from ${suggestedStation.country}`,
            });
            setTimeout(() => setAiRecommendation(null), 5000);
          } catch (error) {
            console.error("AI recommendation failed:", error);
            // Fallback to same country
            const sameCountryStations = radios.filter(
              (station) =>
                station.country === currentStation.country &&
                station.stationuuid !== currentStation.stationuuid
            );
            if (sameCountryStations.length > 0) {
              const suggestedStation =
                sameCountryStations[
                  Math.floor(Math.random() * sameCountryStations.length)
                ];
              if (audioRef && !audioRef.paused) {
                audioRef.pause();
              }
              setAudioEnabled(true);
              setCurrentStation(suggestedStation);
              setIsPlaying(true);
              if (audioRef) {
                audioRef.src = suggestedStation.url;
                audioRef.volume = volume;
                audioRef
                  .play()
                  .catch((e) => console.log("Auto-play failed:", e));
              }
              setAiRecommendation({
                station: suggestedStation,
                message: `AI suggests: ${suggestedStation.name} from ${suggestedStation.country}`,
              });
              setTimeout(() => setAiRecommendation(null), 5000);
            } else {
              setAiRecommendation({
                station: null as any,
                message: "No recommendations available",
              });
              setTimeout(() => setAiRecommendation(null), 3000);
            }
          } finally {
            setIsAISuggesting(false);
          }
        }}
        style={{
          position: "absolute",
          top: 190,
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
          display: "flex",
          alignItems: "center",
          gap: "8px",
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
        {isAISuggesting ? "🤖 Thinking..." : "🤖 AI Text Suggest"}
      </button>

      {/* Help Button */}
      <button
        onClick={() => setShowShortcuts(!showShortcuts)}
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          color: "white",
          background: showShortcuts
            ? "rgba(30, 185, 84, 0.8)"
            : "rgba(0,0,0,0.8)",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.2)",
          fontSize: "12px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = showShortcuts
            ? "rgba(30, 185, 84, 0.9)"
            : "rgba(0,0,0,0.9)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = showShortcuts
            ? "rgba(30, 185, 84, 0.8)"
            : "rgba(0,0,0,0.8)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        ❓ Help
      </button>

      {/* Keyboard Shortcuts Panel */}
      {showShortcuts && (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            left: 20,
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 50,
            minWidth: "280px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: "600" }}>
              ⌨️ Keyboard Shortcuts
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "18px",
                padding: "4px",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            <div style={{ marginBottom: "8px" }}>
              <strong>Spacebar:</strong> Play/pause current station
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>← → Arrows:</strong> Skip backward/forward 15 seconds
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>↑ ↓ Arrows:</strong> Increase/decrease volume
            </div>
            <div>
              <strong>M key:</strong> Mute/unmute
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div
          style={{
            position: "absolute",
            top: 290,
            right: 20,
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 50,
            minWidth: "250px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
            }}
          >
            🔍 Filter Stations
          </div>

          {/* Filter Type */}
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                fontSize: "14px",
                marginBottom: "4px",
                display: "block",
              }}
            >
              Filter by:
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as "all" | "country" | "language");
                setFilterValue("");
              }}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                fontSize: "14px",
              }}
            >
              <option value="all">All Stations</option>
              <option value="country">Country</option>
              <option value="language">Language</option>
            </select>
          </div>

          {/* Filter Value */}
          {filterType !== "all" && (
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  fontSize: "14px",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                {filterType === "country" ? "Country name:" : "Language:"}
              </label>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder={
                  filterType === "country"
                    ? "e.g. United States"
                    : "e.g. English"
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "14px",
                }}
              />
            </div>
          )}

          {/* Clear Filter */}
          <button
            onClick={() => {
              setFilterType("all");
              setFilterValue("");
            }}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "none",
              background: "#1DB954",
              color: "white",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#17a34a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1DB954";
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Like Menu Button - Toggle button */}
      <button
        onClick={() => setShowLikeMenu(!showLikeMenu)}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          color: "white",
          background: "rgba(0,0,0,0.8)",
=======
          background: "rgba(0,0,0,0.9)",
>>>>>>> 16-bilguune
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {currentStation ? (
          <>
            <HiSpeakerWave style={{ color: "#1DB954" }} />
            Listening to {currentStation.country} Radio
          </>
        ) : (
          <>
            <FaGlobe style={{ color: "#1DB954" }} />
            Enjoy our project!
          </>
        )}
      </div>

      {/* Bottom Right Buttons */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowLikeMenu(!showLikeMenu)}
            onMouseEnter={() => setShowSearchText(true)}
            onMouseLeave={() => setShowSearchText(false)}
            style={{
              width: "55px",
              height: "55px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.9)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {showLikeMenu ? <FaHeart size={32} /> : <FaSearch size={32} />}
          </button>
          {showSearchText && (
            <div
              style={{
                position: "absolute",
                right: "110%",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.8)",
                color: "white",
                padding: "8px 14px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              Search
            </div>
          )}
        </div>

        {/* Balloon */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              const randomStation =
                radios[Math.floor(Math.random() * radios.length)];
              setCurrentStation(randomStation);
              setIsBalloonRiding(true);
              setZoomProgress(0);

              if (cameraRef.current && controlsRef.current) {
                const pos = latLngToXYZ(
                  randomStation.latitude!,
                  randomStation.longitude!,
                  radius + 0.5
                );
                controlsRef.current.reset();
                controlsRef.current.target.set(pos[0], pos[1], pos[2]);
                controlsRef.current.update();

                const camera = cameraRef.current;
                camera.position.set(pos[0], pos[1] + 1, pos[2] + 3);
                camera.lookAt(pos[0], pos[1], pos[2]);
                controlsRef.current.update();

                setTimeout(() => {
                  setIsZoomingOut(true);
                }, 3000);
              }
            }}
            onMouseEnter={() => setShowBalloonText(true)}
            onMouseLeave={() => setShowBalloonText(false)}
            style={{
              width: "55px",
              height: "55px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.9)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FaCloud size={32} />
          </button>
          {showBalloonText && (
            <div
              style={{
                position: "absolute",
                right: "110%",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.8)",
                color: "white",
                padding: "8px 14px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              Balloon Ride
            </div>
          )}
        </div>

        {/* Home */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => controlsRef.current?.reset()}
            onMouseEnter={() => setShowHomeText(true)}
            onMouseLeave={() => setShowHomeText(false)}
            style={{
              width: "55px",
              height: "55px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.9)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FaHome size={32} />
          </button>
          {showHomeText && (
            <div
              style={{
                position: "absolute",
                right: "110%",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.8)",
                color: "white",
                padding: "8px 14px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              Go Home
            </div>
          )}
        </div>
      </div>

      {/* Radio Player Panel - Bottom Left */}
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
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Radio name */}
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

          {/* City and country */}
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

          {/* Audio Controls */}
          <div
            style={{
              marginTop: "10px",
              paddingTop: "15px",
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
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : isPlaying ? (
                  <FaPause />
                ) : (
                  <FaPlay />
                )}
              </button>
            </div>

            {/* Volume Control */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}
              >
                {volume === 0 ? (
                  <FaVolumeMute />
                ) : volume < 0.5 ? (
                  <FaVolumeDown />
                ) : (
                  <FaVolumeUp />
                )}
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

<<<<<<< HEAD
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
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {currentStation ? (
          <>
            <HiSpeakerWave style={{ color: "#1DB954" }} />
            Listening to {currentStation.country} Radio
          </>
        ) : (
          <>
            <FaGlobe style={{ color: "#1DB954" }} />
            Enjoy our project!
          </>
        )}
      </div>

      {/* Station Info Tooltip */}
      {hoveredStation && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 50,
            maxWidth: "300px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}
          >
            📻 {hoveredStation.name}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "4px" }}>
            🌍 {hoveredStation.country}
          </div>
          {hoveredStation.city && (
            <div
              style={{ fontSize: "14px", opacity: 0.8, marginBottom: "4px" }}
            >
              🏙️ {hoveredStation.city}
            </div>
          )}
          {hoveredStation.language && (
            <div
              style={{ fontSize: "14px", opacity: 0.8, marginBottom: "4px" }}
            >
              🗣️ {hoveredStation.language}
            </div>
          )}
          {hoveredStation.bitrate && (
            <div
              style={{ fontSize: "14px", opacity: 0.8, marginBottom: "4px" }}
            >
              📊 {hoveredStation.bitrate} kbps
            </div>
          )}
          {hoveredStation.codec && (
            <div style={{ fontSize: "14px", opacity: 0.8 }}>
              🎵 {hoveredStation.codec}
            </div>
          )}
        </div>
      )}

      {/* AI Recommendation Notification */}
      {aiRecommendation && (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "16px 24px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 50,
            maxWidth: "400px",
            textAlign: "center",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div
            style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}
          >
            🎵 New Station
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            {aiRecommendation.message}
          </div>
        </div>
      )}

      {/* Like Menu Overlay */}
=======
      {/* Like Menu */}
>>>>>>> 16-bilguune
      {showLikeMenu && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowLikeMenu(false)}
          />
          <LikeMenu
            radios={radios}
            onClose={() => setShowLikeMenu(false)}
            initialAnimation="slide-in"
          />
        </>
      )}
    </div>
  );
}
