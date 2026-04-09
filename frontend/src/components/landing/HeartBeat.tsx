import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Geometria do coração usando curvas de Bezier ─────────────────────────────
function createHeartShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Curva clássica de coração parametrizada
  const pts: [number, number][] = [];
  for (let i = 0; i <= 128; i++) {
    const t = (i / 128) * Math.PI * 2;
    // Equação paramétrica do coração
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push([x / 18, y / 18]); // normalizar para ~1 unidade
  }
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i][0], pts[i][1]);
  }
  shape.closePath();
  return shape;
}

// ─── Onda de pulso irradiando ─────────────────────────────────────────────────
function PulseRing({ delay }: { delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = ((clock.getElapsedTime() - delay) % 1.8) / 1.8; // ciclo de 1.8s
    if (t < 0) return;
    const scale = 1 + t * 3.5;
    mesh.scale.setScalar(scale);
    (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.35;
  });

  const geo = useMemo(() => new THREE.TorusGeometry(0.55, 0.015, 6, 48), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#f43f5e',
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  }), []);

  return <mesh ref={meshRef} geometry={geo} material={mat} />;
}

// ─── Coração principal ────────────────────────────────────────────────────────
export function HeartBeat() {
  const groupRef = useRef<THREE.Group>(null);
  const heartRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Extrusão do coração em 3D
  const heartGeo = useMemo(() => {
    const shape = createHeartShape();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.35,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 4,
    });
  }, []);

  // Centralizar geometria
  useMemo(() => {
    heartGeo.center();
  }, [heartGeo]);

  const wireMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f43f5e',
    emissive: '#f43f5e',
    emissiveIntensity: 0.6,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  }), []);

  const solidMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a0510',
    transparent: true,
    opacity: 0.92,
  }), []);

  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#f43f5e',
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current || !heartRef.current) return;

    // Rotação suave
    groupRef.current.rotation.y = t * 0.4;
    groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.15;

    // Batimento cardíaco: dois pulsos rápidos (lub-dub) a cada ~1s
    const beat = t % 1.0; // ciclo de 1 segundo
    let pulse = 1.0;
    if (beat < 0.08) {
      // Primeiro batimento (lub)
      pulse = 1 + Math.sin((beat / 0.08) * Math.PI) * 0.18;
    } else if (beat > 0.14 && beat < 0.22) {
      // Segundo batimento (dub)
      pulse = 1 + Math.sin(((beat - 0.14) / 0.08) * Math.PI) * 0.12;
    }

    heartRef.current.scale.setScalar(pulse);
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulse * 1.15);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.04 + (pulse - 1) * 0.4;
    }

    // Emissivo pulsa com o batimento
    (wireMat as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + (pulse - 1) * 4;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Glow externo */}
      <mesh ref={glowRef} geometry={heartGeo} material={glowMat} scale={[1.15, 1.15, 1.15]} />

      {/* Coração sólido (oclusão) */}
      <mesh ref={heartRef} geometry={heartGeo} material={solidMat} />

      {/* Wireframe */}
      <mesh geometry={heartGeo} material={wireMat} />

      {/* Ondas de pulso irradiando */}
      <PulseRing delay={0} />
      <PulseRing delay={0.6} />
      <PulseRing delay={1.2} />
    </group>
  );
}
