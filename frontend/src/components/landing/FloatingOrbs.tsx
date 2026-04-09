import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ORB_COUNT = 7;
const COLORS = ['#00d4aa', '#7c3aed', '#06b6d4', '#8b5cf6'];

interface OrbData {
  id: number;
  position: [number, number, number];
  phase: number;
  color: string;
  radius: number;
}

function Orb({ position, phase, color, radius }: Omit<OrbData, 'id'>) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    // Flutuação vertical senoidal com fase aleatória por esfera
    meshRef.current.position.y = position[1] + Math.sin(t * 0.8 + phase) * 0.3;
    // Escala pulsante ~1 Hz (batimento cardíaco)
    const pulse = 1 + Math.sin(t * Math.PI * 2 + phase) * 0.05;
    meshRef.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshPhysicalMaterial
        color={color}
        transmission={0.8}
        roughness={0.1}
        metalness={0.1}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

export function FloatingOrbs() {
  const orbs = useMemo<OrbData[]>(() => {
    const result: OrbData[] = [];
    let attempts = 0;

    while (result.length < ORB_COUNT && attempts < 200) {
      attempts++;
      // Ângulo e raio aleatórios, evitando o centro (raio < 1.5)
      const angle = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 3; // raio entre 2 e 5
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (Math.random() - 0.5) * 4;

      // Garantir distância mínima do centro no plano XZ
      if (Math.sqrt(x * x + z * z) < 1.5) continue;

      result.push({
        id: result.length,
        position: [x, y, z],
        phase: Math.random() * Math.PI * 2,
        color: COLORS[result.length % COLORS.length],
        radius: 0.3 + Math.random() * 0.2,
      });
    }

    return result;
  }, []);

  return (
    <group>
      {orbs.map((orb) => (
        <Orb key={orb.id} {...orb} />
      ))}
    </group>
  );
}
