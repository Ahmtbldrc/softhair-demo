'use client'

import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Preload, Environment } from '@react-three/drei'
import { useEffect } from 'react'
import * as THREE from 'three'

const MODEL_PATH = '/models/scene.gltf'

function BarberChair() {
  const { scene } = useGLTF(MODEL_PATH)

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.material) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0xF5F5F5,
            metalness: 0.3,
            roughness: 0.2,
            clearcoat: 0.4,
            clearcoatRoughness: 0.2,
          })
        }
      }
    })
  }, [scene])

  return <primitive object={scene} scale={0.7} />
}

useGLTF.preload(MODEL_PATH)

export default function ThreeJSScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      className="w-[250px] h-[200px] md:h-[250px]"
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />
      <Environment preset="studio" />
      <BarberChair />
      <OrbitControls 
        enableZoom={false}
        autoRotate
        autoRotateSpeed={5}
      />
      <Preload all />
    </Canvas>
  )
} 