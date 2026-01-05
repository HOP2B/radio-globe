import { useState, useEffect } from "react";
import type { RadioStation } from "../api/radio";

type LikeMenuProps = {
  radios: RadioStation[];
  onClose: () => void;
  initialAnimation?: string;
};

export default function LikeMenu({ radios, onClose }: LikeMenuProps) {
  const [likedStations, setLikedStations] = useState<RadioStation[]>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem("likedRadioStations");
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "liked">("all");
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<RadioStation | null>(
    null
  );

  // Save to localStorage whenever likedStations changes
  useEffect(() => {
    localStorage.setItem("likedRadioStations", JSON.stringify(likedStations));
  }, [likedStations]);

  const toggleLike = (station: RadioStation) => {
    setLikedStations((prev) =>
      prev.some((s) => s.stationuuid === station.stationuuid)
        ? prev.filter((s) => s.stationuuid !== station.stationuuid)
        : [...prev, station]
    );
  };

  const isLiked = (station: RadioStation) => {
    return likedStations.some((s) => s.stationuuid === station.stationuuid);
  };

  const playStation = (station: RadioStation) => {
    // Stop current audio if playing
    if (
      audioRef &&
      !audioRef.paused &&
      currentPlaying?.stationuuid === station.stationuuid
    ) {
      audioRef.pause();
      setCurrentPlaying(null);
      return;
    }

    if (
      audioRef &&
      currentPlaying &&
      currentPlaying.stationuuid !== station.stationuuid
    ) {
      audioRef.pause();
    }

    const newAudio = new Audio(station.url);
    newAudio.play().catch((e) => console.log("Auto-play prevented:", e));

    // Store cleanup function to remove event listener
    const cleanup = () => {
      newAudio.removeEventListener("ended", handleEnded);
    };

    const handleEnded = () => {
      cleanup();
      setCurrentPlaying(null);
    };

    newAudio.addEventListener("ended", handleEnded);

    setAudioRef(newAudio);
    setCurrentPlaying(station);

    // Return cleanup function
    return cleanup;
  };

  const isPlaying = (station: RadioStation) => {
    return (
      currentPlaying?.stationuuid === station.stationuuid && !audioRef?.paused
    );
  };

  const filteredRadios = radios.filter(
    (station) =>
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (station.city &&
        station.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const likedRadios = filteredRadios.filter((station) => isLiked(station));
  const allRadios = filteredRadios.filter((station) => !isLiked(station));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Menu Container */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white">🎵 Your Radio Likes</h1>
          <button
            onClick={onClose}
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

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search stations..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all focus:ring-2 focus:ring-green-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
              activeTab === "all"
                ? "text-green-400 border-b-2 border-green-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              All Stations
              <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                {filteredRadios.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("liked")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
              activeTab === "liked"
                ? "text-green-400 border-b-2 border-green-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              ❤️ Liked
              <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                {likedRadios.length}
              </span>
            </div>
          </button>
        </div>

        {/* Stations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-800">
            {(activeTab === "all" ? allRadios : likedRadios).map((station) => (
              <div
                key={station.stationuuid}
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
                      onClick={() => playStation(station)}
                      className={`p-2 rounded-lg transition-all ${
                        isPlaying(station)
                          ? "bg-red-500 text-white"
                          : "text-gray-400 hover:bg-gray-700 hover:text-white"
                      }`}
                      title={isPlaying(station) ? "Stop" : "Play"}
                    >
                      {isPlaying(station) ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
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

                    <button
                      onClick={() => toggleLike(station)}
                      className={`p-2 rounded-lg transition-all ${
                        isLiked(station)
                          ? "bg-green-500 text-white"
                          : "text-gray-400 hover:bg-gray-700 hover:text-white"
                      }`}
                      title={isLiked(station) ? "Unlike" : "Like"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between items-center text-sm text-gray-400 bg-gray-900/50">
          <div className="flex items-center gap-2">
            <span>📻 Total Stations: {radios.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>❤️ Liked: {likedStations.length}</span>
            {likedStations.length > 0 && (
              <span className="text-green-400 text-xs">
                {((likedStations.length / radios.length) * 100).toFixed(1)}% of
                all
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
