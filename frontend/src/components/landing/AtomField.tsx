import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COLORS = ['#00d4aa', '#7c3aed', '#06b6d4', '#8b5cf6', '#00ffcc'];
const ATOM_COUNT = 30;

// Geometrias compartilhadas
const nucleusGeo = new THREE.SphereGeometry(0.06, 10, 8);
const electronGeo = new THREE.SphereGeometry(0.025, 6, 5);

function nucleusMat(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.3,
  });
}

function electronMat(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });
}

function orbitMat(color: string) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.25,
  });
}

// Cria geometria de elipse (órbita)
function createOrbitGeo(rx: number, ry: number, tilt: number): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    pts.push(new THREE.Vector3(
      Math.cos(a) * rx,
      Math.sin(a) * ry * Math.cos(tilt),
      Math.sin(a) * ry * Math.sin(tilt),
    ));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

type AtomData = {
  id: number;
  pos: [number, number, number];
  color: string;
  scale: number;
  speed: number;
  orbits: Array<{ rx: number; ry: number; tilt: number; electronSpeed: number; phase: number }>;
  floatPhase: number;
  rotSpeed: number;
};

function Atom({ data }: { data: AtomData }) {
  const groupRef = useRef<THREE.Group>(null);
  const electronRefs = useRef<THREE.Mesh[]>([]);

  const nMat = useMemo(() => nucleusMat(data.color), [data.color]);
  const eMat = useMemo(() => electronMat(data.color), [data.color]);

  const orbitGeos = useMemo(
    () => data.orbits.map(o => createOrbitGeo(o.rx, o.ry, o.tilt)),
    [data.orbits]
  );
  const oMats = useMemo(
    () => data.orbits.map(() => orbitMat(data.color)),
    [data.color, data.orbits]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;

    // Flutuação suave
    groupRef.current.position.y = data.pos[1] + Math.sin(t * 0.6 + data.floatPhase) * 0.15;
    // Rotação lenta do átomo inteiro
    groupRef.current.rotation.y = t * data.rotSpeed;
    groupRef.current.rotation.x = Math.sin(t * 0.3 + data.floatPhase) * 0.2;

    // Mover elétrons nas órbitas
    data.orbits.forEach((orbit, i) => {
      const el = electronRefs.current[i];
      if (!el) return;
      const angle = t * orbit.electronSpeed + orbit.phase;
      el.position.set(
        Math.cos(angle) * orbit.rx,
        Math.sin(angle) * orbit.ry * Math.cos(orbit.tilt),
        Math.sin(angle) * orbit.ry * Math.sin(orbit.tilt),
      );
    });
  });

  const orbitLines = useMemo(
    () => orbitGeos.map((geo, i) => new THREE.Line(geo, oMats[i])),
    [orbitGeos, oMats]
  );

  return (
    <group
      ref={groupRef}
      position={data.pos}
      scale={[data.scale, data.scale, data.scale]}
    >
      {/* Núcleo */}
      <mesh geometry={nucleusGeo} material={nMat} />

      {/* Órbitas + elétrons */}
      {data.orbits.map((_orbit, i) => (
        <group key={i}>
          {/* Linha da órbita */}
          <primitive object={orbitLines[i]} />
          {/* Elétron */}
          <mesh
            ref={el => { if (el) electronRefs.current[i] = el; }}
            geometry={electronGeo}
            material={eMat}
          />
        </group>
      ))}
    </group>
  );
}

export function AtomField() {
  const atoms = useMemo<AtomData[]>(() => {
    const result: AtomData[] = [];

    // Distribuição em grade 3D uniforme usando sequência de Halton
    // para evitar clustering — cobre toda a tela de forma determinística
    function halton(index: number, base: number): number {
      let f = 1; let r = 0;
      let i = index;
      while (i > 0) { f /= base; r += f * (i % base); i = Math.floor(i / base); }
      return r;
    }

    for (let i = 0; i < ATOM_COUNT; i++) {
      const color = COLORS[i % COLORS.length];
      const scale = 0.5 + halton(i + 1, 7) * 1.1;

      // Posições usando sequência quasi-aleatória de baixa discrepância
      // Cobre o espaço [-8,8] x [-4,4] x [-4,2] uniformemente
      const px = (halton(i + 1, 2) * 2 - 1) * 8.5;
      const py = (halton(i + 1, 3) * 2 - 1) * 4.5;
      const pz = (halton(i + 1, 5) * 2 - 1) * 3.5 - 1;

      const pos: [number, number, number] = [px, py, pz];

      const numOrbits = 1 + Math.floor(halton(i + 1, 11) * 3);
      const orbits = Array.from({ length: numOrbits }, (_, j) => ({
        rx: 0.18 + j * 0.1 + halton(i * 3 + j, 13) * 0.05,
        ry: 0.14 + j * 0.08 + halton(i * 3 + j, 17) * 0.04,
        tilt: (j * Math.PI) / numOrbits + halton(i + j, 7) * 0.5,
        electronSpeed: 1.5 + halton(i + j + 1, 5) * 2.5,
        phase: halton(i * 5 + j, 3) * Math.PI * 2,
      }));

      result.push({
        id: i,
        pos,
        color,
        scale,
        speed: 0.3 + halton(i + 1, 7) * 0.4,
        orbits,
        floatPhase: halton(i + 1, 11) * Math.PI * 2,
        rotSpeed: (halton(i + 1, 13) - 0.5) * 0.4,
      });
    }
    return result;
  }, []);

  return (
    <group>
      {atoms.map(atom => <Atom key={atom.id} data={atom} />)}
    </group>
  );
}
