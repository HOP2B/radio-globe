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

/* =======================
   Types
======================= */

interface Guess {
  stationName: string;
  stationCountry: string;
  guessedCountry: string;
  isCorrect: boolean;
  timestamp: Date;
}

interface UserData {
  id: string;
  points: number;
  email?: string;
  displayName?: string;
  username?: string;
  guesses: Guess[];
  followers?: string[]; // Array of user IDs
  following?: string[]; // Array of user IDs
  discoveredEasterEggs?: string[];
  totalGuesses?: number;
}

interface LeaderboardEntry {
  id: string;
  points: number;
  email?: string;
  displayName?: string;
  username?: string;
}

/* =======================
   Firestore Manager
======================= */

export const LocalStorageManager = {
  /* ---------- USER DATA ---------- */

  async getUserData(userId: string): Promise<UserData | null> {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();

      return {
        id: docSnap.id,
        points: data.points ?? 0,
        email: data.email,
        displayName: data.displayName,
        username: data.username,
        guesses: Array.isArray(data.guesses) ? data.guesses : [],
        followers: Array.isArray(data.followers) ? data.followers : [],
        following: Array.isArray(data.following) ? data.following : [],
        discoveredEasterEggs: Array.isArray(data.discoveredEasterEggs)
          ? data.discoveredEasterEggs
          : [],
        totalGuesses: data.totalGuesses ?? 0,
      };
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  },

  async saveUserData(userId: string, userData: Partial<UserData>) {
    try {
      const docRef = doc(db, "users", userId);
      const existing = await getDoc(docRef);

      const cleanData = Object.fromEntries(
        Object.entries(userData).filter(([, v]) => v !== undefined)
      );

      if (existing.exists()) {
        await updateDoc(docRef, cleanData);
      } else {
        await setDoc(docRef, {
          ...cleanData,
          id: userId,
          points: cleanData.points ?? 0,
          guesses: Array.isArray(cleanData.guesses) ? cleanData.guesses : [],
        });
      }
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  },

  async initializeUser(userId: string): Promise<UserData> {
    const existing = await this.getUserData(userId);

    if (existing) {
      return {
        ...existing,
        guesses: Array.isArray(existing.guesses) ? existing.guesses : [],
      };
    }

    const newUser: UserData = {
      id: userId,
      points: 0,
      guesses: [],
      followers: [],
      following: [],
      discoveredEasterEggs: [],
      totalGuesses: 0,
    };

    await this.saveUserData(userId, newUser);
    return newUser;
  },

  /* ---------- LEADERBOARD ---------- */

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(db, "users"),
        orderBy("points", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          points: data.points ?? 0,
          email: data.email,
          displayName: data.displayName,
          username: data.username,
        };
      });
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  },

  async updateLeaderboard(
    userId: string,
    points: number,
    userInfo?: { email?: string; displayName?: string; username?: string }
  ) {
    await this.saveUserData(userId, {
      points,
      ...userInfo,
    });
  },

  /* ---------- GUESSES ---------- */

  async addGuess(userId: string, guess: Guess) {
    try {
      const userData = await this.getUserData(userId);

      const guesses = Array.isArray(userData?.guesses) ? userData!.guesses : [];

      guesses.push(guess);

      await this.saveUserData(userId, { guesses });
    } catch (error) {
      console.error("Error adding guess:", error);
    }
  },

  /* ---------- FOLLOWING ---------- */

  async followUser(followerId: string, targetUserId: string) {
    try {
      // Add targetUserId to follower's following list
      const followerData = await this.getUserData(followerId);
      if (followerData && !followerData.following?.includes(targetUserId)) {
        const newFollowing = [...(followerData.following || []), targetUserId];
        await this.saveUserData(followerId, { following: newFollowing });
      }

      // Add followerId to target user's followers list
      const targetData = await this.getUserData(targetUserId);
      if (targetData && !targetData.followers?.includes(followerId)) {
        const newFollowers = [...(targetData.followers || []), followerId];
        await this.saveUserData(targetUserId, { followers: newFollowers });
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  },

  async unfollowUser(followerId: string, targetUserId: string) {
    try {
      // Remove targetUserId from follower's following list
      const followerData = await this.getUserData(followerId);
      if (followerData) {
        const newFollowing =
          followerData.following?.filter((id) => id !== targetUserId) || [];
        await this.saveUserData(followerId, { following: newFollowing });
      }

      // Remove followerId from target user's followers list
      const targetData = await this.getUserData(targetUserId);
      if (targetData) {
        const newFollowers =
          targetData.followers?.filter((id) => id !== followerId) || [];
        await this.saveUserData(targetUserId, { followers: newFollowers });
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  },

  async isFollowing(
    followerId: string,
    targetUserId: string
  ): Promise<boolean> {
    try {
      const followerData = await this.getUserData(followerId);
      return followerData?.following?.includes(targetUserId) || false;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  },

  /* ---------- ADMIN ---------- */

  async resetAllPoints() {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);

      await Promise.all(
        querySnapshot.docs.map((doc) => updateDoc(doc.ref, { points: 0 }))
      );
    } catch (error) {
      console.error("Error resetting points:", error);
    }
  },
};

export default LocalStorageManager;
