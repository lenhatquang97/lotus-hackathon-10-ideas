import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Room } from './Room';
import { AgentAvatar } from './AgentAvatar';

const agentColors = ['#4a90d9', '#d94a4a', '#4ad97e', '#d9a84a'];

const agentPositions: Record<number, [number, number, number][]> = {
  1: [[0, 0, -2]],
  2: [[-0.8, 0, -2], [0.8, 0, -2]],
  3: [[-1.2, 0, -2], [0, 0, -2.5], [1.2, 0, -2]],
};

interface Character {
  id: string;
  name: string;
  role: string;
}

interface Scene3DProps {
  environment?: string;
  characters: Character[];
  activeCharacterId?: string;
  isSpeaking: boolean;
}

function SceneContent({ environment = 'office', characters, activeCharacterId, isSpeaking }: Scene3DProps) {
  const count = Math.min(characters.length, 3);
  const positions = agentPositions[count] || agentPositions[3];

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 3, 0]} intensity={0.3} />
      <Room environment={environment} />
      {characters.slice(0, 3).map((char, i) => (
        <AgentAvatar
          key={char.id}
          name={char.name}
          position={positions[i] || [0, 0, -2]}
          color={agentColors[i % agentColors.length]}
          isSpeaking={isSpeaking && char.id === activeCharacterId}
          isActive={char.id === activeCharacterId}
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
    <Canvas camera={{ position: [0, 1.2, 1.5], fov: 60 }} shadows className="w-full h-full">
      <SceneContent {...props} />
    </Canvas>
  );
}
