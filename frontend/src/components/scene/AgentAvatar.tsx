import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface AgentAvatarProps {
  name: string;
  position: [number, number, number];
  color: string;
  isSpeaking: boolean;
  isActive: boolean;
}

export function AgentAvatar({ name, position, color, isSpeaking, isActive }: AgentAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
    if (mouthRef.current) {
      const scale = isSpeaking
        ? 1 + Math.sin(state.clock.elapsedTime * 12) * 0.3 + Math.sin(state.clock.elapsedTime * 8) * 0.2
        : 1;
      mouthRef.current.scale.y = Math.max(0.5, scale);
    }
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={bodyRef} position={[0, 0, 0]}>
        <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#f0d0b0" />
      </mesh>
      <mesh position={[-0.07, 0.78, 0.18]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.07, 0.78, 0.18]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh ref={mouthRef} position={[0, 0.68, 0.19]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#c44" />
      </mesh>
      <Text
        position={[0, 1.15, 0]}
        fontSize={0.12}
        color={isActive ? '#3b82f6' : '#666'}
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
      {isActive && (
        <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}
