import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sword } from './Sword';
import { Sparkles } from '@react-three/drei';

type SwordArrayProps = {
  gesture: string;
  targetPosition: THREE.Vector3;
};

export function SwordArray({ gesture, targetPosition }: SwordArrayProps) {
  const groupRef = useRef<THREE.Group>(null);
  const numSwords = 36; // Increased from 12 to 36

  // Create refs for each sword to animate them individually
  const swordRefs = useMemo(() => Array.from({ length: numSwords }).map(() => React.createRef<THREE.Group>()), [numSwords]);

  const targetPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const rotations: THREE.Euler[] = [];

    for (let i = 0; i < numSwords; i++) {
      positions.push(new THREE.Vector3());
      rotations.push(new THREE.Euler());
    }
    return { positions, rotations };
  }, [numSwords]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smoothly move the entire array to the target position (hand position)
    groupRef.current.position.lerp(targetPosition, 4 * delta);

    const time = state.clock.elapsedTime;

    // Calculate target positions for each sword based on gesture
    for (let i = 0; i < numSwords; i++) {
      const targetPos = targetPositions.positions[i];
      const targetRot = targetPositions.rotations[i];
      const angle = (i / numSwords) * Math.PI * 2;
      
      // Layer indices for multi-layered arrays
      const layer = i % 3;
      const layerRadius = 2 + layer * 1.5;
      const layerAngle = angle + (layer * Math.PI / 6);

      switch (gesture) {
        case 'Open_Palm': // 环形阵 (Multi-layered rotating shield)
          targetPos.set(
            Math.cos(layerAngle + time * (1 + layer * 0.5)) * layerRadius,
            Math.sin(layerAngle + time * (1 + layer * 0.5)) * layerRadius,
            Math.sin(time * 2 + i) * 0.5
          );
          targetRot.set(0, 0, layerAngle + time * (1 + layer * 0.5) - Math.PI / 2);
          break;
          
        case 'Closed_Fist': // 剑轮阵 (A giant spinning wheel of swords, like a buzzsaw)
          const wheelRadius = 4;
          // All swords form a single large circle on the XY plane
          targetPos.set(
            Math.cos(angle + time * 5) * wheelRadius,
            Math.sin(angle + time * 5) * wheelRadius,
            0
          );
          // Swords point outwards from the center, spinning rapidly
          targetRot.set(0, 0, angle + time * 5 - Math.PI / 2);
          break;
          
        case 'Pointing_Up': // 柱形阵 (Towering pillar of swords)
          const heightOffset = (i - numSwords / 2) * 0.4;
          const pillarRadius = 1.5;
          targetPos.set(
            Math.cos(angle * 3 + time) * pillarRadius,
            heightOffset + Math.sin(time * 3 + i) * 0.2,
            Math.sin(angle * 3 + time) * pillarRadius
          );
          targetRot.set(0, -angle * 3 - time, 0);
          break;
          
        case 'Victory': // 剑翼阵 (Wings of swords spreading out behind)
          const isLeftWing = i % 2 === 0;
          const wingIndex = Math.floor(i / 2);
          const totalInWing = numSwords / 2;
          
          // Fan out shape
          const wingSpread = (wingIndex / totalInWing) * Math.PI * 0.6; // 0 to ~108 degrees
          const wingRadius = 1 + wingIndex * 0.3;
          
          // Base angle: left wing goes left-up, right wing goes right-up
          const baseAngle = isLeftWing ? Math.PI - wingSpread : wingSpread;
          
          // Flapping animation
          const flap = Math.sin(time * 3) * 0.2;
          const flapAngle = isLeftWing ? baseAngle + flap : baseAngle - flap;
          
          targetPos.set(
            Math.cos(flapAngle) * wingRadius,
            Math.sin(flapAngle) * wingRadius + 1, // Shift up slightly
            -wingIndex * 0.2 // Sweep back slightly
          );
          
          // Point outwards along the wing curve
          targetRot.set(0, 0, flapAngle - Math.PI / 2);
          break;
          
        case 'Thumb_Up': // 龙卷阵 (Tornado)
          const tornadoHeight = (i / numSwords) * 10 - 5;
          const tornadoRadius = 1 + (i / numSwords) * 3;
          const tornadoAngle = angle * 5 - time * 8;
          targetPos.set(
            Math.cos(tornadoAngle) * tornadoRadius,
            tornadoHeight,
            Math.sin(tornadoAngle) * tornadoRadius
          );
          targetRot.set(Math.PI / 4, tornadoAngle, 0);
          break;
          
        case 'Thumb_Down': // 剑雨阵 (Raining swords from above)
          const gridX = (i % 6) * 1.5 - 3.75;
          const gridZ = Math.floor(i / 6) * 1.5 - 3.75;
          // Animate falling
          const fallY = 10 - ((time * 15 + i) % 20);
          targetPos.set(gridX, fallY, gridZ);
          targetRot.set(Math.PI, time * 5, 0);
          break;
          
        case 'ILoveYou': // 球形阵 (Spherical chaos)
          const phi = Math.acos(-1 + (2 * i) / numSwords);
          const theta = Math.sqrt(numSwords * Math.PI) * phi;
          const sphereRadius = 4 + Math.sin(time * 2 + i) * 1;
          
          targetPos.set(
            sphereRadius * Math.cos(theta + time) * Math.sin(phi),
            sphereRadius * Math.sin(theta + time) * Math.sin(phi),
            sphereRadius * Math.cos(phi)
          );
          // Point outwards from center
          targetRot.set(phi, theta + time, 0);
          break;
          
        default: // 待机状态 (Idle floating ring)
          targetPos.set(
            Math.cos(angle) * 5,
            Math.sin(time * 2 + i * 0.5) * 0.8,
            Math.sin(angle) * 5
          );
          targetRot.set(Math.sin(time + i) * 0.2, -angle, 0);
          break;
      }

      // Apply lerp to each sword
      const sword = swordRefs[i].current;
      if (sword) {
        // Faster lerp for more snappy formations
        sword.position.lerp(targetPos, 10 * delta);
        
        // Slerp rotation
        const currentQuat = sword.quaternion;
        const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
        currentQuat.slerp(targetQuat, 10 * delta);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: numSwords }).map((_, i) => (
        <group key={i} ref={swordRefs[i]}>
          <Sword scale={0.4} />
          {/* Only add sparkles to some swords to save performance */}
          {i % 3 === 0 && (
            <Sparkles count={15} scale={1.5} size={1.5} speed={0.6} opacity={0.8} color="#00ffcc" />
          )}
        </group>
      ))}
    </group>
  );
}
