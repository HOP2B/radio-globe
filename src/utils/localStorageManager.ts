// Firestore Manager - Replaces localStorage functionality
// Provides a permanent storage interface using Firebase Firestore

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

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
  /**
   * Get user data from Firestore
   */
  async getUserData(userId: string): Promise<UserData | null> {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserData;
      }
      return null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  },

  /**
   * Save user data to Firestore
   */
  async saveUserData(userId: string, userData: Partial<UserData>) {
    try {
      const docRef = doc(db, "users", userId);
      const existing = await getDoc(docRef);
      // Filter out undefined values
      const cleanData = Object.fromEntries(
        Object.entries(userData).filter(([, v]) => v !== undefined)
      );
      if (existing.exists()) {
        await updateDoc(docRef, cleanData);
      } else {
        await setDoc(docRef, { ...cleanData, id: userId });
      }
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  },

  /**
   * Initialize user if they don't exist
   */
  async initializeUser(userId: string): Promise<UserData> {
    const existing = await this.getUserData(userId);
    if (existing) return existing;

    const newUser: UserData = {
      id: userId,
      points: 0,
      guesses: [],
    };

    await this.saveUserData(userId, newUser);
    return newUser;
  },

  /**
   * Get leaderboard data from Firestore
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(db, "users"),
        orderBy("points", "desc"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        points: doc.data().points || 0,
        email: doc.data().email,
        displayName: doc.data().displayName,
        username: doc.data().username,
      }));
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  },

  /**
   * Update leaderboard (update user data)
   */
  async updateLeaderboard(
    userId: string,
    points: number,
    userInfo?: { email?: string; displayName?: string; username?: string }
  ) {
    await this.saveUserData(userId, { points, ...userInfo });
  },

  /**
   * Add a guess to user's guess history
   */
  async addGuess(
    userId: string,
    guess: {
      stationName: string;
      stationCountry: string;
      guessedCountry: string;
      isCorrect: boolean;
      timestamp: Date;
    }
  ) {
    const userData = await this.getUserData(userId);
    if (!userData) {
      const newUser = await this.initializeUser(userId);
      newUser.guesses.push(guess);
      await this.saveUserData(userId, newUser);
    } else {
      userData.guesses.push(guess);
      await this.saveUserData(userId, userData);
    }
  },

  /**
   * Reset all user points to 0
   */
  async resetAllPoints() {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      const promises = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { points: 0 })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Error resetting points:", error);
    }
  },
};

export default LocalStorageManager;
