'use client'

import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'

const API_ORIGIN = 'https://docking-635955947416.asia-east1.run.app'

const resolveImageUrl = (value) => {
  const raw = value?.src ?? value

  if (!raw) {
    return ''
  }

  if (typeof raw === 'string' && raw.startsWith('/')) {
    return `${API_ORIGIN}${raw}`
  }

  return raw
}

export { resolveImageUrl }

export default function GameCard({
  game,
  isActive = false,
  progress = 0,
  offset = 0,
  onClick,
  href = '#',
}) {
  const imageSrc = resolveImageUrl(game.image_url ?? game.image)
  const title = game.name ?? game.title ?? 'Unknown Game'
  const badge = game.is_featured ? 'Featured' : game.is_new ? 'New Drop' : `Game ${game.game_id ?? game.id ?? '--'}`
  const canPlay = href !== '#'

  const imageX = useSpring(useMotionValue(0), { stiffness: 180, damping: 20 })
  const imageY = useSpring(useMotionValue(0), { stiffness: 180, damping: 20 })
  const glareX = useSpring(useMotionValue(50), { stiffness: 120, damping: 20 })
  const glareY = useSpring(useMotionValue(18), { stiffness: 120, damping: 20 })
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.1), transparent 24%)`

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    imageX.set((px - 0.5) * 18)
    imageY.set((py - 0.5) * 10)
    glareX.set(px * 100)
    glareY.set(py * 100)
  }

  const resetPointer = () => {
    imageX.set(0)
    imageY.set(0)
    glareX.set(50)
    glareY.set(18)
  }

  return (
    <motion.button
      type="button"
      className={`cover-card ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-pressed={isActive}
      whileHover={{ y: -10 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      style={{ zIndex: 20 - Math.abs(offset) }}
    >
      <div className="cover-card-frame">
        <motion.div className="cover-card-poster" style={{ x: imageX, y: imageY }}>
          {imageSrc ? <img src={imageSrc} alt="" aria-hidden="true" className="cover-card-image" /> : null}
        </motion.div>
        <motion.div className="cover-card-glare" aria-hidden="true" style={{ backgroundImage: glare }} />
        <div className="cover-card-overlay" aria-hidden="true" />
      </div>

      <div className="cover-card-copy">
        <span className="cover-card-badge">{badge}</span>
        <span className="cover-card-progress">{progress}%</span>
        <span className="cover-card-title">{title}</span>
        <a
          className={`cover-card-play ${canPlay ? '' : 'is-disabled'}`.trim()}
          href={href}
          aria-disabled={!canPlay}
          onClick={(event) => {
            event.stopPropagation()

            if (!canPlay) {
              event.preventDefault()
            }
          }}
        >
          Play
        </a>
      </div>
    </motion.button>
  )
}
