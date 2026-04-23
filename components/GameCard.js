'use client'

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

export default function GameCard({ game, onClick }) {
  const imageSrc = resolveImageUrl(game.image_url ?? game.image)
  const backgroundSrc = imageSrc
  const theme = game.theme ?? {}
  const cardStyle = {
    '--card-bg': theme.bg ?? '#111111',
    '--card-bg-2': theme.bg2 ?? '#050505',
    '--accent': theme.accent ?? game.playColor ?? '#00ff00',
    '--accent-soft': theme.soft ?? 'rgba(255, 255, 255, 0.75)',
    '--accent-glow': theme.glow ?? 'rgba(255, 255, 255, 0.25)',
    '--button-fg': theme.buttonFg ?? '#050505',
  }

  return (
    <div className="game-card" style={cardStyle} onClick={onClick}>
      <div className="game-image-container">
        <img src={backgroundSrc} alt="" aria-hidden="true" className="game-background" />
        <img src={imageSrc} alt={game.name ?? game.title} className="game-image" />
        <div className="game-overlay">
          <div className="game-badges">
            <span className="game-chip">ID {game.id ?? '-'}</span>
            <span className="game-chip">GAME {game.game_id ?? '-'}</span>
          </div>
          <h3 className="game-title">{game.name ?? game.title}</h3>
          <p className="game-slug">{game.slug ?? 'no-slug'}</p>
          <p className="game-description">{game.description ?? 'No description available.'}</p>
          <button
            className="play-button"
            onClick={(e) => {
              e.stopPropagation()
              alert(`Opening ${game.name ?? game.title}...`)
            }}
          >
            OPEN GAME
          </button>
        </div>
      </div>
    </div>
  )
}
