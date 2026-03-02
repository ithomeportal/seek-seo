'use client'

import { useEffect, useRef, useState } from 'react'
import { Container } from '@/components/ui/Container'

interface Stat {
  value: number
  suffix: string
  label: string
}

const stats: Stat[] = [
  { value: 250, suffix: '+', label: 'Trailers Available' },
  { value: 5, suffix: '', label: 'Trailer Types' },
  { value: 100, suffix: '%', label: 'Maintenance Included' },
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

      // Ease-out quad
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
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-white">
        {count}
        <span>{stat.suffix}</span>
      </div>
      <p className="mt-2 text-lg text-white/80 font-medium">{stat.label}</p>
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
    <section ref={sectionRef} className="py-20 bg-brand-blue">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((stat) => (
            <AnimatedStat key={stat.label} stat={stat} isVisible={isVisible} />
          ))}
        </div>
      </Container>
    </section>
  )
}
