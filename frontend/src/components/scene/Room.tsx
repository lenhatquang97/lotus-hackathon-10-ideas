interface RoomProps {
  environment?: string;
}

const envConfigs: Record<string, { floorColor: string; wallColor: string }> = {
  office: { floorColor: '#8b8b8b', wallColor: '#e8e4df' },
  cafe: { floorColor: '#8b6f4e', wallColor: '#f5e6d3' },
  interview: { floorColor: '#6b6b6b', wallColor: '#e0e0e0' },
  apartment: { floorColor: '#a0845c', wallColor: '#faf3e8' },
  default: { floorColor: '#8b8b8b', wallColor: '#e8e4df' },
};

export function Room({ environment = 'office' }: RoomProps) {
  const config = envConfigs[environment] || envConfigs.default;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={config.floorColor} />
      </mesh>
      <mesh position={[0, 1.5, -4]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color={config.wallColor} />
      </mesh>
      <mesh position={[-4, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color={config.wallColor} side={2} />
      </mesh>
      <mesh position={[4, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color={config.wallColor} side={2} />
      </mesh>
      <mesh position={[0, 0.15, -1]} castShadow>
        <boxGeometry args={[2.5, 0.08, 1]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      {([[-1.1, -0.2, -0.4], [1.1, -0.2, -0.4], [-1.1, -0.2, -1.5], [1.1, -0.2, -1.5]] as [number, number, number][]).map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.7]} />
          <meshStandardMaterial color="#3d2b1f" />
        </mesh>
      ))}
      {environment === 'office' && (
        <mesh position={[0, 2, -3.95]}>
          <boxGeometry args={[2, 1.2, 0.05]} />
          <meshStandardMaterial color="white" />
        </mesh>
      )}
      {environment === 'cafe' && (
        <mesh position={[-2.5, 0.3, -3]}>
          <boxGeometry args={[2, 1.2, 0.5]} />
          <meshStandardMaterial color="#6b4226" />
        </mesh>
      )}
    </group>
  );
}
