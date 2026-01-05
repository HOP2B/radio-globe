import { useEffect, useState } from "react";
import LocalStorageManager from "../utils/localStorageManager";

interface LeaderboardEntry {
  id: string;
  points: number;
  email?: string;
  displayName?: string;
  username?: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      const data = await LocalStorageManager.getLeaderboard();
      setLeaderboard(data);
      setLoading(false);
    };
    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-6 text-white">
        Loading leaderboard…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-black bg-opacity-80 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">
        🏆 Leaderboard
      </h2>

      {leaderboard.length === 0 ? (
        <p className="text-gray-400 text-center">No players yet</p>
      ) : (
        <ul className="space-y-2">
          {leaderboard.map((player, index) => (
            <li
              key={player.id}
              className="flex justify-between bg-gray-800 rounded p-3 text-white"
            >
              <span>
                <strong>{index + 1}.</strong>{" "}
                {player.displayName ||
                  player.username ||
                  player.email ||
                  "Anonymous"}
              </span>
              <span className="text-green-400 font-bold">
                {player.points} pts
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
