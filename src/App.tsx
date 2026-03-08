import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGestureRecognizer } from './useGestureRecognizer';
import { SwordArray } from './components/SwordArray';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { gestureState, isLoaded } = useGestureRecognizer(videoRef);
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(0, 0, 0));

  // Start webcam
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.error('Error accessing webcam:', err);
        });
    }
  }, []);

  // Update target position based on gesture state
  useEffect(() => {
    if (gestureState) {
      // Map normalized coordinates (0-1) to 3D space
      // MediaPipe x is 0 at left, 1 at right. We need to invert x because webcam is mirrored.
      const x = (0.5 - gestureState.x) * 20;
      const y = (0.5 - gestureState.y) * 15;
      // Z depth is tricky, we can use a fixed depth or map it slightly
      const z = gestureState.z * -15; 
      
      setTargetPosition(new THREE.Vector3(x, y, z));
    }
  }, [gestureState]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      {/* Webcam Feed (Hidden) */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 text-white font-sans pointer-events-none">
        <h1 className="text-3xl font-bold tracking-tight mb-2 drop-shadow-md text-emerald-400">剑阵控制系统</h1>
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-emerald-500/20 shadow-2xl">
          <p className="text-sm text-slate-300 mb-2">系统状态: {isLoaded ? <span className="text-emerald-400 font-medium">已就绪</span> : <span className="text-amber-400 font-medium animate-pulse">加载模型中...</span>}</p>
          <p className="text-sm text-slate-300">
            当前手势: <span className="font-mono text-emerald-300 bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-500/30">{gestureState?.gestureName || '无'}</span>
          </p>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas className="w-full h-full">
        <color attach="background" args={['#050510']} />
        <fog attach="fog" args={['#050510', 10, 50]} />
        <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={50} />
        
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={2} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#00ffcc" />
        
        {/* Background Effects */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={30} size={2} speed={0.2} opacity={0.2} color="#00ffcc" />
        
        <SwordArray 
          gesture={gestureState?.gestureName || 'None'} 
          targetPosition={targetPosition} 
        />
        
        <Environment preset="night" />
        <OrbitControls enableZoom={false} enablePan={false} />
        
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={2.0} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
