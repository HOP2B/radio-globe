// Local Storage Manager - Replaces Firebase functionality
// Provides a simple interface for storing and retrieving user data locally

interface UserData {
  id: string;
  points: number;
  email?: string;
  displayName?: string;
  username?: string;
  guesses: Array<{
    stationName: string;
    stationCountry: string;
    guessedCountry: string;
    isCorrect: boolean;
    timestamp: Date;
  }>;
}

interface LeaderboardEntry {
  id: string;
  points: number;
  email?: string;
  displayName?: string;
  username?: string;
}

export const LocalStorageManager = {
  // User data storage key
  USER_DATA_KEY: "radioGlobeUserData",

  // Leaderboard data storage key
  LEADERBOARD_KEY: "radioGlobeLeaderboard",

  /**
   * Get user data from local storage
   */
  getUserData(userId: string): UserData | null {
    try {
      const allUsersData = localStorage.getItem(this.USER_DATA_KEY);
      if (!allUsersData) return null;

      const users = JSON.parse(allUsersData) as Record<string, UserData>;
      return users[userId] || null;
    } catch (error) {
      console.error("Error reading user data:", error);
      return null;
    }
  },

  /**
   * Save user data to local storage
   */
  saveUserData(userId: string, userData: Partial<UserData>) {
    try {
      const allUsersData = localStorage.getItem(this.USER_DATA_KEY);
      const users = allUsersData ? JSON.parse(allUsersData) : {};

      // Merge with existing data
      const existingUser = users[userId] || {
        id: userId,
        points: 0,
        guesses: [],
      };
      users[userId] = { ...existingUser, ...userData };

      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  },

  /**
   * Initialize user if they don't exist
   */
  initializeUser(userId: string): UserData {
    const existingUser = this.getUserData(userId);
    if (existingUser) return existingUser;

    const newUser: UserData = {
      id: userId,
      points: 0,
      guesses: [],
    };

    this.saveUserData(userId, newUser);
    return newUser;
  },

  /**
   * Get leaderboard data
   */
  getLeaderboard(): LeaderboardEntry[] {
    try {
      // Try to get cached leaderboard first
      const cachedLeaderboard = localStorage.getItem(this.LEADERBOARD_KEY);
      if (cachedLeaderboard) {
        return JSON.parse(cachedLeaderboard);
      }

      // Fallback: generate leaderboard from user data
      const allUsersData = localStorage.getItem(this.USER_DATA_KEY);
      if (!allUsersData) return [];

      const users = JSON.parse(allUsersData) as Record<string, UserData>;

      return Object.values(users)
        .map((user) => ({
          id: user.id,
          points: user.points,
          // Add some mock display info for better UX
          displayName: `Player ${user.id.substring(0, 6)}`,
          username: user.id.substring(0, 8),
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  },

  /**
   * Update leaderboard (simulate what would happen with real backend)
   */
  updateLeaderboard(
    userId: string,
    points: number,
    userInfo?: { email?: string; displayName?: string; username?: string }
  ) {
    try {
      const leaderboard = this.getLeaderboard();
      const existingEntry = leaderboard.find((entry) => entry.id === userId);

      if (existingEntry) {
        existingEntry.points = points;
        // Update user info if provided
        if (userInfo) {
          existingEntry.email = userInfo.email || existingEntry.email;
          existingEntry.displayName =
            userInfo.displayName || existingEntry.displayName;
          existingEntry.username = userInfo.username || existingEntry.username;
        }
      } else {
        leaderboard.push({
          id: userId,
          points,
          email: userInfo?.email,
          displayName:
            userInfo?.displayName || `Player ${userId.substring(0, 6)}`,
          username: userInfo?.username || userId.substring(0, 8),
        });
      }

      // Sort and keep top 10
      const updatedLeaderboard = leaderboard
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);

      localStorage.setItem(
        this.LEADERBOARD_KEY,
        JSON.stringify(updatedLeaderboard)
      );
    } catch (error) {
      console.error("Error updating leaderboard:", error);
    }
  },

  /**
   * Add a guess to user's guess history
   */
  addGuess(
    userId: string,
    guess: {
      stationName: string;
      stationCountry: string;
      guessedCountry: string;
      isCorrect: boolean;
      timestamp: Date;
    }
  ) {
    const userData = this.getUserData(userId);
    if (!userData) {
      const newUser = this.initializeUser(userId);
      newUser.guesses.push(guess);
      this.saveUserData(userId, newUser);
    } else {
      userData.guesses.push(guess);
      this.saveUserData(userId, userData);
    }
  },
};

export default LocalStorageManager;
