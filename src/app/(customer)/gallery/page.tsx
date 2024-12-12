'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Card, CardContent } from '@/components/ui/card'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

gsap.registerPlugin(ScrollTrigger)

const images = [
  '/image/gallery/g-1.jpg',
  '/image/gallery/g-2.jpg',
  '/image/gallery/g-3.jpg',
  '/image/gallery/g-4.jpg',
  '/image/gallery/g-5.jpg',
  '/image/gallery/g-6.jpg',
]

const ITEMS_PER_PAGE = 6

export default function Gallery() {
  const galleryRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Toplam sayfa sayısını hesapla
  const totalPages = Math.ceil(images.length / ITEMS_PER_PAGE)
  
  // Mevcut sayfada gösterilecek görüntüleri hesapla
  const getCurrentPageImages = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return images.slice(startIndex, endIndex)
  }

  // Sayfa değiştirme işlevi
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Sayfa değiştiğinde sayfanın üstüne scroll
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const images = gsap.utils.toArray<HTMLElement>('.gallery-image')
    
    gsap.set(images, {
      opacity: 0,
      y: 50
    })

    images.forEach((image, index) => {
      gsap.fromTo(image, 
        {
          opacity: 0,
          y: 50,
        },
        {
          scrollTrigger: {
            trigger: image,
            start: "top bottom",
            end: "bottom center",
            toggleActions: "play none none reverse",
            once: false,
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          delay: index * 0.1,
          immediateRender: false
        }
      )
    })

    const initiallyVisibleImages = images.filter((image) => {
      const rect = image.getBoundingClientRect()
      return rect.top < window.innerHeight
    })

    if (initiallyVisibleImages.length > 0) {
      gsap.to(initiallyVisibleImages, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.1
      })
    }
  }, [currentPage]) // currentPage değiştiğinde efektleri yeniden uygula

  // Pagination için sayfa numaralarını oluştur
  const getPageNumbers = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

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
            {getCurrentPageImages().map((src, index) => (
              <Card key={`${currentPage}-${index}`} className="gallery-image neon-card overflow-hidden">
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
                  <PaginationPrevious 
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </section>
    </div>
  )
}

