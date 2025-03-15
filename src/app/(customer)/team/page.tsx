'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Badge } from "@/components/ui/badge"
import { LANGUAGES } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocale } from "@/contexts/LocaleContext"

gsap.registerPlugin(ScrollTrigger)

interface Branch {
  id: number
  name: string
}

interface StaffMember {
  id: number
  firstName: string
  lastName: string
  image: string
  status: boolean
  languages: string[]
  branchId: number
}

// Gravatar default image URL'ini tanımlayalım
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/default?s=400&d=mp"

// Resim URL'sinin geçerli olup olmadığını kontrol eden fonksiyon
const getImageUrl = (image: string | null) => {
  if (!image) return DEFAULT_AVATAR
  
  const imageUrl = `https://rlffvcspggzfedokaqsr.supabase.co/storage/v1/object/public/staff/${image}`
  return imageUrl
}

export default function Team() {
  const { t } = useLocale()
  const teamRef = useRef(null)
  const aboutRef = useRef(null)
  const teamTextRef = useRef(null)
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
  const [teamMembers, setTeamMembers] = useState<StaffMember[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('status', true)
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setBranches(data)
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      let query = supabase
        .from('staff')
        .select('*')
        .eq('status', true)
        .order('firstName', { ascending: true })

      if (selectedBranch) {
        query = query.eq('branchId', selectedBranch)
      }

      const { data, error } = await query
      if (error) throw error
      if (data) setTeamMembers(data)
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [selectedBranch])

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
          <h1 className="text-4xl font-bold mb-8 metal-text">{t("team.title")}</h1>
          
          <div className="mb-8 flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              {t("team.breadcrumb.home")}
            </Link>
            &gt; {t("team.breadcrumb.team")}
            
            <div className="ml-auto w-[200px]">
              {branches.length === 1 ? (
                <div className="text-right text-zinc-400">
                  {branches[0].name}
                </div>
              ) : (
                <Select
                  value={selectedBranch?.toString() || "all"}
                  onValueChange={(value) => setSelectedBranch(value === "all" ? null : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("team.selectBranch")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("team.allBranches")}</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Personel kartları */}
          <div ref={teamRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mt-8">
            {teamMembers.map((member: StaffMember) => (
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
                  <div className="absolute top-3 right-3 flex flex-wrap gap-0 z-10">
                    {member.languages?.map((langId, index) => {
                      const language = LANGUAGES.find(l => l.id === langId)
                      if (!language) return null
                      
                      return (
                        <Badge
                          key={langId}
                          variant="secondary"
                          className={`rounded-full p-0 w-10 h-10 overflow-hidden bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow ring-1 ring-white/20 ${
                            index !== 0 ? '-ml-4' : ''
                          } hover:translate-x-1 hover:-translate-y-1 transition-all duration-200`}
                          title={language.name}
                        >
                          <Image
                            src={`https://flagcdn.com/${language.countryCode.toLowerCase()}.svg`}
                            alt={language.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover drop-shadow-md"
                          />
                        </Badge>
                      )
                    })}
                  </div>
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
      <section ref={aboutRef} className="min-h-screen flex flex-col items-center justify-center px-4 py-4 mb-16">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="relative mb-20">
                <h2 className="text-6xl sm:text-7xl font-bold text-left about-section-title">
                  <span className="inline-block relative">
                    {/* Arka plan gölgesi */}
                    <span className="absolute -inset-2 blur-xl bg-gradient-to-r from-zinc-500/20 via-zinc-300/20 to-zinc-500/20 rounded-lg"></span>
                    
                    {/* Ana başlık */}
                    <span className="relative">
                      <span className="relative inline-block metal-text">
                        {/* Üst katman - parlak efekt */}
                        <span className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent bg-clip-text">
                          {t("team.about.title")}
                        </span>
                        
                        {/* Ana metin */}
                        <span className="relative bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent filter drop-shadow-[0_5px_15px_rgba(255,255,255,0.15)]">
                          {t("team.about.title")}
                        </span>
                      </span>
                    </span>
                  </span>
                </h2>
                
                {/* Ayraç çizgisi */}
                <div className="absolute left-0 -bottom-6 w-96 h-0.5 about-section-divider">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-400 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm"></div>
                </div>
              </div>

              <p className="text-base md:text-lg leading-relaxed">
                {t("team.about.description1")}
              </p>
              <p className="text-base md:text-lg leading-relaxed">
                {t("team.about.description2")}
              </p>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative aspect-[4/3] w-full">
                <Image 
                  src="/image/team-1.jpg" 
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

