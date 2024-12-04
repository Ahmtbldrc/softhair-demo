'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Card, CardContent } from '@/components/ui/card'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

gsap.registerPlugin(ScrollTrigger)

const images = [
  '/placeholder.svg?height=300&width=300',
  '/placeholder.svg?height=300&width=300',
  '/placeholder.svg?height=300&width=300',
  '/placeholder.svg?height=300&width=300',
  '/placeholder.svg?height=300&width=300',
  '/placeholder.svg?height=300&width=300',
  '/placeholder.svg?height=300&width=300',
  '/placeholder.svg?height=300&width=300',
  '/placeholder.svg?height=300&width=300',
]

export default function Gallery() {
  const galleryRef = useRef(null)

  useEffect(() => {
    const images = gsap.utils.toArray<HTMLElement>('.gallery-image')
    images.forEach((image, index) => {
      gsap.from(image, {
        scrollTrigger: {
          trigger: image,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        opacity: 0,
        y: 100,
        delay: index * 0.1,
      })
    })
  }, [])

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 metal-text">Galerie</h1>
          <div className="mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Startseite
            </Link>{' '}
            &gt; Galerie
          </div>
          <div ref={galleryRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {images.map((src, index) => (
              <Card key={index} className="gallery-image neon-card overflow-hidden">
                <CardContent className="p-0">
                  <Image src={src} alt={`Gallery image ${index + 1}`} width={300} height={300} className="w-full h-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-16">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </section>
    </div>
  )
}

