/* eslint-disable no-empty-pattern */
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { RadioStation } from "../api/radio";

interface EarthProps {
  radios: RadioStation[];
}

const EarthMesh = () => {
  const earthRef = useRef<THREE.Mesh>(null!);
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load(
    "https://upload.wikimedia.org/wikipedia/commons/0/04/Solarsystemscope_texture_8k_earth_daymap.jpg"
  );

  useFrame(() => {
    earthRef.current.rotation.y += 0.001;
  });

  return (
    <mesh ref={earthRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1.2, 64, 64]} />
      <meshStandardMaterial map={earthTexture} />
    </mesh>
  );
};

export default function Earth({}: EarthProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      style={{ width: "100vw", height: "100vh", background: "#000000" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} />

      <Stars radius={100} depth={50} count={5000} factor={4} fade />

      <EarthMesh />
      {/* TODO: Add markers here later */}

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        maxDistance={10}
        minDistance={2}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
      />
    </Canvas>
  );
}
