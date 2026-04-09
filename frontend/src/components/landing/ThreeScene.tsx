import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ProteinMolecule } from './ProteinMolecule';

function MouseLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const mouseWorld = useRef(new THREE.Vector3(0, 0, 3));
  const { camera, gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
      vec.unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const distance = (3 - camera.position.z) / dir.z;
      mouseWorld.current = camera.position.clone().add(dir.multiplyScalar(distance));
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [camera, gl]);

  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.position.lerp(mouseWorld.current, 0.08);
  });

  return <pointLight ref={lightRef} intensity={2} color="#7c3aed" distance={25} decay={2} />;
}

function VisibilityController() {
  const { gl } = useThree();
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) gl.setAnimationLoop(null);
      else gl.setAnimationLoop(() => {});
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [gl]);
  return null;
}

export function ThreeScene() {
  const dpr: [number, number] = [1, Math.min(window.devicePixelRatio, 2)];
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 8], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'white' }}
    >
      <VisibilityController />
      <ambientLight intensity={0.8} />
      <MouseLight />
      <pointLight intensity={1.5} color="#00d4aa" position={[-5, 3, 2]} />
      <pointLight intensity={1.0} color="#7c3aed" position={[5, -3, 2]} />
      <ProteinMolecule />
    </Canvas>
  );
}
