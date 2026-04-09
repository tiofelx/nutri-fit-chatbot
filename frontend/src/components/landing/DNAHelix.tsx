import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const HELIX_TURNS = 4;
const HELIX_HEIGHT = 6;
const HELIX_RADIUS = 0.8;
const RUNGS = 20;

function createHelixCurve(offset: number): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * HELIX_TURNS * Math.PI * 2;
    const y = (i / 100) * HELIX_HEIGHT - HELIX_HEIGHT / 2;
    points.push(
      new THREE.Vector3(
        Math.cos(t + offset) * HELIX_RADIUS,
        y,
        Math.sin(t + offset) * HELIX_RADIUS
      )
    );
  }
  return new THREE.CatmullRomCurve3(points);
}

export function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null);

  // Renderizar apenas em telas ≥ 1024px
  if (typeof window !== 'undefined' && window.innerWidth < 1024) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { curve1, curve2, rungData } = useMemo(() => {
    const c1 = createHelixCurve(0);
    const c2 = createHelixCurve(Math.PI);

    const rungs: Array<{
      position: THREE.Vector3;
      direction: THREE.Vector3;
      length: number;
    }> = [];

    for (let i = 0; i < RUNGS; i++) {
      const t = i / (RUNGS - 1);
      const p1 = c1.getPoint(t);
      const p2 = c2.getPoint(t);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      rungs.push({ position: mid, direction: dir.normalize(), length: len });
    }

    return { curve1: c1, curve2: c2, rungData: rungs };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.4;
  });

  const tubeSegments = 200;
  const tubeRadius = 0.06;

  return (
    <group ref={groupRef}>
      {/* Fita 1 */}
      <mesh>
        <tubeGeometry args={[curve1, tubeSegments, tubeRadius, 8, false]} />
        <meshStandardMaterial color="#00d4aa" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Fita 2 */}
      <mesh>
        <tubeGeometry args={[curve2, tubeSegments, tubeRadius, 8, false]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Barras de conexão */}
      {rungData.map((rung, i) => {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          rung.direction
        );
        const euler = new THREE.Euler().setFromQuaternion(quaternion);

        return (
          <mesh
            key={i}
            position={[rung.position.x, rung.position.y, rung.position.z]}
            rotation={[euler.x, euler.y, euler.z]}
          >
            <cylinderGeometry args={[0.03, 0.03, rung.length, 6]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.4}
              roughness={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}
