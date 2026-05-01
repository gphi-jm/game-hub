'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import GameCard, { resolveImageUrl } from '../components/GameCard'
import bybetLogo from '../src/assets/bybet.png'

const API_URL = '/api/games'

const cardThemes = [
  {
    bg: 'rgba(39, 78, 19, 0.72)',
    bg2: 'rgba(22, 38, 13, 0.84)',
    accent: '#bf9000',
    accentSoft: 'rgba(191, 144, 0, 0.72)',
    glow: 'rgba(191, 144, 0, 0.26)',
    buttonFg: '#f3f6f4',
  },
  {
    bg: 'rgba(33, 68, 16, 0.72)',
    bg2: 'rgba(16, 28, 10, 0.84)',
    accent: '#f3f6f4',
    accentSoft: 'rgba(243, 246, 244, 0.72)',
    glow: 'rgba(243, 246, 244, 0.2)',
    buttonFg: '#16260d',
  },
  {
    bg: 'rgba(52, 88, 28, 0.72)',
    bg2: 'rgba(22, 38, 13, 0.84)',
    accent: '#d8b84a',
    accentSoft: 'rgba(216, 184, 74, 0.72)',
    glow: 'rgba(216, 184, 74, 0.24)',
    buttonFg: '#16260d',
  },
  {
    bg: 'rgba(26, 51, 13, 0.72)',
    bg2: 'rgba(12, 22, 8, 0.84)',
    accent: '#bfe7a8',
    accentSoft: 'rgba(191, 231, 168, 0.72)',
    glow: 'rgba(191, 231, 168, 0.2)',
    buttonFg: '#16260d',
  },
]

const modulo = (value, length) => ((value % length) + length) % length

const shortestOffset = (index, activeIndex, length) => {
  let offset = index - activeIndex

  if (offset > length / 2) {
    offset -= length
  }

  if (offset < -length / 2) {
    offset += length
  }

  return offset
}

const buildProgress = (index) => {
  const value = ((index + 3) * 17) % 100
  return value === 0 ? 88 : value
}

const buildTheme = (index) => cardThemes[index % cardThemes.length]

const normalizeGamePayload = (payload) => {
  const root = Array.isArray(payload) ? { games: payload } : payload?.data ?? payload ?? {}
  const games = Array.isArray(root.games) ? root.games : Array.isArray(payload?.games) ? payload.games : []
  const featuredGames = Array.isArray(root.featured_games)
    ? root.featured_games
    : Array.isArray(root.featuredGames)
      ? root.featuredGames
      : Array.isArray(payload?.featured_games)
        ? payload.featured_games
        : Array.isArray(payload?.featuredGames)
          ? payload.featuredGames
          : []
  const newGames = Array.isArray(root.new_games)
    ? root.new_games
    : Array.isArray(root.newGames)
      ? root.newGames
      : Array.isArray(payload?.new_games)
        ? payload.new_games
        : Array.isArray(payload?.newGames)
          ? payload.newGames
          : []

  return { games, featuredGames, newGames }
}

const resolveGameHref = (game) => {
  if (typeof game?.game_url === 'string' && game.game_url.trim()) {
    return game.game_url
  }

  return '#'
}

const mergeGameCollections = (games, featuredGames, newGames) => {
  const gameMap = new Map()

  for (const game of games) {
    gameMap.set(game.id, { ...game })
  }

  for (const game of newGames) {
    const existing = gameMap.get(game.id) ?? {}
    gameMap.set(game.id, { ...existing, ...game, is_new: true })
  }

  for (const game of featuredGames) {
    const existing = gameMap.get(game.id) ?? {}
    gameMap.set(game.id, { ...existing, ...game, is_featured: true })
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
  const [payloadDebug, setPayloadDebug] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(1440)
  const isMobileViewport = viewportWidth <= 820

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
        const { games: rawGames, featuredGames: rawFeaturedGames, newGames: rawNewGames } = normalizeGamePayload(payload)

        const themedGames = rawGames.map((game, index) => ({ ...game, theme: buildTheme(index) }))
        const themedFeaturedGames = rawFeaturedGames.map((game, index) => ({
          ...game,
          is_featured: true,
          theme: buildTheme(index),
        }))
        const themedNewGames = rawNewGames.map((game, index) => ({
          ...game,
          is_new: true,
          theme: buildTheme(index + themedFeaturedGames.length),
        }))

        setGames(themedGames)
        setFeaturedGames(themedFeaturedGames)
        setNewGames(themedNewGames)
        setPayloadDebug(
          `payload keys: ${Object.keys(Array.isArray(payload) ? { games: payload } : payload?.data ?? payload ?? {})
            .sort()
            .join(', ') || 'none'}`
        )
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectorGames.length) {
        return
      }

      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => modulo(current - 1, selectorGames.length))
      }

      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => modulo(current + 1, selectorGames.length))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectorGames.length])

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

    document.body.style.overflow = isMobileViewport ? 'auto' : 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileViewport])

  const activeGame = selectorGames[activeIndex] ?? null
  const activeBackground = resolveImageUrl(activeGame?.image_url ?? activeGame?.image)

  const carouselMetrics = useMemo(() => {
    if (viewportWidth <= 560) {
      return {
        spacing: 112,
        maxVisibleOffset: 1,
        centerScale: 1.06,
        sideScaleFloor: 0.74,
        perspectiveDepth: 80,
      }
    }

    if (viewportWidth <= 820) {
      return {
        spacing: 138,
        maxVisibleOffset: 2,
        centerScale: 1.1,
        sideScaleFloor: 0.72,
        perspectiveDepth: 96,
      }
    }

    if (viewportWidth <= 1100) {
      return {
        spacing: 170,
        maxVisibleOffset: 3,
        centerScale: 1.15,
        sideScaleFloor: 0.7,
        perspectiveDepth: 120,
      }
    }

    return {
      spacing: 220,
      maxVisibleOffset: 4,
      centerScale: 1.2,
      sideScaleFloor: 0.68,
      perspectiveDepth: 160,
    }
  }, [viewportWidth])

  const positionedGames = useMemo(
    () =>
      selectorGames.map((game, index) => ({
        ...game,
        sourceIndex: index,
        offset: shortestOffset(index, activeIndex, selectorGames.length),
        progress: buildProgress(index),
      })),
    [selectorGames, activeIndex]
  )

  const moveTo = (direction) => {
    if (!selectorGames.length) {
      return
    }

    setActiveIndex((current) => modulo(current + direction, selectorGames.length))
  }

  const handleDragEnd = (_, info) => {
    if (info.offset.x <= -70) {
      moveTo(1)
      return
    }

    if (info.offset.x >= 70) {
      moveTo(-1)
    }
  }

  const featuredShowcase = featuredGames.length ? featuredGames.slice(0, 4) : selectorGames.slice(0, 4)

  return (
    <div className="coverflow-page">
      <motion.div
        className="coverflow-background"
        key={activeBackground || 'fallback'}
        initial={{ opacity: 0.4, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.17, 0.67, 0.16, 0.99] }}
        style={{
          backgroundImage: activeBackground ? `url(${activeBackground})` : undefined,
          opacity: activeBackground ? 0.24 : 0.08,
        }}
      />

      <main className="coverflow-shell">
        <section className="coverflow-hero">
          <div className="coverflow-brandmark" aria-hidden="true">
            <Image
              src={bybetLogo}
              alt="ByBet"
              priority
              className="coverflow-brandmark-image"
            />
          </div>

          <section className="coverflow-status realism-border">
            <div>
              <span className="coverflow-label">Library</span>
              <strong>{games.length} Loaded</strong>
            </div>
            <div>
              <span className="coverflow-label">Featured</span>
              <strong>{featuredGames.length}</strong>
            </div>
            <div>
              <span className="coverflow-label">New Games</span>
              <strong>{newGames.length}</strong>
            </div>
            <div>
              <span className="coverflow-label">Active</span>
              <strong>{activeGame?.name ?? 'None Selected'}</strong>
            </div>
          </section>

          {!loading && process.env.NODE_ENV !== 'production' ? (
            <p className="section-debug">{payloadDebug}</p>
          ) : null}

          {loading ? (
            <div className="coverflow-loading">Loading cover flow...</div>
          ) : (
            <>
              <section className="coverflow-stage">
                <button type="button" className="coverflow-arrow coverflow-arrow-left" onClick={() => moveTo(-1)} aria-label="Previous game">
                  <span className="coverflow-arrow-icon" aria-hidden="true">&#8249;</span>
                </button>

                <motion.div
                  className="coverflow-track"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.16}
                  onDragEnd={handleDragEnd}
                >
                  {positionedGames.map((game) => {
                    const clampedOffset = Math.max(
                      -carouselMetrics.maxVisibleOffset,
                      Math.min(carouselMetrics.maxVisibleOffset, game.offset)
                    )
                    const absOffset = Math.abs(clampedOffset)
                    const scale =
                      game.offset === 0
                        ? carouselMetrics.centerScale
                        : Math.max(carouselMetrics.sideScaleFloor, 1 - absOffset * 0.1)
                    const x = clampedOffset * carouselMetrics.spacing
                    const z =
                      game.offset === 0
                        ? carouselMetrics.perspectiveDepth
                        : Math.max(0, carouselMetrics.perspectiveDepth - absOffset * 34)
                    const rotateY = game.offset === 0 ? 0 : clampedOffset > 0 ? -45 : 45
                    const opacity =
                      absOffset > carouselMetrics.maxVisibleOffset
                        ? 0
                        : Math.max(0.16, 1 - absOffset * 0.22)

                    return (
                      <motion.div
                        key={game.id}
                        className="coverflow-slot"
                        animate={{
                          x,
                          scale,
                          rotateY,
                          z,
                          opacity,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 220,
                          damping: 26,
                          mass: 0.9,
                        }}
                        style={{ zIndex: 40 - absOffset }}
                      >
                        <GameCard
                          game={game}
                          progress={game.progress}
                          isActive={game.offset === 0}
                          offset={game.offset}
                          href={resolveGameHref(game)}
                          onClick={() => setActiveIndex(game.sourceIndex)}
                        />
                      </motion.div>
                    )
                  })}
                </motion.div>

                <button type="button" className="coverflow-arrow coverflow-arrow-right" onClick={() => moveTo(1)} aria-label="Next game">
                  <span className="coverflow-arrow-icon" aria-hidden="true">&#8250;</span>
                </button>
              </section>

              <section className="coverflow-footer">
                <div className="coverflow-copy">
                  <p className="coverflow-slug">Active selection</p>
                  <h1>{activeGame?.name ?? 'Game Hub'}</h1>
                  <p>{activeGame?.description ?? 'Select a game to inspect its profile and launch state.'}</p>
                  {typeof activeGame?.total_players === 'number' ? (
                    <p className="coverflow-meta">total players // {activeGame.total_players}</p>
                  ) : null}
                </div>

                <div className="coverflow-controls" aria-hidden="true">
                  <span>Drag</span>
                  <span>Swipe</span>
                  <span>Arrow Keys</span>
                </div>
              </section>

            </>
          )}
        </section>
        {error ? <p className="coverflow-error">{error}</p> : null}
      </main>
    </div>
  )
}
