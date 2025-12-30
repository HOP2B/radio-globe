import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import App from "./App.tsx";
import Login from "./components/Auth/Login.tsx";
import Signup from "./components/Auth/Signup.tsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/sign-in" element={<Login />} />
          <Route path="/sign-up" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
