import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Proporções anatômicas (1 unidade = 1 cabeça ≈ 0.5 THREE units) ──────────
// Altura total: 7.5 cabeças. Cabeça = 0.5u → total = 3.75u
// Referência: https://en.wikipedia.org/wiki/Body_proportions

const H = 0.5; // altura de 1 cabeça em unidades THREE

// Centros Y de cada segmento (de cima para baixo, origem no centro do corpo)
const Y = {
  head:      H * 3.25,   // centro da cabeça
  neck:      H * 2.62,   // centro do pescoço
  chest:     H * 1.9,    // centro do peito (tórax superior)
  abdomen:   H * 1.1,    // abdômen
  pelvis:    H * 0.45,   // pelve
  shoulder:  H * 2.35,   // altura dos ombros
  elbow:     H * 1.55,   // cotovelo
  wrist:     H * 0.75,   // pulso
  hand:      H * 0.45,   // mão
  hip:       H * 0.2,    // articulação do quadril
  knee:     -H * 1.1,    // joelho
  ankle:    -H * 2.1,    // tornozelo
  foot:     -H * 2.4,    // pé
};

// Larguras X
const X = {
  shoulder: H * 1.0,   // largura do ombro (2 cabeças total)
  arm:      H * 1.15,  // posição lateral do braço
  hip:      H * 0.42,  // largura do quadril
  leg:      H * 0.42,  // posição lateral da perna
};

function wireMat(color: string, opacity = 0.82) {
  return new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.5,
    wireframe: true, transparent: true, opacity,
  });
}

const occludeMat = new THREE.MeshStandardMaterial({
  color: '#030b16', transparent: true, opacity: 0.96,
});

function lerpHex(a: string, b: string, t: number) {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
}

type PartProps = {
  geo: THREE.BufferGeometry;
  color: string;
  pos: [number, number, number];
  rot?: [number, number, number];
};

function Part({ geo, color, pos, rot = [0, 0, 0] }: PartProps) {
  const mat = useMemo(() => wireMat(color), [color]);
  return (
    <group position={pos} rotation={rot}>
      <mesh geometry={geo} material={occludeMat} />
      <mesh geometry={geo} material={mat} />
    </group>
  );
}

export function HumanBody() {
  const root = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (root.current) root.current.rotation.y = clock.getElapsedTime() * 0.3;
  });

  const c = (t: number) => lerpHex('#00d4aa', '#7c3aed', t);

  // ── Geometrias ──────────────────────────────────────────────────────────────
  // Cabeça: levemente oval (mais alta que larga)
  const headGeo    = useMemo(() => new THREE.SphereGeometry(H * 0.48, 20, 16), []);

  // Pescoço: cilindro curto
  const neckGeo    = useMemo(() => new THREE.CylinderGeometry(H * 0.14, H * 0.16, H * 0.28, 10), []);

  // Tórax: forma trapezoidal (mais largo em cima)
  const chestGeo   = useMemo(() => new THREE.CylinderGeometry(H * 0.52, H * 0.42, H * 1.1, 12), []);

  // Abdômen: transição tronco→pelve
  const abdGeo     = useMemo(() => new THREE.CylinderGeometry(H * 0.38, H * 0.44, H * 0.5, 10), []);

  // Pelve: mais larga que o abdômen
  const pelvisGeo  = useMemo(() => new THREE.CylinderGeometry(H * 0.46, H * 0.38, H * 0.42, 10), []);

  // Braço superior: cápsula
  const uArmGeo    = useMemo(() => new THREE.CapsuleGeometry(H * 0.12, H * 0.72, 4, 10), []);

  // Antebraço: ligeiramente mais fino
  const lArmGeo    = useMemo(() => new THREE.CapsuleGeometry(H * 0.1, H * 0.65, 4, 10), []);

  // Mão
  const handGeo    = useMemo(() => new THREE.SphereGeometry(H * 0.13, 10, 8), []);

  // Coxa: mais grossa
  const uLegGeo    = useMemo(() => new THREE.CapsuleGeometry(H * 0.17, H * 0.82, 4, 10), []);

  // Perna inferior
  const lLegGeo    = useMemo(() => new THREE.CapsuleGeometry(H * 0.13, H * 0.75, 4, 10), []);

  // Pé
  const footGeo    = useMemo(() => new THREE.CapsuleGeometry(H * 0.1, H * 0.35, 4, 8), []);

  // ── Posições calculadas ─────────────────────────────────────────────────────
  // Braço superior: centro entre ombro e cotovelo
  const uArmY = (Y.shoulder + Y.elbow) / 2;
  // Antebraço: centro entre cotovelo e pulso
  const lArmY = (Y.elbow + Y.wrist) / 2;
  // Coxa: centro entre quadril e joelho
  const uLegY = (Y.hip + Y.knee) / 2;
  // Perna inferior: centro entre joelho e tornozelo
  const lLegY = (Y.knee + Y.ankle) / 2;

  return (
    <group ref={root} position={[2.6, 0, 0]}>

      {/* Cabeça */}
      <Part geo={headGeo} color={c(0)} pos={[0, Y.head, 0]} />

      {/* Pescoço */}
      <Part geo={neckGeo} color={c(0.05)} pos={[0, Y.neck, 0]} />

      {/* Tórax — mais largo nos ombros */}
      <Part geo={chestGeo} color={c(0.12)} pos={[0, Y.chest, 0]} />

      {/* Abdômen */}
      <Part geo={abdGeo} color={c(0.22)} pos={[0, Y.abdomen, 0]} />

      {/* Pelve */}
      <Part geo={pelvisGeo} color={c(0.3)} pos={[0, Y.pelvis, 0]} />

      {/* ── Braço esquerdo ── */}
      <Part geo={uArmGeo} color={c(0.08)}
        pos={[-X.arm, uArmY, 0]}
        rot={[0, 0, 0.18]}
      />
      <Part geo={lArmGeo} color={c(0.1)}
        pos={[-X.arm - H * 0.06, lArmY, 0]}
        rot={[0, 0, 0.08]}
      />
      <Part geo={handGeo} color={c(0.12)}
        pos={[-X.arm - H * 0.08, Y.hand, 0]}
      />

      {/* ── Braço direito ── */}
      <Part geo={uArmGeo} color={c(0.08)}
        pos={[X.arm, uArmY, 0]}
        rot={[0, 0, -0.18]}
      />
      <Part geo={lArmGeo} color={c(0.1)}
        pos={[X.arm + H * 0.06, lArmY, 0]}
        rot={[0, 0, -0.08]}
      />
      <Part geo={handGeo} color={c(0.12)}
        pos={[X.arm + H * 0.08, Y.hand, 0]}
      />

      {/* ── Perna esquerda ── */}
      <Part geo={uLegGeo} color={c(0.55)} pos={[-X.leg, uLegY, 0]} />
      <Part geo={lLegGeo} color={c(0.72)} pos={[-X.leg, lLegY, 0]} />
      <Part geo={footGeo} color={c(0.88)}
        pos={[-X.leg, Y.foot, H * 0.12]}
        rot={[Math.PI / 2.2, 0, 0]}
      />

      {/* ── Perna direita ── */}
      <Part geo={uLegGeo} color={c(0.55)} pos={[X.leg, uLegY, 0]} />
      <Part geo={lLegGeo} color={c(0.72)} pos={[X.leg, lLegY, 0]} />
      <Part geo={footGeo} color={c(0.88)}
        pos={[X.leg, Y.foot, H * 0.12]}
        rot={[Math.PI / 2.2, 0, 0]}
      />

    </group>
  );
}
