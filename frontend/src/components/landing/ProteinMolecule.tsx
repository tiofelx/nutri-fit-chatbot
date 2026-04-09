import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Cores por tipo de átomo (CPK) ────────────────────────────────────────────
const ATOM_COLORS = {
  C: '#00d4aa',   // carbono — verde-água
  N: '#7c3aed',   // nitrogênio — violeta
  O: '#f43f5e',   // oxigênio — vermelho
  H: '#06b6d4',   // hidrogênio — ciano
  S: '#facc15',   // enxofre — amarelo
};

// ─── Gera posições de uma alfa-hélice ─────────────────────────────────────────
// Parâmetros reais: passo = 5.4Å, raio = 2.3Å, 3.6 resíduos/volta
function generateAlphaHelix(residues: number) {
  const atoms: Array<{ pos: THREE.Vector3; type: keyof typeof ATOM_COLORS; id: number }> = [];
  const bonds: Array<[number, number]> = [];

  const radius = 1.1;
  const rise = 0.28;       // subida por resíduo
  const twist = (2 * Math.PI) / 3.6; // ângulo por resíduo

  for (let i = 0; i < residues; i++) {
    const angle = i * twist;
    const y = i * rise - (residues * rise) / 2;

    // Carbono alfa (Cα) — backbone principal
    const ca = new THREE.Vector3(
      radius * Math.cos(angle),
      y,
      radius * Math.sin(angle)
    );

    // Carbono carbonila (C=O) — ligeiramente deslocado
    const c = new THREE.Vector3(
      radius * Math.cos(angle + 0.3) * 0.9,
      y + 0.18,
      radius * Math.sin(angle + 0.3) * 0.9
    );

    // Nitrogênio (N-H) — backbone
    const n = new THREE.Vector3(
      radius * Math.cos(angle - 0.3) * 0.9,
      y - 0.12,
      radius * Math.sin(angle - 0.3) * 0.9
    );

    // Oxigênio da carbonila
    const o = new THREE.Vector3(
      c.x + (Math.random() - 0.5) * 0.3,
      c.y + 0.22,
      c.z + (Math.random() - 0.5) * 0.3
    );

    // Cadeia lateral (R-group) — varia por resíduo
    const sideChainTypes: Array<keyof typeof ATOM_COLORS> = ['C', 'N', 'O', 'S', 'C'];
    const sc = new THREE.Vector3(
      ca.x * 1.5 + (Math.random() - 0.5) * 0.4,
      ca.y + (Math.random() - 0.5) * 0.3,
      ca.z * 1.5 + (Math.random() - 0.5) * 0.4
    );

    const base = atoms.length;
    atoms.push({ pos: ca, type: 'C', id: base });
    atoms.push({ pos: c,  type: 'C', id: base + 1 });
    atoms.push({ pos: n,  type: 'N', id: base + 2 });
    atoms.push({ pos: o,  type: 'O', id: base + 3 });
    atoms.push({ pos: sc, type: sideChainTypes[i % sideChainTypes.length], id: base + 4 });

    // Ligações dentro do resíduo
    bonds.push([base, base + 1]); // Cα-C
    bonds.push([base, base + 2]); // Cα-N
    bonds.push([base + 1, base + 3]); // C=O
    bonds.push([base, base + 4]); // Cα-sidechain

    // Ligação peptídica com resíduo anterior
    if (i > 0) {
      bonds.push([base - 3, base + 2]); // C(i-1)-N(i)
    }

    // Ligação de hidrogênio da hélice (i → i+4)
    if (i >= 4) {
      const prevN = base - 4 * 5 + 2;
      bonds.push([base + 3, prevN]); // O(i) ··· N(i-4)
    }
  }

  return { atoms, bonds };
}

// ─── Cria cilindro entre dois pontos ─────────────────────────────────────────
function createBondGeo(a: THREE.Vector3, b: THREE.Vector3): {
  geo: THREE.CylinderGeometry;
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
} {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(0.025, 0.025, len, 5);
  const pos = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const quat = new THREE.Quaternion();
  quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return { geo, pos, quat };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function ProteinMolecule() {
  const groupRef = useRef<THREE.Group>(null);
  const fadeRef = useRef(0);

  const RESIDUES = 22;
  const { atoms, bonds } = useMemo(() => generateAlphaHelix(RESIDUES), []);

  // Materiais por tipo de átomo
  const mats = useMemo(() => {
    const m: Record<string, THREE.MeshStandardMaterial> = {};
    Object.entries(ATOM_COLORS).forEach(([type, color]) => {
      m[type] = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.25,
        metalness: 0.15,
      });
    });
    return m;
  }, []);

  const bondMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#334155',
    emissive: '#1e293b',
    emissiveIntensity: 0.2,
    roughness: 0.6,
    metalness: 0.1,
  }), []);

  // Geometrias dos átomos por tamanho
  const atomGeos = useMemo(() => ({
    C: new THREE.SphereGeometry(0.1, 12, 10),
    N: new THREE.SphereGeometry(0.11, 12, 10),
    O: new THREE.SphereGeometry(0.1, 12, 10),
    H: new THREE.SphereGeometry(0.065, 8, 7),
    S: new THREE.SphereGeometry(0.13, 12, 10),
  }), []);

  // Pré-calcular geometrias e posições das ligações
  const bondMeshes = useMemo(() =>
    bonds.map(([a, b]) => {
      const posA = atoms[a]?.pos;
      const posB = atoms[b]?.pos;
      if (!posA || !posB) return null;
      return createBondGeo(posA, posB);
    }).filter(Boolean),
  [atoms, bonds]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.25;
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.2;
    // Fade-in nos primeiros 2 segundos via escala
    const fade = Math.min(1, t / 1.5);
    fadeRef.current = fade;
    groupRef.current.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.opacity = fade;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Átomos */}
      {atoms.map((atom) => (
        <mesh
          key={atom.id}
          geometry={atomGeos[atom.type]}
          material={mats[atom.type]}
          position={atom.pos}
        />
      ))}

      {/* Ligações */}
      {bondMeshes.map((bond, i) => {
        if (!bond) return null;
        return (
          <mesh
            key={i}
            geometry={bond.geo}
            material={bondMat}
            position={bond.pos}
            quaternion={bond.quat}
          />
        );
      })}
    </group>
  );
}
