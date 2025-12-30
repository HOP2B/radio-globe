import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";

export default function Header() {
  const { user } = useUser();

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-black bg-opacity-80 backdrop-blur-md p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-xl font-bold">Radio Globe</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <UserButton />
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
