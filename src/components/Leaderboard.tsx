import React, { useState, useEffect } from "react";
import LocalStorageManager from "../utils/localStorageManager";

interface UserData {
  id: string;
  points: number;
  email?: string;
  displayName?: string;
  username?: string;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  // Local user ID for highlighting current user
  const currentUserId = "local-user";

  useEffect(() => {
    const fetchLeaderboard = () => {
      try {
        // Use local storage manager to get leaderboard data
        const leaderboardData = LocalStorageManager.getLeaderboard();
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        // Don't show error to user, just show empty leaderboard
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🏆 Leaderboard
      </h2>
      <div className="bg-black bg-opacity-80 rounded-lg p-6 backdrop-blur-sm">
        {leaderboard.length === 0 ? (
          <p className="text-gray-400 text-center">
            No players yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  player.id === currentUserId
                    ? "bg-green-900 bg-opacity-50 border border-green-500"
                    : "bg-gray-800 bg-opacity-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-yellow-400 w-8">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {player.displayName ||
                        player.username ||
                        player.email ||
                        "Anonymous"}
                      {player.id === currentUserId && " (You)"}
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-400">
                  {player.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
