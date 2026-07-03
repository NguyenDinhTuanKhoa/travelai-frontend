'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Torus, Cylinder, Sphere, Cone } from '@react-three/drei';
import * as THREE from 'three';

function AstroRobot({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  // Materials
  const whiteMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.1, metalness: 0.1, clearcoat: 1 });
  const blackMat = new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.2, metalness: 0.8 });
  const blueMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.3, metalness: 0.5 });
  const cyanGlowMat = new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#00ffff', emissiveIntensity: 2, toneMapped: false });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Gentle floating bob
      groupRef.current.position.y = Math.sin(t * 2) * 0.05;
    }

    if (headRef.current) {
      // Head looks around slowly, or follows mouse excitedly if hovered
      if (isHovered) {
        headRef.current.rotation.x = Math.sin(t * 10) * 0.05 - 0.1; // excited nod
        headRef.current.rotation.y = Math.sin(t * 5) * 0.1;
      } else {
        headRef.current.rotation.x = Math.sin(t * 1) * 0.05;
        headRef.current.rotation.y = Math.sin(t * 0.8) * 0.15;
      }
    }

    // Arms gentle swing
    if (leftArmRef.current && rightArmRef.current) {
      if (isHovered) {
        // Wave hands slightly
        leftArmRef.current.rotation.z = -0.5 + Math.sin(t * 8) * 0.1;
        rightArmRef.current.rotation.z = 0.5 + Math.sin(t * 8) * 0.2;
        rightArmRef.current.rotation.x = Math.sin(t * 8) * 0.2 - 0.2;
      } else {
        leftArmRef.current.rotation.z = -0.4 + Math.sin(t * 1.5) * 0.05;
        rightArmRef.current.rotation.z = 0.4 - Math.sin(t * 1.5) * 0.05;
        rightArmRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]} scale={1.2}>

      {/* HEAD GROUP */}
      <group ref={headRef} position={[0, 0.7, 0]}>
        {/* Head Base */}
        <RoundedBox args={[1.2, 1.0, 1.0]} radius={0.4} smoothness={4} material={whiteMat} />

        {/* Black Visor */}
        <RoundedBox args={[1.05, 0.75, 1.05]} radius={0.3} smoothness={4} material={blackMat} position={[0, 0, 0.05]} />

        {/* Cyan Eyes */}
        <Cylinder args={[0.15, 0.15, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]} position={[-0.25, 0.1, 0.55]} material={cyanGlowMat} />
        <Cylinder args={[0.15, 0.15, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0.25, 0.1, 0.55]} material={cyanGlowMat} />

        {/* Cyan Smile */}
        <Torus args={[0.15, 0.03, 16, 32, Math.PI]} rotation={[Math.PI, 0, 0]} position={[0, -0.15, 0.55]} material={cyanGlowMat} />

        {/* Left Earmuff */}
        <group position={[-0.65, 0, 0]}>
          <Cylinder args={[0.25, 0.25, 0.1, 32]} rotation={[0, 0, Math.PI / 2]} material={blueMat} />
          <Cylinder args={[0.15, 0.15, 0.12, 32]} rotation={[0, 0, Math.PI / 2]} material={cyanGlowMat} />
          {/* Horn */}
          <Cone args={[0.08, 0.4, 16]} position={[-0.05, 0.35, 0]} rotation={[0, 0, 0.3]} material={blueMat} />
        </group>

        {/* Right Earmuff */}
        <group position={[0.65, 0, 0]}>
          <Cylinder args={[0.25, 0.25, 0.1, 32]} rotation={[0, 0, Math.PI / 2]} material={blueMat} />
          <Cylinder args={[0.15, 0.15, 0.12, 32]} rotation={[0, 0, Math.PI / 2]} material={cyanGlowMat} />
          {/* Horn */}
          <Cone args={[0.08, 0.4, 16]} position={[0.05, 0.35, 0]} rotation={[0, 0, -0.3]} material={blueMat} />
        </group>
      </group>

      {/* NECK */}
      <Cylinder args={[0.15, 0.15, 0.2, 32]} position={[0, 0.1, 0]} material={blueMat} />

      {/* BODY */}
      <RoundedBox args={[1.2, 1.1, 0.9]} radius={0.4} smoothness={4} position={[0, -0.5, 0]} material={whiteMat} />

      {/* CHEST REACTOR */}
      <group position={[0, -0.4, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <Torus args={[0.2, 0.05, 16, 32]} material={blueMat} />
        <Cylinder args={[0.1, 0.1, 0.05, 32]} material={cyanGlowMat} />
      </group>

      {/* LEFT ARM */}
      <group ref={leftArmRef} position={[-0.65, -0.2, 0]}>
        <Sphere args={[0.18, 32, 32]} material={blueMat} />
        <Cylinder args={[0.12, 0.1, 0.6, 32]} position={[-0.1, -0.3, 0]} rotation={[0, 0, -0.2]} material={whiteMat} />
      </group>

      {/* RIGHT ARM */}
      <group ref={rightArmRef} position={[0.65, -0.2, 0]}>
        <Sphere args={[0.18, 32, 32]} material={blueMat} />
        <Cylinder args={[0.12, 0.1, 0.6, 32]} position={[0.1, -0.3, 0]} rotation={[0, 0, 0.2]} material={whiteMat} />
      </group>

      {/* SHADOW */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

    </group>
  );
}

export default function Robot3D() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="w-48 h-56 md:w-56 md:h-64"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, -0.2, 4.5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[5, 10, 5]} intensity={2.5} color="#ffffff" />
        <directionalLight position={[-5, 5, -5]} intensity={1.5} color="#e0f2fe" />

        {/* Fill light to make the white body pop */}
        <pointLight position={[0, 0, 3]} intensity={1} color="#ffffff" />

        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
          <AstroRobot isHovered={isHovered} />
        </Float>
      </Canvas>
    </div>
  );
}

