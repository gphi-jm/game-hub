'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import GameCard from './GameCard.jsx'
import bybetLogo from '../src/assets/bybet.png'

const API_URL = 'https://docking-635955947416.asia-east1.run.app/api/games/'

const modulo = (value, length) => ((value % length) + length) % length
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const mergeGameCollections = (games, featuredGames, newGames) => {
  const gameMap = new Map()

  for (const game of games) {
    gameMap.set(game.id, { ...game })
  }

  for (const game of newGames) {
    const existing = gameMap.get(game.id) ?? {}
    gameMap.set(game.id, {
      ...existing,
      ...game,
      is_new: true,
    })
  }

  for (const game of featuredGames) {
    const existing = gameMap.get(game.id) ?? {}
    gameMap.set(game.id, {
      ...existing,
      ...game,
      is_featured: true,
    })
  }

  const featuredIds = new Set(featuredGames.map((game) => game.id))
  const orderedFeatured = featuredGames.map((game) => gameMap.get(game.id))
  const orderedRemainder = games
    .filter((game) => !featuredIds.has(game.id))
    .map((game) => gameMap.get(game.id))

  return [...orderedFeatured, ...orderedRemainder]
}

export default function GameHubPage() {
  const [games, setGames] = useState([])
  const [featuredGames, setFeaturedGames] = useState([])
  const [newGames, setNewGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeSlotIndex, setActiveSlotIndex] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(1440)
  const railRef = useRef(null)
  const slotRefs = useRef([])
  const scrollRafRef = useRef(0)
  const activeIndexRef = useRef(0)
  const activeSlotIndexRef = useRef(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const controller = new AbortController()

    async function loadGames() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(API_URL, { signal: controller.signal })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = await response.json()
        const normalizedGames = Array.isArray(payload?.data?.games) ? payload.data.games : []
        const normalizedFeaturedGames = Array.isArray(payload?.data?.featured_games)
          ? payload.data.featured_games.map((game) => ({
              ...game,
              is_featured: true,
            }))
          : []
        const normalizedNewGames = Array.isArray(payload?.data?.new_games)
          ? payload.data.new_games.map((game) => ({
              ...game,
              is_new: true,
            }))
          : []

        setGames(normalizedGames)
        setFeaturedGames(normalizedFeaturedGames)
        setNewGames(normalizedNewGames)
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError('Unable to load games right now.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadGames()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const syncViewportWidth = () => {
      setViewportWidth(window.innerWidth)
    }

    syncViewportWidth()
    window.addEventListener('resize', syncViewportWidth)

    return () => window.removeEventListener('resize', syncViewportWidth)
  }, [])

  const selectorGames = useMemo(
    () => mergeGameCollections(games, featuredGames, newGames),
    [games, featuredGames, newGames]
  )

  const loopedGames = useMemo(() => {
    if (!selectorGames.length) {
      return []
    }

    const repeatCount = selectorGames.length > 1 ? 3 : 1
    return Array.from({ length: repeatCount }, (_, cycle) =>
      selectorGames.map((game, index) => ({
        ...game,
        loopIndex: cycle * selectorGames.length + index,
        logicalIndex: index,
        cycle,
      }))
    ).flat()
  }, [selectorGames])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    activeSlotIndexRef.current = activeSlotIndex
  }, [activeSlotIndex])

  useEffect(() => {
    if (!selectorGames.length) {
      return
    }

    setActiveIndex((current) => {
      const safeCurrent = modulo(current, selectorGames.length)

      if (safeCurrent === 0 && selectorGames.length > 1) {
        return Math.min(Math.floor(selectorGames.length / 2), selectorGames.length - 1)
      }

      return safeCurrent
    })
  }, [selectorGames.length])

  const activeGame = selectorGames[activeIndex] ?? null

  const getCenterSlotIndex = (logicalIndex) => {
    if (!selectorGames.length) {
      return 0
    }

    const centerCycle = selectorGames.length > 1 ? selectorGames.length : 0
    return centerCycle + modulo(logicalIndex, selectorGames.length)
  }

  const scrollToSlotIndex = (slotIndex, behavior = prefersReducedMotion ? 'auto' : 'smooth') => {
    const rail = railRef.current
    const slot = slotRefs.current[slotIndex]

    if (!rail || !slot) {
      return
    }

    const targetLeft = slot.offsetLeft - rail.clientWidth / 2 + slot.clientWidth / 2
    rail.scrollTo({ left: targetLeft, behavior })
  }

  const scrollToIndex = (index, behavior) => {
    scrollToSlotIndex(getCenterSlotIndex(index), behavior)
  }

  const goPrev = () => {
    if (!selectorGames.length) {
      return
    }

    const nextSlotIndex = Math.max(0, activeSlotIndexRef.current - 1)
    const logicalIndex = Number(slotRefs.current[nextSlotIndex]?.dataset.logicalIndex ?? modulo(nextSlotIndex, selectorGames.length))
    setActiveIndex(logicalIndex)
    setActiveSlotIndex(nextSlotIndex)
    scrollToSlotIndex(nextSlotIndex)
  }

  const goNext = () => {
    if (!selectorGames.length) {
      return
    }

    const nextSlotIndex = Math.min(loopedGames.length - 1, activeSlotIndexRef.current + 1)
    const logicalIndex = Number(slotRefs.current[nextSlotIndex]?.dataset.logicalIndex ?? modulo(nextSlotIndex, selectorGames.length))
    setActiveIndex(logicalIndex)
    setActiveSlotIndex(nextSlotIndex)
    scrollToSlotIndex(nextSlotIndex)
  }

  const syncRailTransforms = () => {
    const rail = railRef.current
    const slots = slotRefs.current

    if (!rail || !slots.length) {
      return
    }

    const viewportCenter = rail.scrollLeft + rail.clientWidth / 2
    let nearestIndex = activeIndexRef.current
    let nearestSlotIndex = activeSlotIndexRef.current
    let nearestDistance = Number.POSITIVE_INFINITY
    const depthReach = viewportWidth <= 560 ? 160 : viewportWidth <= 820 ? 210 : 250

    slots.forEach((slot, index) => {
      if (!slot) {
        return
      }

      const slotCenter = slot.offsetLeft + slot.offsetWidth / 2
      const distance = slotCenter - viewportCenter
      const normalized = clamp(distance / depthReach, -1.3, 1.3)
      const depth = Math.min(Math.abs(normalized), 1.2)
      const focus = clamp(1 - depth, 0, 1)
      const sideDirection = Math.sign(distance) || 1
      const logicalIndex = Number(slot.dataset.logicalIndex ?? modulo(index, selectorGames.length))

      if (Math.abs(distance) < nearestDistance) {
        nearestDistance = Math.abs(distance)
        nearestSlotIndex = index
        nearestIndex = logicalIndex
      }

      if (prefersReducedMotion) {
        slot.style.setProperty('--slot-x', '0px')
        slot.style.setProperty('--slot-y', `${Math.max(0, (1 - focus) * 5)}px`)
        slot.style.setProperty('--slot-z', `${Math.round(focus * 16)}px`)
        slot.style.setProperty('--slot-rotate-x', '0deg')
        slot.style.setProperty('--slot-rotate-y', '0deg')
        slot.style.setProperty('--slot-rotate-z', '0deg')
        slot.style.setProperty('--slot-scale', `${(0.98 + focus * 0.02).toFixed(3)}`)
        slot.style.setProperty('--slot-opacity', `${(0.8 + focus * 0.2).toFixed(3)}`)
        slot.style.zIndex = String(10 + Math.round(focus * 8))
        return
      }

      const shiftX = clamp(-normalized * 3.5, -5, 5)
      const liftY = clamp((1 - focus) * 2.5 - focus * 0.8, -1.5, 3)
      const depthZ = Math.round(focus * 52 - (1 - focus) * 8)
      const rotateX = clamp(1.8 - depth * 2.1, -0.8, 1.8)
      const rotateY = clamp(normalized * -3.2, -4.5, 4.5)
      const rotateZ = clamp(normalized * 0.25, -0.5, 0.5)
      const scale = clamp(0.965 + focus * 0.035, 0.96, 1.02)
      const opacity = clamp(0.78 + focus * 0.22, 0.78, 1)

      slot.style.setProperty('--slot-x', `${shiftX}px`)
      slot.style.setProperty('--slot-y', `${liftY}px`)
      slot.style.setProperty('--slot-z', `${depthZ}px`)
      slot.style.setProperty('--slot-rotate-x', `${rotateX}deg`)
      slot.style.setProperty('--slot-rotate-y', `${rotateY}deg`)
      slot.style.setProperty('--slot-rotate-z', `${rotateZ * sideDirection * -1}deg`)
      slot.style.setProperty('--slot-scale', `${scale.toFixed(3)}`)
      slot.style.setProperty('--slot-opacity', `${opacity.toFixed(3)}`)
      slot.style.zIndex = String(10 + Math.round(focus * 10))
    })

    const cycleWidth = rail.scrollWidth / (selectorGames.length > 0 ? (selectorGames.length > 1 ? 3 : 1) : 1)

    if (selectorGames.length > 1 && cycleWidth > 0) {
      if (rail.scrollLeft < cycleWidth * 0.45) {
        rail.scrollLeft += cycleWidth
        setActiveSlotIndex((current) => current + selectorGames.length)
        return
      }

      if (rail.scrollLeft > cycleWidth * 1.55) {
        rail.scrollLeft -= cycleWidth
        setActiveSlotIndex((current) => current - selectorGames.length)
        return
      }
    }

    if (nearestIndex !== activeIndexRef.current) {
      setActiveIndex(nearestIndex)
    }

    if (nearestSlotIndex !== activeSlotIndexRef.current) {
      setActiveSlotIndex(nearestSlotIndex)
    }
  }

  useEffect(() => {
    const rail = railRef.current

    if (!rail || !selectorGames.length) {
      return undefined
    }

    const handleScroll = () => {
      window.cancelAnimationFrame(scrollRafRef.current)
      scrollRafRef.current = window.requestAnimationFrame(syncRailTransforms)
    }

    const handleResize = () => {
      syncRailTransforms()
    }

    rail.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollToIndex(activeIndexRef.current, 'auto')
      syncRailTransforms()
    })

    const settleTimer = window.setTimeout(() => {
      scrollToIndex(activeIndexRef.current, 'auto')
      syncRailTransforms()
    }, 120)

    return () => {
      rail.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      window.cancelAnimationFrame(scrollRafRef.current)
      window.clearTimeout(settleTimer)
    }
  }, [selectorGames.length, viewportWidth, prefersReducedMotion])

  useEffect(() => {
    if (!selectorGames.length) {
      return
    }

    const centerSlot = getCenterSlotIndex(activeIndexRef.current)
    setActiveSlotIndex(centerSlot)
    scrollToSlotIndex(centerSlot, 'auto')
    syncRailTransforms()
  }, [selectorGames.length])

  const handleRailWheel = (event) => {
    const rail = railRef.current

    if (!rail || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return
    }

    event.preventDefault()
    rail.scrollBy({ left: event.deltaY * 1.1, behavior: 'auto' })
  }

  const pageVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.8, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 },
    },
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.56, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <div className="bios-page">
      <motion.div
        className="bios-backdrop"
        aria-hidden="true"
      />
      <motion.div
        className="bios-ambient-glow"
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? { opacity: 0.14 }
            : {
                opacity: [0.12, 0.22, 0.12],
                scale: [1, 1.06, 1],
              }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      <motion.main
        className="bios-shell"
        variants={pageVariants}
        initial="hidden"
        animate="show"
      >
        {loading ? (
          <div className="bios-loading">Loading game selector...</div>
        ) : (
          <>
            <motion.section className="bios-status-bar" variants={sectionVariants}>
              <div className="bios-status-item bios-status-brand-item">
                <img src={bybetLogo} alt="ByBet" className="bios-status-brand" />
              </div>
              <div className="bios-status-item">
                <span className="bios-status-label">Featured</span>
                <strong>{featuredGames.length}</strong>
              </div>
              <div className="bios-status-item">
                <span className="bios-status-label">New Games</span>
                <strong>{newGames.length}</strong>
              </div>
              <div className="bios-status-item">
                <span className="bios-status-label">Active Game</span>
                <AnimatePresence mode="wait">
                  <motion.strong
                    key={activeGame?.id ?? 'none'}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
                  >
                    {activeGame?.name ?? 'None Selected'}
                  </motion.strong>
                </AnimatePresence>
              </div>
            </motion.section>

            <motion.section
              className="bios-rail"
              variants={sectionVariants}
            >
              <motion.button
                type="button"
                className="bios-arrow bios-arrow-left"
                onClick={goPrev}
                aria-label="Previous game"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.06, y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              >
                <span className="bios-arrow-icon" aria-hidden="true">
                  &#8249;
                </span>
              </motion.button>

              <div className="bios-card-row" aria-label="Game list" ref={railRef} onWheel={handleRailWheel}>
                {loopedGames.map((game, slotIndex) => (
                  <motion.div
                    key={`loop-${game.loopIndex ?? slotIndex}-${game.id ?? slotIndex}`}
                    ref={(node) => {
                      slotRefs.current[slotIndex] = node

                      if (node) {
                        node.dataset.logicalIndex = String(game.logicalIndex ?? modulo(slotIndex, selectorGames.length))
                      }
                    }}
                    className={`bios-card-slot ${slotIndex === activeSlotIndex ? 'is-center' : ''}`}
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.48,
                            ease: [0.22, 1, 0.36, 1],
                            delay: (slotIndex % Math.max(selectorGames.length, 1)) * 0.01,
                          }
                    }
                    style={{
                      '--slot-x': '0px',
                      '--slot-y': '0px',
                      '--slot-z': '0px',
                      '--slot-rotate-x': '0deg',
                      '--slot-rotate-y': '0deg',
                      '--slot-rotate-z': '0deg',
                      '--slot-scale': slotIndex === activeSlotIndex ? 1 : 0.92,
                      '--slot-opacity': slotIndex === activeSlotIndex ? 1 : 0.72,
                      zIndex: slotIndex === activeSlotIndex ? 18 : 10,
                    }}
                  >
                    <GameCard
                      game={game}
                      progress={((game.logicalIndex + 2) * 17) % 100 || 88}
                      isActive={slotIndex === activeSlotIndex}
                      offset={slotIndex - activeSlotIndex}
                      onClick={() => {
                        const logicalIndex = game.logicalIndex ?? modulo(slotIndex, selectorGames.length)
                        setActiveIndex(logicalIndex)
                        setActiveSlotIndex(slotIndex)
                        scrollToSlotIndex(slotIndex)
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              <motion.button
                type="button"
                className="bios-arrow bios-arrow-right"
                onClick={goNext}
                aria-label="Next game"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.06, y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              >
                <span className="bios-arrow-icon" aria-hidden="true">
                  &#8250;
                </span>
              </motion.button>
            </motion.section>

            <motion.section className="bios-footer" variants={sectionVariants}>
              <div className="bios-active-copy">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={activeGame?.id ?? 'footer-title'}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
                  >
                    {activeGame?.name ?? 'Game Hub'}
                  </motion.h1>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeGame?.description ?? 'footer-copy'}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                  >
                    {activeGame?.description ?? 'Select a game to inspect its profile and launch state.'}
                  </motion.p>
                </AnimatePresence>
                {typeof activeGame?.total_players === 'number' ? (
                  <motion.p
                    className="bios-active-players"
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
                  >
                    total players // {activeGame.total_players}
                  </motion.p>
                ) : null}
              </div>
            </motion.section>

            <section className="bios-api-list">
              <div className="bios-api-list-header">
                <strong>{games.length} Total Entries</strong>
              </div>
              <div className="bios-api-grid">
                {games.map((game, index) => (
                  <button
                    key={game.id ?? index}
                    type="button"
                    className={`bios-api-item ${activeGame?.id === game.id ? 'is-active' : ''}`}
                    onClick={() => {
                      const selectorIndex = selectorGames.findIndex((item) => item.id === game.id)

                      if (selectorIndex >= 0) {
                        setActiveIndex(selectorIndex)
                        scrollToIndex(selectorIndex)
                      }
                    }}
                  >
                    <span className="bios-api-name">{game.name ?? 'Unnamed Game'}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {error ? <p className="bios-error">{error}</p> : null}
      </motion.main>
    </div>
  )
}
