import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Sword({ position, rotation, scale = 1, color = '#a0a0a0' }: any) {
  const groupRef = useRef<THREE.Group>(null);

  // Optional: add some idle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 3 + (position?.[0] || 0)) * 0.002;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Blade Core */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.15, 3, 0.02]} />
        <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={0.5} metalness={1} roughness={0} />
      </mesh>
      {/* Blade Edge */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.22, 2.9, 0.01]} />
        <meshStandardMaterial color="#00ffcc" transparent opacity={0.4} emissive="#00ffcc" emissiveIntensity={1} />
      </mesh>
      {/* Guard */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 0.2, 0.1]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      {/* Pommel */}
      <mesh position={[0, -1, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
