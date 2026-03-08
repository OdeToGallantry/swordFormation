import { useEffect, useRef, useState } from 'react';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

export type GestureState = {
  gestureName: string;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  z: number; // Normalized 0-1 (depth approximation)
};

export function useGestureRecognizer(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [gestureState, setGestureState] = useState<GestureState | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const initRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        
        if (!active) return;

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });

        if (!active) return;
        
        recognizerRef.current = recognizer;
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to initialize gesture recognizer:", error);
      }
    };

    initRecognizer();

    return () => {
      active = false;
      if (recognizerRef.current) {
        recognizerRef.current.close();
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !videoRef.current) return;

    const video = videoRef.current;
    let lastVideoTime = -1;

    const predict = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA && recognizerRef.current) {
        const startTimeMs = performance.now();
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const results = recognizerRef.current.recognizeForVideo(video, startTimeMs);
          
          if (results.gestures.length > 0 && results.landmarks.length > 0) {
            const gesture = results.gestures[0][0].categoryName;
            const landmarks = results.landmarks[0];
            
            // Use the wrist (0) or middle finger mcp (9) as the center
            const center = landmarks[9];
            
            setGestureState({
              gestureName: gesture,
              x: center.x,
              y: center.y,
              z: center.z,
            });
          } else {
            setGestureState(prev => prev ? { ...prev, gestureName: 'None' } : null);
          }
        }
      }
      requestRef.current = requestAnimationFrame(predict);
    };

    video.addEventListener('loadeddata', predict);
    
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      predict();
    }

    return () => {
      video.removeEventListener('loadeddata', predict);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isLoaded, videoRef]);

  return { gestureState, isLoaded };
}
