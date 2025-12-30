import { SignIn } from "@clerk/clerk-react";

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        redirectUrl="/"
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: "#1DB954",
            colorBackground: "#000000",
            colorInputBackground: "#374151",
            colorInputText: "#ffffff",
            colorText: "#ffffff",
            borderRadius: "0.5rem",
          },
          elements: {
            formButtonPrimary: "bg-green-600 hover:bg-green-700",
            card: "bg-gray-900 border border-gray-700 shadow-2xl",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-300",
            formFieldLabel: "text-gray-300",
            formFieldInput:
              "bg-gray-800 border-gray-600 text-white focus:ring-green-500",
            footerActionLink: "text-green-400 hover:text-green-300",
            form: "space-y-4",
            formField: "space-y-2",
          },
        }}
      />
    </div>
  );
};

export default Login;
