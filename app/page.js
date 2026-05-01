'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import GameCard from '../components/GameCard'
import bybetLogo from '../src/assets/bybet.png'

const API_URL = 'https://docking-635955947416.asia-east1.run.app/api/games/'

const modulo = (value, length) => ((value % length) + length) % length

const buildVisibleGames = (games, activeIndex) => {
  if (!games.length) {
    return []
  }

  const visibleCount = Math.min(games.length, 5)
  const startOffset = -Math.floor(visibleCount / 2)
  const offsets = Array.from({ length: visibleCount }, (_, index) => startOffset + index)

  return offsets.map((offset) => {
    const index = modulo(activeIndex + offset, games.length)
    const progress = ((index + 2) * 17) % 100

    return {
      ...games[index],
      sourceIndex: index,
      offset,
      progress: progress === 0 ? 88 : progress,
    }
  })
}

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

export default function Home() {
  const [games, setGames] = useState([])
  const [featuredGames, setFeaturedGames] = useState([])
  const [newGames, setNewGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(1440)
  const isMobileViewport = viewportWidth <= 820
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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileViewport])

  const selectorGames = useMemo(
    () => mergeGameCollections(games, featuredGames, newGames),
    [games, featuredGames, newGames]
  )

  useEffect(() => {
    if (!selectorGames.length) {
      return
    }

    setActiveIndex((current) => modulo(current, selectorGames.length))
  }, [selectorGames.length])

  const visibleGames = useMemo(
    () => buildVisibleGames(selectorGames, activeIndex),
    [selectorGames, activeIndex]
  )
  const activeGame = selectorGames[activeIndex] ?? null

  const goPrev = () => {
    if (!selectorGames.length) {
      return
    }

    setActiveIndex((current) => modulo(current - 1, selectorGames.length))
  }

  const goNext = () => {
    if (!selectorGames.length) {
      return
    }

    setActiveIndex((current) => modulo(current + 1, selectorGames.length))
  }

  const pageVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.7, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.12 },
    },
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <div className="bios-page">
      <div className="bios-backdrop" aria-hidden="true" />
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

      <motion.main className="bios-shell" variants={pageVariants} initial="hidden" animate="show">
        {/* <header className="bios-topbar">
          <span className="bios-bumper">L1</span>
          <nav className="bios-nav" aria-label="Game sections">
            {topNavItems.map((item) => (
              <button
                key={item}
                type="button"
                className={`bios-nav-item ${item === 'Bios' ? 'is-active' : ''}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <span className="bios-bumper">R1</span>
        </header> */}

        {loading ? (
          <div className="bios-loading">Loading game selector...</div>
        ) : (
          <>
            <motion.section className="bios-status-bar" variants={sectionVariants}>
              <div className="bios-status-item bios-status-brand-item">
                <Image src={bybetLogo} alt="ByBet" priority className="bios-status-brand" />
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
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                  >
                    {activeGame?.name ?? 'None Selected'}
                  </motion.strong>
                </AnimatePresence>
              </div>
            </motion.section>

            <motion.section className="bios-rail" variants={sectionVariants}>
              <motion.button
                type="button"
                className="bios-arrow bios-arrow-left"
                onClick={goPrev}
                aria-label="Previous game"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.06, y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              >
                <span className="bios-arrow-icon" aria-hidden="true">&#8249;</span>
              </motion.button>

              <div className="bios-card-row" aria-label="Game list">
                {visibleGames.map((game) => (
                  <motion.div
                    key={`slot-${game.offset}`}
                    className={`bios-card-slot ${game.sourceIndex === activeIndex ? 'is-center' : ''}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                            delay: Math.abs(game.offset) * 0.05,
                          }
                    }
                  >
                    <GameCard
                      game={game}
                      progress={game.progress}
                      isActive={game.sourceIndex === activeIndex}
                      offset={game.offset}
                      onClick={() => setActiveIndex(game.sourceIndex)}
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
                <span className="bios-arrow-icon" aria-hidden="true">&#8250;</span>
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
