/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";
import { TextureLoader } from "three";

type SplashScreenProps = {
  onStart: () => void;
  stationCount: number;
};

export default function SplashScreen({
  onStart,
  stationCount,
}: SplashScreenProps) {
  // Load Earth texture
  const earthTexture = useLoader(
    TextureLoader,
    "https://upload.wikimedia.org/wikipedia/commons/0/04/Solarsystemscope_texture_8k_earth_daymap.jpg"
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Splash Screen */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 z-10"></div>

      {/* 3D Earth in background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight intensity={0.5} position={[5, 5, 5]} />
          <Sphere args={[3, 64, 64]}>
            <meshStandardMaterial
              map={earthTexture}
              emissive="#1a1a2e"
              emissiveIntensity={0.3}
            />
          </Sphere>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={true}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Splash Content */}
      <div className="relative z-20 text-center px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-clip-text bg-gradient-to-r from-white to-gray-300">
          🌍 Radio Globe
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Explore thousands of radio stations from around the world
        </p>
        <button
          onClick={onStart}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/30"
        >
          Start Exploring
        </button>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-10 text-gray-400 text-sm z-20">
        🎵 {stationCount} stations loaded
      </div>
    </div>
  );
}
