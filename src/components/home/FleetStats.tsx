'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'

interface Stat {
  value: number
  suffix: string
  label: string
}

const stats: Stat[] = [
  { value: 250, suffix: '+', label: 'Trailers Available' },
  { value: 5, suffix: '', label: 'Trailer Types' },
  { value: 100, suffix: '%', label: 'DOT Inspected' },
  { value: 100, suffix: '%', label: 'GPS Tracked' },
  { value: 24, suffix: '/7', label: 'Support' },
]

function useCountUp(target: number, isVisible: boolean, duration = 1500): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    let startTime: number | null = null
    let frameId: number

    function animate(timestamp: number) {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      const eased = 1 - (1 - progress) * (1 - progress)
      setCount(Math.round(eased * target))

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameId)
  }, [target, isVisible, duration])

  return count
}

function AnimatedStat({ stat, isVisible }: { stat: Stat; isVisible: boolean }) {
  const count = useCountUp(stat.value, isVisible)

  return (
    <div className="text-center px-6 py-4">
      <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
        {count}
        <span className="text-brand-orange">{stat.suffix}</span>
      </div>
      <p className="mt-2 text-sm text-white/60 font-medium uppercase tracking-wider">
        {stat.label}
      </p>
    </div>
  )
}

export function FleetStats() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = sectionRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-20 overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/gallery/shipping-delivery.jpg"
        alt="American truck cab at golden hour"
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-brand-orange/90" />

      <Container className="relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:divide-x lg:divide-white/10">
          {stats.map((stat) => (
            <AnimatedStat key={stat.label} stat={stat} isVisible={isVisible} />
          ))}
        </div>
      </Container>
    </section>
  )
}
