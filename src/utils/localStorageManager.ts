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
