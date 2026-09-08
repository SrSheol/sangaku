import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function InkDust({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14
      arr[i * 3 + 1] = (Math.random() - 0.5) * 9
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return arr
  }, [count])

  useFrame(({ clock }) => {
    const pts = ref.current
    if (!pts) return
    pts.rotation.y = clock.elapsedTime * 0.012
    pts.rotation.x = Math.sin(clock.elapsedTime * 0.04) * 0.04
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#caa100"
        transparent
        opacity={0.35}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

function SoftFog() {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mesh.current) return
    mesh.current.rotation.z = clock.elapsedTime * 0.008
    const mat = mesh.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.04 + Math.sin(clock.elapsedTime * 0.2) * 0.015
  })
  return (
    <mesh ref={mesh} position={[0, 0, -2]}>
      <planeGeometry args={[18, 12]} />
      <meshBasicMaterial color="#66716B" transparent opacity={0.05} depthWrite={false} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#0a0801']} />
      <fog attach="fog" args={['#0a0801', 4, 14]} />
      <ambientLight intensity={0.35} />
      <SoftFog />
      <InkDust />
    </>
  )
}

export default function AmbientScene({ paused }: { paused?: boolean }) {
  if (paused) return null
  return (
    <div className="ambient-canvas" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
