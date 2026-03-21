import { lazy, Suspense } from 'react';
import type { RoomManager } from '../../lib/room-manager';

const ThreeCanvas = lazy(() => import('../../components/world/ThreeCanvas'));

interface SceneCanvasProps {
  onReady: (room: RoomManager) => void;
  onError: (error: Error) => void;
  onProgress?: (stage: string, percent: number) => void;
}

export function SceneCanvas({ onReady, onError, onProgress }: SceneCanvasProps) {
  return (
    <div className="scene-canvas">
      <Suspense fallback={<div className="scene-placeholder" />}>
        <ThreeCanvas onReady={onReady} onError={onError} onProgress={onProgress} />
      </Suspense>
    </div>
  );
}
