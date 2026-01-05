import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useTheme } from "../hooks/useTheme";
import { useNavigate } from "react-router-dom";
import LocalStorageManager from "../utils/localStorageManager";
import {
  ACHIEVEMENTS,
  getUnlockedAchievements,
  getAchievementRarityColor,
  type UserStats as AchievementUserStats,
  type Achievement,
} from "../utils/achievements";

interface Guess {
  stationName: string;
  stationCountry: string;
  guessedCountry: string;
  isCorrect: boolean;
  timestamp: Date;
}

interface UserStats {
  points: number;
  totalGuesses: number;
  correctGuesses: number;
  streakRecord: number;
  favoriteCountry: string;
  joinDate: string;
}

export default function Profile() {
  const { user } = useUser();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    Achievement[]
  >([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return;

      try {
        const userData = await LocalStorageManager.getUserData(user.id);

        if (userData) {
          const guesses = userData.guesses || [];
          // Calculate stats from guesses
          const totalGuesses = guesses.length;
          const correctGuesses = guesses.filter(
            (g: Guess) => g.isCorrect
          ).length;

          // Calculate streak record by finding consecutive correct guesses
          let currentStreak = 0;
          let maxStreak = 0;
          guesses.forEach((g: Guess) => {
            if (g.isCorrect) {
              currentStreak++;
              maxStreak = Math.max(maxStreak, currentStreak);
            } else {
              currentStreak = 0;
            }
          });

          // Find favorite country from correct guesses
          const countryCounts: { [key: string]: number } = {};
          guesses
            .filter((g: Guess) => g.isCorrect)
            .forEach((g: Guess) => {
              countryCounts[g.stationCountry] =
                (countryCounts[g.stationCountry] || 0) + 1;
            });
          const favoriteCountry =
            Object.entries(countryCounts).sort(
              ([, a], [, b]) => b - a
            )[0]?.[0] || "None";

          const achievementStats: AchievementUserStats = {
            points: userData.points || 0,
            totalGuesses,
            correctGuesses,
            streakRecord: maxStreak,
            favoriteCountry,
            joinDate: new Date().toISOString().split("T")[0],
          };

          setStats(achievementStats);
          setUnlockedAchievements(getUnlockedAchievements(achievementStats));

          // Set follow data (for own profile, these are just counts)
          setFollowerCount(userData.followers?.length || 0);
          setFollowingCount(userData.following?.length || 0);
        }
      } catch (error) {
        console.error("Error loading user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserStats();
  }, [user?.id]);

  if (loading) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mb-4"></div>
        <h1>Loading profile...</h1>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: theme === "light" ? "#f8fafc" : "black",
        color: theme === "light" ? "#1f2937" : "white",
        padding: "20px",
        overflow: "auto",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
          background:
            theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
          border:
            theme === "light"
              ? "1px solid rgba(0,0,0,0.1)"
              : "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          padding: "8px 12px",
          color: theme === "light" ? "#1f2937" : "white",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            theme === "light" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        ← Back to Home
      </button>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "40px",
          padding: "20px",
          background:
            theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
          borderRadius: "12px",
          backdropFilter: "blur(10px)",
          border:
            theme === "light"
              ? "1px solid rgba(0,0,0,0.1)"
              : "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          {user?.firstName?.[0] || user?.username?.[0] || "?"}
        </div>

        {/* User Info */}
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              margin: "0 0 8px 0",
              color: theme === "light" ? "#1f2937" : "#1DB954",
            }}
          >
            {user?.fullName || user?.username || "Anonymous User"}
          </h1>
          <p
            style={{
              fontSize: "16px",
              margin: "0",
              opacity: 0.8,
            }}
          >
            {user?.primaryEmailAddress?.emailAddress}
          </p>
          <p
            style={{
              fontSize: "14px",
              margin: "4px 0 0 0",
              opacity: 0.6,
            }}
          >
            Member since {stats?.joinDate}
          </p>
        </div>

        {/* Follow Stats */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "20px", fontSize: "14px" }}>
            <span>
              <strong>{followerCount}</strong> Followers
            </span>
            <span>
              <strong>{followingCount}</strong> Following
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {/* Points */}
        <div
          style={{
            padding: "24px",
            background:
              theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
            border:
              theme === "light"
                ? "1px solid rgba(0,0,0,0.1)"
                : "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🏆</div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#1DB954",
              marginBottom: "4px",
            }}
          >
            {stats?.points || 0}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>Total Points</div>
        </div>

        {/* Accuracy */}
        <div
          style={{
            padding: "24px",
            background:
              theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
            border:
              theme === "light"
                ? "1px solid rgba(0,0,0,0.1)"
                : "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎯</div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#1DB954",
              marginBottom: "4px",
            }}
          >
            {stats?.totalGuesses
              ? Math.round((stats.correctGuesses / stats.totalGuesses) * 100)
              : 0}
            %
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>
            Accuracy ({stats?.correctGuesses || 0}/{stats?.totalGuesses || 0})
          </div>
        </div>

        {/* Streak Record */}
        <div
          style={{
            padding: "24px",
            background:
              theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
            border:
              theme === "light"
                ? "1px solid rgba(0,0,0,0.1)"
                : "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🔥</div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#1DB954",
              marginBottom: "4px",
            }}
          >
            {stats?.streakRecord || 0}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>Best Streak</div>
        </div>

        {/* Favorite Country */}
        <div
          style={{
            padding: "24px",
            background:
              theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
            border:
              theme === "light"
                ? "1px solid rgba(0,0,0,0.1)"
                : "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🌍</div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1DB954",
              marginBottom: "4px",
            }}
          >
            {stats?.favoriteCountry || "None"}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>Favorite Country</div>
        </div>
      </div>

      {/* Achievements */}
      <div
        style={{
          padding: "24px",
          background:
            theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
          borderRadius: "12px",
          backdropFilter: "blur(10px)",
          border:
            theme === "light"
              ? "1px solid rgba(0,0,0,0.1)"
              : "1px solid rgba(255,255,255,0.1)",
          marginBottom: "40px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            margin: "0 0 20px 0",
            color: theme === "light" ? "#1f2937" : "#1DB954",
          }}
        >
          🏆 Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedAchievements.some(
              (a) => a.id === achievement.id
            );
            return (
              <div
                key={achievement.id}
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  background: isUnlocked
                    ? `linear-gradient(135deg, ${getAchievementRarityColor(
                        achievement.rarity
                      )}20, ${getAchievementRarityColor(achievement.rarity)}40)`
                    : theme === "light"
                    ? "rgba(0,0,0,0.05)"
                    : "rgba(255,255,255,0.05)",
                  border: `2px solid ${
                    isUnlocked
                      ? getAchievementRarityColor(achievement.rarity)
                      : "rgba(255,255,255,0.2)"
                  }`,
                  opacity: isUnlocked ? 1 : 0.6,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                  {isUnlocked ? achievement.icon : "🔒"}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "4px",
                    color: isUnlocked
                      ? getAchievementRarityColor(achievement.rarity)
                      : undefined,
                  }}
                >
                  {achievement.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.8,
                    lineHeight: "1.4",
                  }}
                >
                  {achievement.description}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    marginTop: "8px",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                    color: getAchievementRarityColor(achievement.rarity),
                  }}
                >
                  {achievement.rarity}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        style={{
          padding: "24px",
          background:
            theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
          borderRadius: "12px",
          backdropFilter: "blur(10px)",
          border:
            theme === "light"
              ? "1px solid rgba(0,0,0,0.1)"
              : "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            margin: "0 0 20px 0",
            color: theme === "light" ? "#1f2937" : "#1DB954",
          }}
        >
          Recent Activity
        </h2>
        <div style={{ opacity: 0.7, fontStyle: "italic" }}>
          Activity tracking coming soon...
        </div>
      </div>
    </div>
  );
}
