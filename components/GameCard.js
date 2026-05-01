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

const resolveGameUrl = (value) => {
  const raw = value?.game_url ?? value

  if (!raw || typeof raw !== 'string') {
    return '#'
  }

  if (raw.startsWith('/')) {
    return `${API_ORIGIN}${raw}`
  }

  return raw
}

export default function GameCard({ game, isActive = false, progress = 0, onClick, offset = 0 }) {
  const imageSrc = resolveImageUrl(game.image_url ?? game.image)
  const title = game.name ?? game.title ?? 'Unknown Game'
  const gameUrl = resolveGameUrl(game)
  const canLaunch = gameUrl !== '#'
  const depth = Math.min(Math.abs(offset), 3)
  const baseX = offset * 38
  const baseY = isActive ? -10 : 14 + depth * 6
  const baseZ = isActive ? 80 : -depth * 90
  const baseRotateY = offset * -18
  const baseScale = isActive ? 1.08 : Math.max(0.8, 1 - depth * 0.08)
  const rotateX = useSpring(useMotionValue(0), { stiffness: 42, damping: 24 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 42, damping: 24 })
  const imageX = useSpring(useMotionValue(0), { stiffness: 38, damping: 22 })
  const imageY = useSpring(useMotionValue(0), { stiffness: 38, damping: 22 })
  const glareX = useSpring(useMotionValue(50), { stiffness: 32, damping: 20 })
  const glareY = useSpring(useMotionValue(50), { stiffness: 32, damping: 20 })
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.14), transparent 30%)`

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    rotateY.set((px - 0.5) * 5)
    rotateX.set((0.5 - py) * 5)
    imageX.set((px - 0.5) * 6)
    imageY.set((py - 0.5) * 6)
    glareX.set(px * 100)
    glareY.set(py * 100)
  }

  const resetPointer = () => {
    rotateX.set(0)
    rotateY.set(0)
    imageX.set(0)
    imageY.set(0)
    glareX.set(50)
    glareY.set(50)
  }

  return (
    <motion.div
      layout
      className={`bios-card ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.(event)
        }
      }}
      whileHover={{
        y: isActive ? -3 : -1,
        scale: isActive ? 1.01 : 1.004,
      }}
      whileTap={{ scale: 0.996 }}
      transition={{ type: 'spring', stiffness: 62, damping: 28, mass: 1.08 }}
      transformTemplate={(generated) =>
        `translate3d(${baseX}px, ${baseY}px, ${baseZ}px) rotateY(${baseRotateY}deg) scale(${baseScale}) ${generated}`
      }
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="bios-card-media"
        initial={false}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1, x: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        style={{ x: imageX, y: imageY }}
      >
        {imageSrc ? <img src={imageSrc} alt="" aria-hidden="true" className="bios-card-image" /> : null}
      </motion.div>

      <motion.div className="bios-card-glare" aria-hidden="true" style={{ backgroundImage: glare }} />
      <div className="bios-card-scan" aria-hidden="true" />

      <a
        className={`bios-card-launcher ${canLaunch ? '' : 'is-disabled'}`.trim()}
        href={gameUrl}
        aria-disabled={!canLaunch}
        onClick={(event) => {
          event.stopPropagation()

          if (!canLaunch) {
            event.preventDefault()
          }
        }}
      >
        Launch
      </a>

      <motion.div
        className="bios-card-content"
        initial={false}
        animate={{ y: isActive ? 0 : 1 }}
        whileHover={{ y: 0 }}
        transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* <motion.span className="bios-card-badge" whileHover={{ opacity: 1 }}>
          {badge}
        </motion.span> */}
        {/* <motion.span
          className="bios-card-progress"
          initial={false}
          animate={{ scale: isActive ? 1.04 : 1 }}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {progress}%
        </motion.span> */}
        <motion.span
          className="bios-card-label"
          initial={false}
          animate={{ letterSpacing: isActive ? '0.18em' : '0.15em' }}
          whileHover={{ letterSpacing: '0.18em' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.span>
      </motion.div>
    </motion.div>
  )
}
