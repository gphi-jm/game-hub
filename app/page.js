'use client'

import { useEffect, useMemo, useState } from 'react'
import GameCard from '../components/GameCard'

const API_URL = 'https://docking-635955947416.asia-east1.run.app/api/games/'

const modulo = (value, length) => ((value % length) + length) % length

const buildVisibleGames = (games, activeIndex) => {
  if (!games.length) {
    return []
  }

  if (games.length <= 6) {
    return games.map((game, index) => {
      const progress = ((index + 2) * 17) % 100

      return {
        ...game,
        sourceIndex: index,
        offset: index - activeIndex,
        progress: progress === 0 ? 88 : progress,
      }
    })
  }

  const offsets = [-2, -1, 0, 1, 2, 3]

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

  return (
    <div className="bios-page">
      <div className="bios-backdrop" aria-hidden="true" />

      <main className="bios-shell">
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
            <section className="bios-status-bar">
              <div className="bios-status-item">
                {/* <span className="bios-status-label">API Endpoint</span> */}
                <strong>{games.length} Games Loaded</strong>
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
                <strong>{activeGame?.name ?? 'None Selected'}</strong>
              </div>
            </section>

            <section className="bios-rail">
              <button type="button" className="bios-arrow bios-arrow-left" onClick={goPrev} aria-label="Previous game">
                <span className="bios-arrow-icon" aria-hidden="true">&#8249;</span>
              </button>

              <div className="bios-card-row" aria-label="Game list">
                {visibleGames.map((game) => (
                  <div
                    key={`${game.id}-${game.offset}`}
                    className={`bios-card-slot ${game.sourceIndex === activeIndex ? 'is-center' : ''}`}
                  >
                    <GameCard
                      game={game}
                      progress={game.progress}
                      isActive={game.sourceIndex === activeIndex}
                      onClick={() => setActiveIndex(game.sourceIndex)}
                    />
                  </div>
                ))}
              </div>

              <button type="button" className="bios-arrow bios-arrow-right" onClick={goNext} aria-label="Next game">
                <span className="bios-arrow-icon" aria-hidden="true">&#8250;</span>
              </button>
            </section>

            <section className="bios-footer">
              <div className="bios-active-copy">
                <p className="bios-active-slug">{activeGame?.slug ?? 'no-slug'}</p>
                <h1>{activeGame?.name ?? 'Game Hub'}</h1>
                <p>{activeGame?.description ?? 'Select a game to inspect its profile and launch state.'}</p>
                {typeof activeGame?.total_players === 'number' ? (
                  <p className="bios-active-players">total players // {activeGame.total_players}</p>
                ) : null}
              </div>

              <div className="bios-controls">
                <span>Select</span>
                <span>Navigate</span>
                <span>Back</span>
              </div>
            </section>

            <section className="bios-api-list">
              <div className="bios-api-list-header">
                <p className="bios-active-slug">Games From API Endpoint</p>
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
      </main>
    </div>
  )
}
