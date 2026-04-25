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

export default function GameCard({ game, isActive = false, progress = 0, onClick }) {
  const imageSrc = resolveImageUrl(game.image_url ?? game.image)
  const title = game.name ?? game.title ?? 'Unknown Game'
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 })
  const imageX = useSpring(useMotionValue(0), { stiffness: 140, damping: 18 })
  const imageY = useSpring(useMotionValue(0), { stiffness: 140, damping: 18 })
  const glareX = useSpring(useMotionValue(50), { stiffness: 120, damping: 20 })
  const glareY = useSpring(useMotionValue(50), { stiffness: 120, damping: 20 })
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.18), transparent 28%)`

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    rotateY.set((px - 0.5) * 10)
    rotateX.set((0.5 - py) * 10)
    imageX.set((px - 0.5) * 14)
    imageY.set((py - 0.5) * 14)
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
    <motion.button
      layout
      className={`bios-card ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      whileHover={{
        y: isActive ? -12 : -10,
        scale: isActive ? 1.035 : 1.025,
      }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 430, damping: 28, mass: 0.75 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="bios-card-media"
        initial={false}
        animate={{ scale: isActive ? 1.1 : 1.03 }}
        whileHover={{ scale: isActive ? 1.16 : 1.12, x: 4 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{ x: imageX, y: imageY }}
      >
        {imageSrc ? <img src={imageSrc} alt="" aria-hidden="true" className="bios-card-image" /> : null}
      </motion.div>

      <motion.div className="bios-card-glare" aria-hidden="true" style={{ backgroundImage: glare }} />
      <div className="bios-card-scan" aria-hidden="true" />
      <div className="bios-card-thunder" aria-hidden="true">
        <span className="bios-card-bolt bios-card-bolt-main" />
        <span className="bios-card-bolt bios-card-bolt-branch" />
        <span className="bios-card-spark bios-card-spark-a" />
        <span className="bios-card-spark bios-card-spark-b" />
        <span className="bios-card-spark bios-card-spark-c" />
        <span className="bios-card-spark bios-card-spark-d" />
      </div>

      <motion.div
        className="bios-card-content"
        initial={false}
        animate={{ y: isActive ? 0 : 2 }}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
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
          animate={{ letterSpacing: isActive ? '0.2em' : '0.16em' }}
          whileHover={{ letterSpacing: '0.22em' }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
        >
          {title}
        </motion.span>
      </motion.div>
    </motion.button>
  )
}
