/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface AuthContextType {
  user: any;
  login: () => void;
  signup: () => void;
  logout: () => void;
  loading: boolean;
  updateUserPoints: (points: number) => void;
  addUserGuess: (guess: {
    stationName: string;
    stationCountry: string;
    guessedCountry: string;
    isCorrect: boolean;
    timestamp: Date;
  }) => void;
  getUserPoints: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerkAuth();

  // Create user document in Firestore when user signs up/in
  useEffect(() => {
    const createUserDocument = async () => {
      if (user && isLoaded) {
        try {
          const userDocRef = doc(db, "users", user.id);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // Create new user document
            await setDoc(userDocRef, {
              points: 0,
              guesses: [],
              email: user.primaryEmailAddress?.emailAddress,
              displayName:
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username || user.primaryEmailAddress?.emailAddress,
              username: user.username,
              createdAt: new Date(),
            });
            console.log("Created user document for:", user.id);
          }
        } catch (error) {
          console.error("Error creating user document:", error);
        }
      }
    };

    createUserDocument();
  }, [user, isLoaded]);

  const login = () => {
    // Clerk handles this with SignIn component
  };

  const signup = () => {
    // Clerk handles this with SignUp component
  };
  const logout = async () => {
    await signOut();
  };

  const updateUserPoints = async (points: number) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.id);

      await updateDoc(userDocRef, { points });
    } catch (error) {
      console.error("Error updating points:", error);
    }
  };

  const addUserGuess = async (guess: {
    stationName: string;

    stationCountry: string;

    guessedCountry: string;

    isCorrect: boolean;

    timestamp: Date;
  }) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.id);

      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const currentGuesses = userDoc.data().guesses || [];

        await updateDoc(userDocRef, { guesses: [...currentGuesses, guess] });
      }
    } catch (error) {
      console.error("Error adding guess:", error);
    }
  };

  const getUserPoints = async (): Promise<number> => {
    if (!user) return 0;

    try {
      const userDocRef = doc(db, "users", user.id);

      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data().points || 0;
      }

      return 0;
    } catch (error) {
      console.error("Error getting user points:", error);

      return 0;
    }
  };
  const value = {
    user,
    login,
    signup,
    logout,
    loading: !isLoaded,
    updateUserPoints,
    addUserGuess,
    getUserPoints,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
