import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export default function Header() {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-white dark:bg-black bg-opacity-80 backdrop-blur-md p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-black dark:text-white text-xl font-bold">
          Radio Globe
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-400" />
            )}
          </button>
          {user ? (
            <>
              <Link
                to="/profile"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
              >
                Profile
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton>
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                  Sign Up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
