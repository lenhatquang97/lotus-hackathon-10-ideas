'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Room } from './Room';
import { AgentAvatar } from './AgentAvatar';
import type { AgentPersona, Environment } from '@/lib/types';

const agentColors = ['#4a90d9', '#d94a4a', '#4ad97e', '#d9a84a'];

const agentPositions: Record<number, [number, number, number][]> = {
  1: [[0, 0, -2]],
  2: [[-0.8, 0, -2], [0.8, 0, -2]],
  3: [[-1.2, 0, -2], [0, 0, -2.5], [1.2, 0, -2]],
};

interface Scene3DProps {
  environment: Environment;
  agents: AgentPersona[];
  activeAgentId: string;
  isSpeaking: boolean;
}

function SceneContent({ environment, agents, activeAgentId, isSpeaking }: Scene3DProps) {
  const positions = agentPositions[agents.length] || agentPositions[3];

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 3, 0]} intensity={0.3} />

      <Room environment={environment} />

      {agents.map((agent, i) => (
        <AgentAvatar
          key={agent.id}
          name={agent.name}
          position={positions[i] || [0, 0, -2]}
          color={agentColors[i % agentColors.length]}
          isSpeaking={isSpeaking && agent.id === activeAgentId}
          isActive={agent.id === activeAgentId}
        />
      ))}

      <OrbitControls
        target={[0, 0.5, -1.5]}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 6}
        maxDistance={5}
        minDistance={2}
        enablePan={false}
      />
    </>
  );
}

export function Scene3D(props: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 1.5], fov: 60 }}
      shadows
      className="w-full h-full"
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
