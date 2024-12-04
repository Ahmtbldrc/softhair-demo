'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Preload } from '@react-three/drei'
import * as THREE from 'three'

// Model yolunu sabit bir değişken olarak tanımlayalım
const MODEL_PATH = '/models/scene.gltf'

function BarberChair() {
  const { scene } = useGLTF(MODEL_PATH)

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: 0xF5F5F5,
          metalness: 0.3,
          roughness: 0.2,
          clearcoat: 0.4,
          clearcoatRoughness: 0.2,
          reflectivity: 0.8,
          envMapIntensity: 1.5
        })
      }
    })
  }, [scene])

  return <primitive object={scene} scale={0.7} />
}

// Model'i önceden yükle
useGLTF.preload(MODEL_PATH)

const Footer = () => {
  const menuItems = [
    { name: 'Startseite', href: '/' },
    { name: 'Galerie', href: '/gallery' },
    { name: 'Team', href: '/team' },
  ]

  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo ve Sosyal Medya */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="text-3xl font-bold metal-text">
              Royal Team
            </Link>
            <p className="text-gray-400">Ihr Friseur für den perfekten Look</p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-gray-300 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Linkler */}
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-xl font-semibold">Links</h3>
            <ul className="space-y-3 text-center">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href} 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3D Model */}
          <div className="flex items-center justify-center h-[200px] relative">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 45 }}
              className="w-[250px] h-full"
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
              <BarberChair />
              <OrbitControls 
                enableZoom={false}
                autoRotate
                autoRotateSpeed={5}
              />
              <Preload all />
            </Canvas>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="text-center text-sm text-gray-400">
            <Link 
              href="https://softsidedigital.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-gray-300 transition-colors"
            >
              © {new Date().getFullYear()} Royal Team | Entwickelt von Softside Digital
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

