import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 3000;
const COLOR_START = new THREE.Color('#00d4aa');
const COLOR_END = new THREE.Color('#7c3aed');
const REPULSION_RADIUS = 1.5;
const REPULSION_STRENGTH = 0.08;

export function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera, raycaster, gl } = useThree();
  const mouseRef = useRef(new THREE.Vector2(9999, 9999));

  // Generate initial positions, colors, sizes and per-particle phase offsets
  const { positions, colors, sizes, phases, originalPositions } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Distribute in sphere with variable radius
      const radius = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Color gradient by Y position: map y from [-7, 7] to [0, 1]
      const t = THREE.MathUtils.clamp((y + 7) / 14, 0, 1);
      const color = COLOR_START.clone().lerp(COLOR_END, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Random size between 0.5 and 2
      sizes[i] = 0.5 + Math.random() * 1.5;

      // Random phase offset for sinusoidal float
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, colors, sizes, phases, originalPositions };
  }, []);

  // Track mouse position for repulsion
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }, [gl]);

  // Attach/detach mouse listener
  useMemo(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [gl, handleMouseMove]);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;

    const t = clock.getElapsedTime();
    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;

    // Slow continuous rotation
    points.rotation.y = t * 0.05;
    points.rotation.x = t * 0.02;

    // Raycasting for mouse repulsion
    raycaster.setFromCamera(mouseRef.current, camera);
    const ray = raycaster.ray;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ox = originalPositions[i * 3];
      const oy = originalPositions[i * 3 + 1];
      const oz = originalPositions[i * 3 + 2];

      // Sinusoidal float per particle
      const floatY = Math.sin(t * 0.8 + phases[i]) * 0.15;

      let px = ox;
      let py = oy + floatY;
      let pz = oz;

      // Repulsion: compute world position of particle (accounting for rotation)
      // Use a simplified approach: project particle onto ray and push away
      const particleWorld = new THREE.Vector3(px, py, pz).applyEuler(points.rotation);
      const closestPoint = ray.closestPointToPoint(particleWorld, new THREE.Vector3());
      const dist = particleWorld.distanceTo(closestPoint);

      if (dist < REPULSION_RADIUS) {
        const repulse = particleWorld.clone().sub(closestPoint).normalize();
        const strength = REPULSION_STRENGTH * (1 - dist / REPULSION_RADIUS);
        px += repulse.x * strength;
        py += repulse.y * strength;
        pz += repulse.z * strength;
      }

      posAttr.setXYZ(i, px, py, pz);
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        sizeAttenuation
        size={0.05}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}
