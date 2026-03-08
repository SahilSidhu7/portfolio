import React, { useEffect, useMemo, useRef, useState } from 'react'

// Load all certificate images from assets/certificates (PNG and JPG for display)
const certModules = import.meta.glob('../assets/certificates/*.{png,jpg,jpeg}', { eager: true })
const CERTIFICATES = Object.entries(certModules)
  .map(([path, mod]) => ({
    src: mod.default,
    title: path
      .split(/[/\\]/)
      .pop()
      .replace(/\.(png|jpe?g)$/i, '')
      .replace(/^certificate-/, '')
      .replace(/-/g, ' '),
  }))
  .sort((a, b) => a.title.localeCompare(b.title))

function mod(n, m) {
  return ((n % m) + m) % m
}

export default function Certificates({ certificates, autoPlay = true }) {
  const items = useMemo(
    () => (certificates?.length ? certificates : CERTIFICATES),
    [certificates]
  )
  const [active, setActive] = useState(0)
  const [previewIndex, setPreviewIndex] = useState(null)
  const reduceMotion = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    reduceMotion.current =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  }, [])

  useEffect(() => {
    if (!autoPlay || items.length <= 1 || reduceMotion.current) return
    const id = window.setInterval(
      () => setActive((a) => mod(a + 1, items.length)),
      3200
    )
    return () => window.clearInterval(id)
  }, [autoPlay, items.length])

  const prev = (e) => {
    e?.preventDefault()
    setActive((a) => mod(a - 1, items.length))
  }
  const next = (e) => {
    e?.preventDefault()
    setActive((a) => mod(a + 1, items.length))
  }

  // Fixed card width and gap so cards don't overlap; use pixels for predictable spacing
  const cardWidthPx = 280
  const cardGapPx = 32
  const maxVisibleDistance = 2
  const coverflowPos = (i) => {
    if (items.length === 0)
      return { visible: false, x: 0, scale: 1, z: 0, opacity: 1, blur: 0 }
    const raw = i - active
    const wrapped =
      raw > items.length / 2
        ? raw - items.length
        : raw < -items.length / 2
          ? raw + items.length
          : raw
    const d = Math.max(-maxVisibleDistance, Math.min(maxVisibleDistance, wrapped))
    const ad = Math.abs(d)
    const visible = ad <= maxVisibleDistance
    const offsetPx = cardWidthPx + cardGapPx
    const x = d * offsetPx
    const scale = d === 0 ? 1.08 : ad === 1 ? 0.82 : 0.68
    const z = d === 0 ? 30 : ad === 1 ? 20 : 10
    const opacity = d === 0 ? 1 : ad === 1 ? 0.85 : 0.45
    const blur = d === 0 ? 0 : ad === 1 ? 0 : 1.5
    return { visible, x, scale, z, opacity, blur }
  }

  if (items.length === 0) {
    return (
      <section className="py-16 md:py-24">
        <h2 className="text-3xl font-bold text-white mb-4">Certificates</h2>
        <p className="text-muted">Add PNG images to src/assets/certificates to show them here.</p>
      </section>
    )
  }

  return (
    <section className="py-16 md:py-24">
      <div className="flex items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white">Certificates</h2>
          <p className="text-muted mt-2">Credentials I’ve earned.</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            type="button"
            onClick={prev}
            className="px-3 py-2 rounded-lg bg-surface-elevated border border-white/10 text-muted hover:text-white hover:border-white/20 transition-colors"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={next}
            className="px-3 py-2 rounded-lg bg-surface-elevated border border-white/10 text-muted hover:text-white hover:border-white/20 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div
          className="relative mx-auto min-h-55 sm:min-h-65 flex items-center justify-center"
          style={{ width: cardWidthPx * 3 + cardGapPx * 2 }}
        >
          {items.map((item, i) => {
            const p = coverflowPos(i)
            if (!p.visible) return null

            return (
              <button
                key={item.src + i}
                type="button"
                onClick={() => setActive(i)}
                className="absolute left-1/2 top-1/2 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-surface-elevated shadow-xl transition-[transform,opacity,filter] duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-accent"
                style={{
                  width: cardWidthPx,
                  aspectRatio: '3/2',
                  transform: `translate(-50%, -50%) translateX(${p.x}px) scale(${p.scale})`,
                  opacity: p.opacity,
                  filter: p.blur ? `blur(${p.blur}px)` : undefined,
                  zIndex: p.z,
                }}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
                <span className="sr-only">{item.title}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center gap-2 flex-wrap">
          {items.map((item, i) => (
            <button
              key={item.src + i}
              type="button"
              aria-label={`Certificate: ${item.title}`}
              onClick={() => setActive(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-10 bg-accent' : 'w-2.5 bg-white/20 hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {items[active] && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setPreviewIndex(active)}
            className="px-4 py-2 rounded-lg bg-surface-elevated border border-white/20 text-sm text-muted hover:text-white hover:border-white/40 hover:bg-surface-elevated/80 transition-colors"
          >
            See certificate
          </button>
        </div>
      )}

      {previewIndex !== null && items[previewIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              className="absolute -top-10 right-0 text-sm text-muted hover:text-white"
            >
              Close
            </button>
            <div className="rounded-xl overflow-hidden border border-white/20 bg-surface-elevated shadow-2xl max-h-[80vh] flex items-center justify-center">
              <img
                src={items[previewIndex].src}
                alt={items[previewIndex].title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
