'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

gsap.registerPlugin(ScrollTrigger)

interface StaffMember {
  id: number
  firstName: string
  lastName: string
  image: string
  status: boolean
}

// Gravatar default image URL'ini tanımlayalım
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/default?s=400&d=mp"

// Resim URL'sinin geçerli olup olmadığını kontrol eden fonksiyon
const getImageUrl = (image: string | null) => {
  if (!image) return DEFAULT_AVATAR
  
  const imageUrl = `https://vuylmvjocwmjybqbzuja.supabase.co/storage/v1/object/public/staff/${image}`
  return imageUrl
}

export default function Team() {
  const teamRef = useRef(null)
  const aboutRef = useRef(null)
  const teamTextRef = useRef(null)
  const [teamMembers, setTeamMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('status', true)
        .order('firstName', { ascending: true })

        console.log(data)
      
      if (error) {
        throw error
      }

      if (data) {
        setTeamMembers(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    if (!loading) {
      const cards = gsap.utils.toArray<HTMLElement>('.team-card')
      
      gsap.set(cards, {
        opacity: 0,
        y: 50,
        rotation: 0
      })

      cards.forEach((card, index) => {
        gsap.fromTo(card, 
          {
            opacity: 0,
            y: 50,
            rotation: index % 2 === 0 ? -5 : 5,
          },
          {
            scrollTrigger: {
              trigger: card,
              start: "top bottom-=100",
              end: "top center",
              toggleActions: "play none none reverse",
              once: false,
            },
            opacity: 1,
            y: 0,
            rotation: 0,
            duration: 0.8,
            ease: "power2.out",
            delay: index * 0.1,
          }
        )
      })

      // About section için animasyon
      gsap.fromTo(aboutRef.current,
        {
          opacity: 0,
          x: -100,
        },
        {
          scrollTrigger: {
            trigger: aboutRef.current,
            start: "top bottom-=100",
            end: "top center",
            toggleActions: "play none none reverse",
            once: false,
          },
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out"
        }
      )

      const initiallyVisibleCards = cards.filter((card) => {
        const rect = card.getBoundingClientRect()
        return rect.top < window.innerHeight
      })

      if (initiallyVisibleCards.length > 0) {
        gsap.to(initiallyVisibleCards, {
          opacity: 1,
          y: 0,
          rotation: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.1
        })
      }

      gsap.fromTo(teamTextRef.current,
        {
          position: 'absolute',
          opacity: 0,
          scale: 1.2,
          top: '-50%',
          left: '50%',
          xPercent: -50,
          yPercent: 0,
          rotation: -20,
          zIndex: 50,
        },
        {
          scrollTrigger: {
            trigger: aboutRef.current,
            start: "top 80%",
            end: "top 20%",
            scrub: 0.5,
            toggleActions: "play none none reverse",
          },
          position: 'absolute',
          opacity: 1,
          scale: 1,
          top: '10px',
          left: '95%',
          xPercent: -100,
          yPercent: 0,
          rotation: 6,
          ease: "power1.inOut",
        }
      )
    }
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="bg-black text-white">
      <section className="min-h-screen flex items-start pt-16 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 metal-text">Unser Team</h1>
          <div className="mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Startseite
            </Link>{' '}
            &gt; Team
          </div>
          <div ref={teamRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mt-24">
            {teamMembers.map((member) => (
              <Card key={member.id} className="team-card neon-card overflow-hidden relative group">
                <CardContent className="p-0 relative aspect-square">
                  <Image 
                    src={getImageUrl(member.image)}
                    alt={member.firstName}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      // Resim yüklenemezse default avatar'a geç
                      const target = e.target as HTMLImageElement
                      target.src = DEFAULT_AVATAR
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl font-bold metal-text drop-shadow-sm">
                        {`${member.firstName} ${member.lastName}`}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section ref={aboutRef} className="min-h-screen flex items-center px-4">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="relative">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold metal-text">Über unser</h2>
                <div 
                  ref={teamTextRef}
                  className="absolute opacity-0 z-50"
                  style={{ width: 'auto', whiteSpace: 'nowrap' }}
                >
                  <span className="inline-block border border-white/40 rounded-lg px-3 py-1 text-base md:text-lg metal-text">
                    Team
                  </span>
                </div>
              </div>
              <p className="text-base md:text-lg leading-relaxed">
                Unser <span className="metal-text">erfahrenes Team</span> von Stylisten und Coloristen ist darauf spezialisiert,
                Ihnen den <span className="metal-text">perfekten Look</span> zu verleihen. Mit jahrelanger Erfahrung und
                ständiger Weiterbildung sind wir immer auf dem neuesten Stand der <span className="metal-text">Frisurentrends</span>.
              </p>
              <p className="text-base md:text-lg leading-relaxed">
                Wir legen großen Wert auf <span className="metal-text">individuelle Beratung</span> und gehen auf Ihre persönlichen
                Wünsche ein, um sicherzustellen, dass Sie unser Salon mit einem <span className="metal-text">strahlenden Lächeln</span> verlassen.
              </p>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative aspect-[4/3] w-full">
                <Image 
                  src="/placeholder.svg?height=400&width=600" 
                  alt="Team" 
                  fill
                  className="rounded-lg neon-card object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

