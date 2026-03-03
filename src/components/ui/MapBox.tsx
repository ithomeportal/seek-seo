'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapBoxProps {
  latitude: number
  longitude: number
  zoom?: number
  markerLabel?: string
  className?: string
}

export function MapBox({
  latitude,
  longitude,
  zoom = 14,
  markerLabel = 'SEEK Equipment',
  className = '',
}: MapBoxProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    mapboxgl.accessToken = token

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<strong>${markerLabel}</strong>`
    )

    new mapboxgl.Marker({ color: '#ee5519' })
      .setLngLat([longitude, latitude])
      .setPopup(popup)
      .addTo(map.current)

    return () => {
      map.current?.remove()
    }
  }, [latitude, longitude, zoom, markerLabel])

  return <div ref={mapContainer} className={className} />
}
