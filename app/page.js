'use client'

import { useEffect, useState } from 'react'
import GameCard from '../components/GameCard'

const API_URL = 'https://docking-635955947416.asia-east1.run.app/api/games/'

const cardThemes = [
  {
    bg: '#0b1d24',
    bg2: '#041015',
    accent: '#43d8ff',
    soft: 'rgba(67, 216, 255, 0.8)',
    glow: 'rgba(67, 216, 255, 0.28)',
    buttonFg: '#031119',
  },
  {
    bg: '#23110a',
    bg2: '#0f0603',
    accent: '#ff8a3d',
    soft: 'rgba(255, 138, 61, 0.8)',
    glow: 'rgba(255, 138, 61, 0.28)',
    buttonFg: '#170801',
  },
  {
    bg: '#1b1024',
    bg2: '#09050d',
    accent: '#ff67c8',
    soft: 'rgba(255, 103, 200, 0.8)',
    glow: 'rgba(255, 103, 200, 0.28)',
    buttonFg: '#190713',
  },
  {
    bg: '#0f2412',
    bg2: '#050b06',
    accent: '#62ff7f',
    soft: 'rgba(98, 255, 127, 0.8)',
    glow: 'rgba(98, 255, 127, 0.28)',
    buttonFg: '#051009',
  },
]

const buildTheme = (index) => cardThemes[index % cardThemes.length]

export default function Home() {
  const [activeSection, setActiveSection] = useState('home')
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const visibleGames = activeSection === 'home' ? games.slice(0, 4) : games

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

        const data = await response.json()
        const normalizedGames = Array.isArray(data)
          ? data.map((game, index) => ({
              ...game,
              theme: buildTheme(index),
            }))
          : []

        setGames(normalizedGames)
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

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container nav-container">
          <div className="logo">
            <span className="logo-text">GAME HUB</span>
          </div>
          <div className="nav-links">
            <button
              className={activeSection === 'home' ? 'active' : ''}
              onClick={() => setActiveSection('home')}
            >
              Home
            </button>
            <button
              className={activeSection === 'games' ? 'active' : ''}
              onClick={() => setActiveSection('games')}
            >
              Games
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <section className="games-section">
          <div className="container section-header">
            <h1>{activeSection === 'home' ? 'Featured Games' : 'All Games'}</h1>
            <p>{loading ? 'Loading the latest game catalog...' : `${games.length} games loaded from the API`}</p>
            {error ? <p className="section-error">{error}</p> : null}
          </div>

          {loading ? (
            <div className="container loading-state">Loading games...</div>
          ) : (
            <div className="games-grid container">
              {visibleGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => setActiveSection('games')}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Game Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
