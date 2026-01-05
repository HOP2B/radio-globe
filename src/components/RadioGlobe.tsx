/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useEffect, useCallback } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Stars } from "@react-three/drei";
import { TextureLoader, Vector3 } from "three";
import { useUser } from "@clerk/clerk-react";
import { useTheme } from "../hooks/useTheme";
import { rtdb } from "../firebase";
import { ref, onValue, off, set, update } from "firebase/database";
import type { RadioStation } from "../api/radio";
import LikeMenu from "./LikeMenu";
import Leaderboard from "./Leaderboard";
import Header from "./Header";
import LocalStorageManager from "../utils/localStorageManager";
// Icons import
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
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  // Use Clerk user ID if available, otherwise fallback to local-user
  const userId = user?.id || "local-user";
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(
    null
  );
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("radioVolume");
    return saved ? parseFloat(saved) : 0.7;
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [unavailableStations, setUnavailableStations] = useState<Set<string>>(
    new Set()
  );
  const [showLikeMenu, setShowLikeMenu] = useState(false); // Hide menu by default
  const [showRecentlyPlayed, setShowRecentlyPlayed] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const menuAnimation = "slide-in";
  const [isBalloonRiding, setIsBalloonRiding] = useState(false);
  const [_zoomProgress, setZoomProgress] = useState(0);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  // Balloon Ride guessing states
  const [isGuessing, setIsGuessing] = useState(false);
  const [guessCountry, setGuessCountry] = useState("");
  const [balloonStation, setBalloonStation] = useState<RadioStation | null>(
    null
  );
  const [guessFeedback, setGuessFeedback] = useState<{
    message: string;
    type: "correct" | "wrong" | null;
  }>({ message: "", type: null });
  const [points, setPoints] = useState(() => {
    // Load from local storage
    const saved = localStorage.getItem("balloonPoints");
    return saved ? parseInt(saved) : 0;
  });
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    station: RadioStation;
    message: string;
  } | null>(null);
  const [balloonNotification, setBalloonNotification] = useState<{
    message: string;
    type: "info" | "success";
  } | null>(null);
  const [showTutorial, setShowTutorial] = useState(true); // Always show tutorial
  const [showConfetti, setShowConfetti] = useState(false);
  const [guessTimeLeft, setGuessTimeLeft] = useState(30); // 30 second timer
  const [guessStreak, setGuessStreak] = useState(0); // Consecutive correct guesses
  const [hoveredStation, setHoveredStation] = useState<RadioStation | null>(
    null
  );
  // Multiplayer states
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);
  const [multiplayerSessionId, setMultiplayerSessionId] = useState<
    string | null
  >(null);
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<any[]>([]);
  const [currentPlayerScore, setCurrentPlayerScore] = useState(0);
  const [filterType, setFilterType] = useState<"all" | "country" | "language">(
    "all"
  );
  const [filterValue, setFilterValue] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [recentlyPlayed, setRecentlyPlayed] = useState<RadioStation[]>(() => {
    const saved = localStorage.getItem("recentlyPlayedStations");
    return saved ? JSON.parse(saved) : [];
  });
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const radius = 5;

  // Sound effects
  const playSound = useCallback((frequency: number, duration: number = 200) => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration / 1000
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
      // Fallback: no sound on error
      console.log("Sound effect:", frequency === 800 ? "Correct!" : "Wrong!");
    }
  }, []);

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
  }, [currentStation, audioRef, volume, isPlaying]);

  // Handle play/pause state changes
  useEffect(() => {
    if (audioRef && currentStation) {
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
  useEffect(() => {
    if (audioRef) {
      audioRef.volume = volume;
    }
    // Save volume to localStorage
    localStorage.setItem("radioVolume", volume.toString());
  }, [volume, audioRef]);

  // Save recently played to localStorage
  useEffect(() => {
    localStorage.setItem(
      "recentlyPlayedStations",
      JSON.stringify(recentlyPlayed)
    );
  }, [recentlyPlayed]);

  // Load/save points
  useEffect(() => {
    const loadPoints = async () => {
      // Use local storage manager
      const userData = await LocalStorageManager.getUserData(userId);
      if (userData) {
        setPoints(userData.points || 0);
      } else {
        // Initialize user
        const newUser = await LocalStorageManager.initializeUser(userId);
        setPoints(newUser.points || 0);
      }
    };
    loadPoints();
  }, [userId]);

  // Save points to local storage manager
  useEffect(() => {
    const savePoints = async () => {
      await LocalStorageManager.saveUserData(userId, {
        points,
        email: user?.primaryEmailAddress?.emailAddress || undefined,
        displayName: user?.fullName || user?.firstName || undefined,
        username: user?.username || undefined,
      });
      await LocalStorageManager.updateLeaderboard(userId, points, {
        email: user?.primaryEmailAddress?.emailAddress || undefined,
        displayName: user?.fullName || user?.firstName || undefined,
        username: user?.username || undefined,
      });
    };
    savePoints();
  }, [points, userId, user]);

  const handleTimeout = useCallback(async () => {
    if (!balloonStation) return;

    // Play timeout sound
    playSound(200, 500); // Low, long beep for timeout

    const guessData = {
      stationName: balloonStation.name,
      stationCountry: balloonStation.country,
      guessedCountry: "", // Timeout
      isCorrect: false,
      timestamp: new Date(),
    };

    // Save to local storage
    await LocalStorageManager.addGuess(userId, guessData);

    // Reset streak on timeout
    setGuessStreak(0);

    // Show timeout message
    setGuessFeedback({
      message: `⏰ Time's up! The country was: ${balloonStation.country}`,
      type: "wrong",
    });

    // End balloon ride after showing the answer
    setTimeout(() => {
      setIsGuessing(false);
      setIsBalloonRiding(false);
      setBalloonStation(null);
      setGuessCountry("");
      setGuessFeedback({ message: "", type: null });
      setZoomProgress(0);

      // Clean up multiplayer session
      if (isMultiplayerMode && multiplayerSessionId) {
        const playersRef = ref(
          rtdb,
          `balloon-sessions/${multiplayerSessionId}/players`
        );
        off(playersRef);
        setIsMultiplayerMode(false);
        setMultiplayerSessionId(null);
        setMultiplayerPlayers([]);
        setCurrentPlayerScore(0);
      }

      // Stop the audio
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }

      // Reset camera to earth with smooth animation
      if (controlsRef.current && cameraRef.current) {
        controlsRef.current.enabled = true; // Re-enable controls

        // Start zoom-out animation
        setIsZoomingOut(true);
        setZoomProgress(0);

        // Reset controls after animation completes
        setTimeout(() => {
          controlsRef.current.reset();
          controlsRef.current.update();
        }, 2000); // Match animation duration
      }
    }, 3000);
  }, [
    balloonStation,
    userId,
    playSound,
    isMultiplayerMode,
    multiplayerSessionId,
    audioRef,
  ]);

  // Countdown timer for guessing
  useEffect(() => {
    let interval: number;
    if (isGuessing && guessTimeLeft > 0) {
      interval = setInterval(() => {
        setGuessTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up! Auto-submit wrong guess
            handleTimeout();
            return 30; // Reset for next guess
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGuessing, guessTimeLeft, handleTimeout]);

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
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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
  const earthTexture = useLoader(TextureLoader, "/earth-map-texture.jpg");

  // Multiplayer functions
  const startMultiplayerBalloonRide = async () => {
    if (radios.length === 0) {
      console.warn("No radio stations loaded yet");
      return;
    }

    // Use a global session for simplicity
    const sessionId = "global-multiplayer";
    setMultiplayerSessionId(sessionId);
    setIsMultiplayerMode(true);

    // Select a random station
    const selectedStation = radios[Math.floor(Math.random() * radios.length)];
    setBalloonStation(selectedStation);
    setGuessCountry("");
    setIsGuessing(true);
    setIsBalloonRiding(true);
    setZoomProgress(0);
    setGuessTimeLeft(30);
    setCurrentPlayerScore(0);

    // Join the multiplayer session
    const playerRef = ref(
      rtdb,
      `balloon-sessions/${sessionId}/players/${userId}`
    );
    await set(playerRef, {
      id: userId,
      name: user?.fullName || user?.username || "Anonymous",
      score: 0,
      isActive: true,
      joinedAt: Date.now(),
    });

    // Listen to other players
    const playersRef = ref(rtdb, `balloon-sessions/${sessionId}/players`);
    onValue(playersRef, (snapshot) => {
      const playersData = snapshot.val();
      if (playersData) {
        const players = Object.values(playersData);
        setMultiplayerPlayers(players);
      }
    });

    // Set current station and play
    setCurrentStation(selectedStation);
    setIsPlaying(true);
    if (audioRef) {
      audioRef.src = selectedStation.url;
      audioRef.volume = volume;
      audioRef.play().catch((e) => console.log("Auto-play failed:", e));
    }

    setBalloonNotification({
      message:
        "🎈 Multiplayer Balloon Ride started! Compete with other players!",
      type: "info",
    });
    setTimeout(() => setBalloonNotification(null), 5000);
  };

  const updatePlayerScore = async (newScore: number) => {
    if (!multiplayerSessionId) return;

    setCurrentPlayerScore(newScore);
    const playerRef = ref(
      rtdb,
      `balloon-sessions/${multiplayerSessionId}/players/${userId}`
    );
    await update(playerRef, { score: newScore });
  };

  // Balloon Ride functions
  const startBalloonRide = () => {
    if (radios.length === 0) {
      console.warn("No radio stations loaded yet");
      return;
    }

    // Select a random station from all countries
    const selectedStation = radios[Math.floor(Math.random() * radios.length)];

    setBalloonStation(selectedStation);
    setGuessCountry("");
    setIsGuessing(true);
    setIsBalloonRiding(true);
    setZoomProgress(0); // Reset zoom progress
    setGuessTimeLeft(30); // Reset timer

    // Don't hide tutorial permanently - let it show on next visit

    // Show notification
    setBalloonNotification({
      message: "🎈 Balloon Ride started! Guess the country for 10 points!",
      type: "info",
    });
    // Auto-hide notification after 5 seconds
    setTimeout(() => setBalloonNotification(null), 5000);

    // Set current station and play
    setCurrentStation(selectedStation);
    setIsPlaying(true);
    if (audioRef) {
      audioRef.src = selectedStation.url;
      audioRef.volume = volume;
      audioRef.play().catch((e) => console.log("Auto-play failed:", e));
    }

    // Move camera to station with smooth animation
    if (cameraRef.current && controlsRef.current) {
      const pos = latLngToXYZ(
        selectedStation.latitude!,
        selectedStation.longitude!,
        radius + 0.5
      );

      // Disable controls during balloon ride
      controlsRef.current.enabled = false;

      // Set target position for smooth transition
      controlsRef.current.target.set(pos[0], pos[1], pos[2]);
      controlsRef.current.update();

      // Animate camera position smoothly
      const startPos = cameraRef.current.position.clone();
      const endPos = new Vector3(pos[0], pos[1] + 1, pos[2] + 3);
      let progress = 0;

      const animateCamera = () => {
        progress += 0.05;
        if (progress < 1) {
          cameraRef.current.position.lerpVectors(startPos, endPos, progress);
          cameraRef.current.lookAt(pos[0], pos[1], pos[2]);
          controlsRef.current.update();
          requestAnimationFrame(animateCamera);
        }
      };
      animateCamera();
    }
  };

  const checkGuess = async () => {
    console.log("checkGuess called with:", guessCountry);
    console.log("balloonStation:", balloonStation);
    if (!balloonStation || !guessCountry.trim()) {
      console.log("Missing balloonStation or guessCountry");
      return;
    }

    const isCorrect = Boolean(
      guessCountry
        .toLowerCase()
        .includes(balloonStation.country.toLowerCase()) ||
        balloonStation.country
          .toLowerCase()
          .includes(guessCountry.toLowerCase())
    );

    console.log(
      "Guess check:",
      guessCountry,
      "vs",
      balloonStation.country,
      "Result:",
      isCorrect,
      "Type:",
      typeof isCorrect
    );

    const guessData = {
      stationName: balloonStation.name,
      stationCountry: balloonStation.country,
      guessedCountry: guessCountry,
      isCorrect,
      timestamp: new Date(),
    };

    // Save to local storage
    await LocalStorageManager.addGuess(userId, guessData);
    console.log("Give up saved to local storage");

    if (isCorrect === true) {
      console.log("Correct guess detected!");
      const streakBonus = Math.floor(guessStreak / 3) * 5; // Bonus every 3 streaks
      const basePoints = 10;
      const totalPoints = basePoints + streakBonus;
      const newPoints = points + totalPoints;
      const newStreak = guessStreak + 1;

      console.log(
        "Awarding points:",
        points,
        "->",
        newPoints,
        "Streak:",
        newStreak
      );
      setPoints(newPoints);
      setGuessStreak(newStreak);

      // Update multiplayer score if in multiplayer mode
      if (isMultiplayerMode) {
        updatePlayerScore(currentPlayerScore + totalPoints);
      }

      // Play success sound
      playSound(800, 300); // Higher pitch for success

      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      // Immediately save points
      await LocalStorageManager.saveUserData(userId, { points: newPoints });
      await LocalStorageManager.updateLeaderboard(userId, newPoints);
      console.log("Points saved to local storage:", newPoints);

      const bonusText = streakBonus > 0 ? ` +${streakBonus} streak bonus!` : "";
      setGuessFeedback({
        message: `🎉 Correct! +${totalPoints} points awarded!${bonusText}`,
        type: "correct",
      });
      // End the ride after a short delay to show the success message
      setTimeout(() => {
        console.log("Ending balloon ride after correct guess");
        endBalloonRide();
      }, 2000);
    } else {
      // Wrong guess - reset streak
      setGuessStreak(0);

      // Wrong guess - show feedback
      playSound(300, 200); // Lower pitch for wrong
      setGuessFeedback({
        message: `Wrong guess! Try again or give up.`,
        type: "wrong",
      });
    }
  };

  const giveUp = async () => {
    if (!balloonStation) return;

    const guessData = {
      stationName: balloonStation.name,
      stationCountry: balloonStation.country,
      guessedCountry: "", // No guess
      isCorrect: false,
      timestamp: new Date(),
    };

    // Save to local storage
    await LocalStorageManager.addGuess(userId, guessData);
    console.log("Guess saved to local storage");

    // Reset streak on wrong guess
    setGuessStreak(0);

    // Show the answer and end the ride
    setGuessFeedback({
      message: `The country was: ${balloonStation.country}`,
      type: "wrong",
    });

    // End balloon ride after showing the answer
    setTimeout(() => {
      endBalloonRide();
    }, 3000);
  };

  const endBalloonRide = () => {
    setIsGuessing(false);
    setIsBalloonRiding(false);
    setBalloonStation(null);
    setGuessCountry("");
    setGuessFeedback({ message: "", type: null });
    setZoomProgress(0); // Reset zoom progress

    // Clean up multiplayer session
    if (isMultiplayerMode && multiplayerSessionId) {
      const playersRef = ref(
        rtdb,
        `balloon-sessions/${multiplayerSessionId}/players`
      );
      off(playersRef);
      setIsMultiplayerMode(false);
      setMultiplayerSessionId(null);
      setMultiplayerPlayers([]);
      setCurrentPlayerScore(0);
    }

    // Stop the audio
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }

    // Reset camera to earth with smooth animation
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.enabled = true; // Re-enable controls

      // Start zoom-out animation
      setIsZoomingOut(true);
      setZoomProgress(0);

      // Reset controls after animation completes
      setTimeout(() => {
        controlsRef.current.reset();
        controlsRef.current.update();
      }, 2000); // Match animation duration
    }
  };

  // If no radios loaded yet, show loading
  if (radios.length === 0) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: theme === "light" ? "#f8fafc" : "black",
          color: theme === "light" ? "#1f2937" : "white",
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
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: theme === "light" ? "#f8fafc" : "black",
      }}
    >
      <Header />
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
        {radios
          .filter((station) => {
            // First apply search filter
            if (
              searchTerm &&
              !station.name.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              return false;
            }
            // Then apply category filters
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
                  // Check if station has a valid URL
                  if (!station.url || !station.url.trim()) {
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
                    const playPromise = audioRef.play();
                    const timeoutId = setTimeout(() => {
                      // Timeout occurred
                      console.log("Audio play timeout for:", station.name);
                      setIsPlaying(false);
                      setIsLoading(false);
                      setUnavailableStations(
                        (prev) => new Set([...prev, station.stationuuid])
                      );
                      setBalloonNotification({
                        message:
                          "Error: Radio stream failed to load. The station may be unavailable.",
                        type: "info",
                      });
                      setTimeout(() => setBalloonNotification(null), 5000);
                    }, 5000);

                    playPromise
                      .then(() => {
                        clearTimeout(timeoutId);
                        console.log("Auto-play successful for:", station.name);
                        // Mark as available (remove from unavailable set)
                        setUnavailableStations((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(station.stationuuid);
                          return newSet;
                        });
                        // Add to recently played
                        setRecentlyPlayed((prev) => {
                          const filtered = prev.filter(
                            (s) => s.stationuuid !== station.stationuuid
                          );
                          return [station, ...filtered].slice(0, 20); // Keep last 20
                        });
                      })
                      .catch((e) => {
                        clearTimeout(timeoutId);
                        console.log("Auto-play failed:", e);
                        // Keep in unavailable set (already there)
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
                      });
                  }
                }}
                onPointerOver={() => setHoveredStation(station)}
                onPointerOut={() => setHoveredStation(null)}
              />
            );
          })}

        <OrbitControls
          ref={controlsRef}
          enableZoom={!isBalloonRiding && !isGuessing}
          enablePan={false}
          enableRotate={!isBalloonRiding && !isGuessing}
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
      </Canvas>

      {/* Radio count display */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 20,
          color: "white",
          background: "rgba(0,0,0,0.8)",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
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

      {/* Points display */}
      <div
        style={{
          position: "absolute",
          top: 100,
          right: 20,
          color: "white",
          background: "rgba(0,0,0,0.8)",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        🏆 {points} Points
      </div>

      {/* Search Bar */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 180,
          background: "rgba(0,0,0,0.8)",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: "250px",
        }}
      >
        <FaSearch style={{ color: "#1DB954" }} />
        <input
          type="text"
          placeholder="Search stations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "14px",
            outline: "none",
            flex: 1,
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: "16px",
              padding: "2px",
            }}
          >
            ✕
          </button>
        )}
      </div>

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
          top: 220,
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
          top: 320,
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
          top: 270,
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
            top: 370,
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

      {/* Hidden audio element - always rendered */}
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
          // Ignore AbortError (code 20) which happens when src changes during loading
          if (audioRef?.error?.code === 20) {
            return;
          }
          setIsPlaying(false);
          setIsLoading(false);
          if (currentStation) {
            setUnavailableStations(
              (prev) => new Set([...prev, currentStation.stationuuid])
            );
          }
          // Show user-friendly error notification
          setBalloonNotification({
            message:
              "Failed to load audio stream. The station may be unavailable or experiencing issues.",
            type: "info",
          });
          setTimeout(() => setBalloonNotification(null), 5000);
        }}
        style={{ display: "none" }}
      />

      {/* Control Buttons Container */}
      <div
        style={{
          position: "absolute",
          top: 160,
          right: 20,
          display: "flex",
          flexDirection: "row",
          gap: "12px",
          zIndex: 10,
        }}
      >
        {/* Balloon Ride Button */}
        <button
          onClick={startBalloonRide}
          disabled={radios.length === 0}
          title={
            radios.length === 0
              ? "Loading stations..."
              : "Balloon Ride - Guess countries for points!"
          }
          className={`text-white p-3 rounded-xl border-2 font-medium backdrop-blur-md cursor-pointer transition-all duration-300 flex items-center justify-center w-13 h-13 relative ${
            radios.length === 0
              ? "bg-black/50 cursor-not-allowed"
              : isBalloonRiding
              ? "bg-orange-500/90 border-orange-400 shadow-lg shadow-orange-500/60"
              : "bg-black/80 border-white/20 hover:bg-black/90 animate-pulse shadow-lg shadow-sky-500/40"
          }`}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.9)";
            e.currentTarget.style.transform = "scale(1.05)";
            // Show tooltip
            const tooltip = document.createElement("div");
            tooltip.textContent = "Balloon Ride";
            tooltip.style.position = "absolute";
            tooltip.style.right = "60px";
            tooltip.style.top = "50%";
            tooltip.style.transform = "translateY(-50%)";
            tooltip.style.background = "rgba(0,0,0,0.9)";
            tooltip.style.color = "white";
            tooltip.style.padding = "8px 12px";
            tooltip.style.borderRadius = "6px";
            tooltip.style.fontSize = "14px";
            tooltip.style.whiteSpace = "nowrap";
            tooltip.style.zIndex = "1000";
            tooltip.style.pointerEvents = "none";
            e.currentTarget.appendChild(tooltip);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
            e.currentTarget.style.transform = "scale(1)";
            // Remove tooltip
            const tooltip = e.currentTarget.querySelector("div");
            if (tooltip) tooltip.remove();
          }}
        >
          <FaCloud style={{ color: "#87CEEB" }} />
        </button>

        {/* Multiplayer Balloon Ride Button */}
        <button
          onClick={startMultiplayerBalloonRide}
          disabled={radios.length === 0}
          title={
            radios.length === 0
              ? "Loading stations..."
              : "Multiplayer Balloon Ride - Compete with others!"
          }
          className={`text-white p-3 rounded-xl border-2 font-medium backdrop-blur-md cursor-pointer transition-all duration-300 flex items-center justify-center w-13 h-13 relative ${
            radios.length === 0
              ? "bg-black/50 cursor-not-allowed"
              : isMultiplayerMode
              ? "bg-purple-500/90 border-purple-400 shadow-lg shadow-purple-500/60"
              : "bg-black/80 border-white/20 hover:bg-black/90 shadow-lg"
          }`}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.9)";
            e.currentTarget.style.transform = "scale(1.05)";
            // Show tooltip
            const tooltip = document.createElement("div");
            tooltip.textContent = "Multiplayer Balloon Ride";
            tooltip.style.position = "absolute";
            tooltip.style.right = "60px";
            tooltip.style.top = "50%";
            tooltip.style.transform = "translateY(-50%)";
            tooltip.style.background = "rgba(0,0,0,0.9)";
            tooltip.style.color = "white";
            tooltip.style.padding = "8px 12px";
            tooltip.style.borderRadius = "6px";
            tooltip.style.fontSize = "14px";
            tooltip.style.whiteSpace = "nowrap";
            tooltip.style.zIndex = "1000";
            tooltip.style.pointerEvents = "none";
            e.currentTarget.appendChild(tooltip);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
            e.currentTarget.style.transform = "scale(1)";
            // Remove tooltip
            const tooltip = e.currentTarget.querySelector("div");
            if (tooltip) tooltip.remove();
          }}
        >
          <span style={{ fontSize: "16px" }}>👥</span>
        </button>

        {/* Recently Played Button */}
        <button
          onClick={() => setShowRecentlyPlayed(!showRecentlyPlayed)}
          title={
            showRecentlyPlayed
              ? "Close Recent"
              : `Recent (${recentlyPlayed.length})`
          }
          style={{
            color: "white",
            background: "rgba(0,0,0,0.8)",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "16px",
            backdropFilter: "blur(10px)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: showRecentlyPlayed
              ? "0 0 20px rgba(30, 185, 84, 0.3)"
              : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.9)";
            e.currentTarget.style.transform = "scale(1.05)";
            // Show tooltip
            const tooltip = document.createElement("div");
            tooltip.textContent = showRecentlyPlayed
              ? "Close Recent"
              : `Recent (${recentlyPlayed.length})`;
            tooltip.style.position = "absolute";
            tooltip.style.right = "60px";
            tooltip.style.top = "50%";
            tooltip.style.transform = "translateY(-50%)";
            tooltip.style.background = "rgba(0,0,0,0.9)";
            tooltip.style.color = "white";
            tooltip.style.padding = "8px 12px";
            tooltip.style.borderRadius = "6px";
            tooltip.style.fontSize = "14px";
            tooltip.style.whiteSpace = "nowrap";
            tooltip.style.zIndex = "1000";
            tooltip.style.pointerEvents = "none";
            e.currentTarget.appendChild(tooltip);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
            e.currentTarget.style.transform = "scale(1)";
            // Remove tooltip
            const tooltip = e.currentTarget.querySelector("div");
            if (tooltip) tooltip.remove();
          }}
        >
          <FaHome
            style={{ color: showRecentlyPlayed ? "#ff6b6b" : "#1DB954" }}
          />
        </button>

        {/* Leaderboard Button */}
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          title={showLeaderboard ? "Close Leaderboard" : "Leaderboard"}
          style={{
            color: "white",
            background: "rgba(0,0,0,0.8)",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "16px",
            backdropFilter: "blur(10px)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: showLeaderboard
              ? "0 0 20px rgba(30, 185, 84, 0.3)"
              : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.9)";
            e.currentTarget.style.transform = "scale(1.05)";
            // Show tooltip
            const tooltip = document.createElement("div");
            tooltip.textContent = showLeaderboard
              ? "Close Leaderboard"
              : "Leaderboard";
            tooltip.style.position = "absolute";
            tooltip.style.right = "60px";
            tooltip.style.top = "50%";
            tooltip.style.transform = "translateY(-50%)";
            tooltip.style.background = "rgba(0,0,0,0.9)";
            tooltip.style.color = "white";
            tooltip.style.padding = "8px 12px";
            tooltip.style.borderRadius = "6px";
            tooltip.style.fontSize = "14px";
            tooltip.style.whiteSpace = "nowrap";
            tooltip.style.zIndex = "1000";
            tooltip.style.pointerEvents = "none";
            e.currentTarget.appendChild(tooltip);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
            e.currentTarget.style.transform = "scale(1)";
            // Remove tooltip
            const tooltip = e.currentTarget.querySelector("div");
            if (tooltip) tooltip.remove();
          }}
        >
          🏆
        </button>

        {/* Like Menu Button */}
        <button
          onClick={() => setShowLikeMenu(!showLikeMenu)}
          title={showLikeMenu ? "Close Menu" : "Open Menu"}
          style={{
            color: "white",
            background: "rgba(0,0,0,0.8)",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "16px",
            backdropFilter: "blur(10px)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: showLikeMenu
              ? "0 0 20px rgba(30, 185, 84, 0.3)"
              : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.9)";
            e.currentTarget.style.transform = "scale(1.05)";
            // Show tooltip
            const tooltip = document.createElement("div");
            tooltip.textContent = showLikeMenu ? "Close Menu" : "Open Menu";
            tooltip.style.position = "absolute";
            tooltip.style.right = "60px";
            tooltip.style.top = "50%";
            tooltip.style.transform = "translateY(-50%)";
            tooltip.style.background = "rgba(0,0,0,0.9)";
            tooltip.style.color = "white";
            tooltip.style.padding = "8px 12px";
            tooltip.style.borderRadius = "6px";
            tooltip.style.fontSize = "14px";
            tooltip.style.whiteSpace = "nowrap";
            tooltip.style.zIndex = "1000";
            tooltip.style.pointerEvents = "none";
            e.currentTarget.appendChild(tooltip);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
            e.currentTarget.style.transform = "scale(1)";
            // Remove tooltip
            const tooltip = e.currentTarget.querySelector("div");
            if (tooltip) tooltip.remove();
          }}
        >
          <FaHeart style={{ color: showLikeMenu ? "#ff6b6b" : "#1DB954" }} />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          style={{
            color: "white",
            background: "rgba(0,0,0,0.8)",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "16px",
            backdropFilter: "blur(10px)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.9)";
            e.currentTarget.style.transform = "scale(1.05)";
            // Show tooltip
            const tooltip = document.createElement("div");
            tooltip.textContent = `Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`;
            tooltip.style.position = "absolute";
            tooltip.style.right = "60px";
            tooltip.style.top = "50%";
            tooltip.style.transform = "translateY(-50%)";
            tooltip.style.background = "rgba(0,0,0,0.9)";
            tooltip.style.color = "white";
            tooltip.style.padding = "8px 12px";
            tooltip.style.borderRadius = "6px";
            tooltip.style.fontSize = "14px";
            tooltip.style.whiteSpace = "nowrap";
            tooltip.style.zIndex = "1000";
            tooltip.style.pointerEvents = "none";
            e.currentTarget.appendChild(tooltip);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
            e.currentTarget.style.transform = "scale(1)";
            // Remove tooltip
            const tooltip = e.currentTarget.querySelector("div");
            if (tooltip) tooltip.remove();
          }}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

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
                <FaStepBackward />
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
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : isPlaying ? (
                  <FaPause />
                ) : (
                  <FaPlay />
                )}
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
                <FaStepForward />
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

      {/* Enjoy Project Text - Hidden during balloon ride */}
      {!isBalloonRiding && (
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
      )}

      {/* Station Info Tooltip */}
      {hoveredStation && (
        <div
          style={{
            position: "absolute",
            top: 100,
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
            top: 180,
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

      {/* Balloon Ride Notification */}
      {balloonNotification && (
        <div
          style={{
            position: "absolute",
            top: 140,
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
            🎈 Balloon Ride Started!
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            {balloonNotification.message}
          </div>
        </div>
      )}

      {/* Confetti Effect */}
      {showConfetti && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 90,
          }}
        >
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${Math.random() * 100}%`,
                top: "-10px",
                width: "10px",
                height: "10px",
                background: [
                  "#ff6b6b",
                  "#4ecdc4",
                  "#45b7d1",
                  "#f9ca24",
                  "#f0932b",
                ][Math.floor(Math.random() * 5)],
                borderRadius: "50%",
                animation: `confetti ${
                  2 + Math.random() * 2
                }s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            animation: "fadeIn 0.5s ease-out",
          }}
          onClick={() => setShowTutorial(false)}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.95)",
              color: "white",
              padding: "32px",
              borderRadius: "16px",
              border: "2px solid #1DB954",
              maxWidth: "500px",
              textAlign: "center",
              backdropFilter: "blur(10px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🎈</div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "16px",
                color: "#1DB954",
              }}
            >
              Welcome to Balloon Ride!
            </h2>
            <div
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
                marginBottom: "24px",
              }}
            >
              <p>🎵 Listen to radio stations from around the world</p>
              <p>🎯 Guess the country to earn 10 points each!</p>
              <p>🏆 Compete on the leaderboard</p>
              <p>✨ Click the pulsing cloud button to start!</p>
            </div>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button
                onClick={() => setShowTutorial(false)}
                style={{
                  background: "#1DB954",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
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
                Got it! Let's Play 🎈
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("hasPlayedBalloonRide");
                  setShowTutorial(true);
                }}
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                }}
              >
                Reset Tutorial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multiplayer Leaderboard */}
      {isMultiplayerMode && multiplayerPlayers.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 160,
            right: 400,
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "2px solid #8b5cf6",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 55,
            minWidth: "200px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#8b5cf6",
            }}
          >
            👥 Live Players ({multiplayerPlayers.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {multiplayerPlayers
              .sort((a: any, b: any) => b.score - a.score)
              .map((player: any, index: number) => (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background:
                      player.id === userId
                        ? "rgba(139, 92, 246, 0.2)"
                        : "rgba(255,255,255,0.05)",
                    borderRadius: "6px",
                    border: player.id === userId ? "1px solid #8b5cf6" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                      #{index + 1}
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {player.name} {player.id === userId && "(You)"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#1DB954",
                    }}
                  >
                    {player.score || 0}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Balloon Ride Guessing */}
      {isGuessing && balloonStation && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.95)",
            color: "white",
            padding: "24px 32px",
            borderRadius: "16px",
            border: "2px solid #1DB954",
            backdropFilter: "blur(10px)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
            zIndex: 60,
            minWidth: "350px",
            textAlign: "center",
            animation: "fadeIn 0.4s ease-out",
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "16px",
              color: "#1DB954",
            }}
          >
            🎈 Balloon Ride
          </div>
          <div style={{ fontSize: "18px", marginBottom: "20px", opacity: 0.9 }}>
            Guess the country!
          </div>
          <div style={{ fontSize: "16px", marginBottom: "16px", opacity: 0.8 }}>
            Now playing: {balloonStation.name}
          </div>

          {/* Timer and Streak Display */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            <div
              style={{
                color:
                  guessTimeLeft <= 10
                    ? "#ef4444"
                    : guessTimeLeft <= 20
                    ? "#f59e0b"
                    : "#10b981",
                fontWeight: "bold",
              }}
            >
              ⏰ {guessTimeLeft}s
            </div>
            <div
              style={{
                color: guessStreak > 0 ? "#f59e0b" : "#6b7280",
                fontWeight: guessStreak > 0 ? "bold" : "normal",
              }}
            >
              🔥 {guessStreak} streak
            </div>
          </div>

          {/* Feedback Message */}
          {guessFeedback.message && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "16px",
                backgroundColor:
                  guessFeedback.type === "correct" ? "#1DB954" : "#dc2626",
                color: "white",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {guessFeedback.message}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <input
              type="text"
              placeholder="Enter country name..."
              value={guessCountry}
              onChange={(e) => {
                setGuessCountry(e.target.value);
                // Clear previous feedback when user starts typing
                if (guessFeedback.message) {
                  setGuessFeedback({ message: "", type: null });
                }
              }}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                fontSize: "16px",
                textAlign: "center",
              }}
              onKeyPress={(e) => e.key === "Enter" && checkGuess()}
              disabled={guessFeedback.type === "correct"} // Disable input after correct guess
            />
          </div>
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            <button
              onClick={checkGuess}
              disabled={
                !guessCountry.trim() || guessFeedback.type === "correct"
              }
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                border: "none",
                background:
                  !guessCountry.trim() || guessFeedback.type === "correct"
                    ? "rgba(29, 185, 84, 0.5)"
                    : "#1DB954",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                cursor:
                  !guessCountry.trim() || guessFeedback.type === "correct"
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (guessCountry.trim() && guessFeedback.type !== "correct") {
                  e.currentTarget.style.background = "#17a34a";
                }
              }}
              onMouseLeave={(e) => {
                if (guessCountry.trim() && guessFeedback.type !== "correct") {
                  e.currentTarget.style.background = "#1DB954";
                }
              }}
            >
              Guess (+10 points)
            </button>
            <button
              onClick={giveUp}
              disabled={guessFeedback.type === "correct"}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.3)",
                background:
                  guessFeedback.type === "correct"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(255,255,255,0.1)",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                cursor:
                  guessFeedback.type === "correct" ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (guessFeedback.type !== "correct") {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (guessFeedback.type !== "correct") {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }
              }}
            >
              Give Up
            </button>
          </div>
        </div>
      )}

      {/* Recently Played Overlay */}
      {showRecentlyPlayed && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowRecentlyPlayed(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-white">
                  🕒 Recently Played
                </h1>
                <button
                  onClick={() => setShowRecentlyPlayed(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Stations List */}
              <div className="flex-1 overflow-y-auto">
                {recentlyPlayed.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <FaHome className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No recently played stations yet</p>
                    <p className="text-sm mt-2">
                      Start listening to some stations!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {recentlyPlayed.map((station, index) => (
                      <div
                        key={`${station.stationuuid}-${index}`}
                        className="p-4 hover:bg-gray-800 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-white font-medium truncate">
                                  {station.name}
                                </h3>
                                <p className="text-gray-400 text-sm truncate">
                                  {station.city ? `${station.city}, ` : ""}
                                  {station.country}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => {
                                if (
                                  unavailableStations.has(station.stationuuid)
                                ) {
                                  alert(
                                    `${station.name} is currently unavailable`
                                  );
                                  return;
                                }
                                // Stop previous audio if playing
                                if (audioRef && !audioRef.paused) {
                                  audioRef.pause();
                                }
                                setAudioEnabled(true);
                                setCurrentStation(station);
                                setIsPlaying(true);
                                setShowRecentlyPlayed(false); // Close menu
                                // Auto-play immediately
                                if (audioRef) {
                                  audioRef.src = station.url;
                                  audioRef.volume = volume;
                                  audioRef
                                    .play()
                                    .catch((e) =>
                                      console.log("Auto-play failed:", e)
                                    );
                                }
                              }}
                              className={`p-2 rounded-lg transition-all ${
                                unavailableStations.has(station.stationuuid)
                                  ? "text-red-400 cursor-not-allowed"
                                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
                              }`}
                              title={
                                unavailableStations.has(station.stationuuid)
                                  ? "Unavailable"
                                  : "Play"
                              }
                            >
                              {unavailableStations.has(station.stationuuid) ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    setRecentlyPlayed([]);
                    localStorage.removeItem("recentlyPlayedStations");
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  disabled={recentlyPlayed.length === 0}
                >
                  Clear History
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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

      {/* Leaderboard Overlay */}
      {showLeaderboard && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowLeaderboard(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-white">
                  🏆 Leaderboard
                </h1>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Leaderboard Content */}
              <div className="flex-1 overflow-y-auto">
                <Leaderboard />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Global styles for animations */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
