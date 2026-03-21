'use client';

import type { Environment } from '@/lib/types';

const envConfigs: Record<Environment, {
  floorColor: string;
  wallColor: string;
  ambientColor: string;
}> = {
  office: { floorColor: '#8b8b8b', wallColor: '#e8e4df', ambientColor: '#f5f0eb' },
  cafe: { floorColor: '#8b6f4e', wallColor: '#f5e6d3', ambientColor: '#fff5e6' },
  interview: { floorColor: '#6b6b6b', wallColor: '#e0e0e0', ambientColor: '#f0f0f0' },
  apartment: { floorColor: '#a0845c', wallColor: '#faf3e8', ambientColor: '#fff8f0' },
};

export function Room({ environment }: { environment: Environment }) {
  const config = envConfigs[environment];

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={config.floorColor} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 1.5, -4]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color={config.wallColor} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-4, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color={config.wallColor} side={2} />
      </mesh>

      {/* Right wall */}
      <mesh position={[4, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color={config.wallColor} side={2} />
      </mesh>

      {/* Table */}
      <mesh position={[0, 0.15, -1]} castShadow>
        <boxGeometry args={[2.5, 0.08, 1]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      {/* Table legs */}
      {[[-1.1, -0.2, -0.4], [1.1, -0.2, -0.4], [-1.1, -0.2, -1.5], [1.1, -0.2, -1.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.7]} />
          <meshStandardMaterial color="#3d2b1f" />
        </mesh>
      ))}

      {/* Ambient decor based on environment */}
      {environment === 'office' && (
        <>
          {/* Whiteboard on back wall */}
          <mesh position={[0, 2, -3.95]}>
            <boxGeometry args={[2, 1.2, 0.05]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, 2, -3.92]}>
            <boxGeometry args={[1.9, 1.1, 0.02]} />
            <meshStandardMaterial color="#f8f8f8" />
          </mesh>
        </>
      )}

      {environment === 'cafe' && (
        <>
          {/* Counter in background */}
          <mesh position={[-2.5, 0.3, -3]}>
            <boxGeometry args={[2, 1.2, 0.5]} />
            <meshStandardMaterial color="#6b4226" />
          </mesh>
        </>
      )}
    </group>
  );
}
