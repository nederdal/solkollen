import { useEffect, useState } from 'react'
import { getCurrent, getForecast, hasApiKey, iconUrl } from './api.js'
import { useFavorites } from './favorites.js'
import { capitalize, formatDayMonth, formatWeekday, placeLabel, temp } from './format.js'
import SearchBar from './SearchBar.jsx'

const LAST_PLACE_KEY = 'solkollen-senaste-ort'

function loadLastPlace() {
  try {
    return JSON.parse(localStorage.getItem(LAST_PLACE_KEY)) || null
  } catch {
    return null
  }
}

export default function App() {
  const keyMissing = !hasApiKey()
  const { favorites, isFavorite, toggle, remove } = useFavorites()
  const [place, setPlace] = useState(() => (keyMissing ? null : loadLastPlace()))
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!place) return
    let cancelled = false
    setLoading(true)
    setError(null)
    try {
      localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(place))
    } catch {
      // ignoreras
    }
    Promise.all([getCurrent(place), getForecast(place)])
      .then(([current, forecast]) => {
        if (!cancelled) setWeather({ current, forecast })
      })
      .catch((err) => {
        if (!cancelled) {
          setWeather(null)
          setError(err)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [place])

  return (
    <div className="app">
      <header className="header">
        <img src="./favicon.svg" alt="" className="logo" width="44" height="44" />
        <div>
          <h1>Solkollen</h1>
          <p className="tagline">Vädret just nu och fem dagar framåt</p>
        </div>
      </header>

      <main>
        {keyMissing ? (
          <KeyMissing />
        ) : (
          <>
            <SearchBar onSelect={setPlace} onError={setError} />

            {favorites.length > 0 && (
              <section className="favorites" aria-label="Favoritorter">
                <h2 className="section-title">Favoriter</h2>
                <ul className="chips">
                  {favorites.map((f) => (
                    <li key={f.id} className={`chip ${place?.id === f.id ? 'chip-active' : ''}`}>
                      <button type="button" className="chip-main" onClick={() => setPlace(f)}>
                        {f.name}
                      </button>
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => remove(f.id)}
                        aria-label={`Ta bort ${f.name} från favoriter`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {error && <ErrorBox error={error} />}

            {!place && !error && (
              <div className="card empty">
                <p className="empty-sun" aria-hidden="true">☀️</p>
                <p>Sök efter en ort för att se vädret.</p>
              </div>
            )}

            {place && loading && !weather && <p className="loading">Hämtar väder…</p>}

            {place && weather && (
              <Weather
                place={place}
                weather={weather}
                loading={loading}
                favorite={isFavorite(place)}
                onToggleFavorite={() => toggle(place)}
              />
            )}
          </>
        )}
      </main>

      <footer className="footer">
        Väderdata från <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">OpenWeatherMap</a>
      </footer>
    </div>
  )
}

function Weather({ place, weather, loading, favorite, onToggleFavorite }) {
  const { current, forecast } = weather
  return (
    <div className={loading ? 'weather is-loading' : 'weather'}>
      <section className="card current" aria-label="Vädret just nu">
        <div className="current-top">
          <div className="current-place">
            <h2>{place.name}</h2>
            <p className="muted">{placeLabel(place, { withName: false })}</p>
          </div>
          <button
            type="button"
            className={`btn btn-fav ${favorite ? 'is-fav' : ''}`}
            onClick={onToggleFavorite}
            aria-pressed={favorite}
          >
            <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
            {favorite ? 'Sparad' : 'Spara'}
          </button>
        </div>

        <div className="current-main">
          <img src={iconUrl(current.icon)} alt="" width="100" height="100" className="current-icon" />
          <div>
            <p className="current-temp">{temp(current.temp)}</p>
            <p className="current-desc">{capitalize(current.description)}</p>
          </div>
        </div>

        <dl className="stats">
          <div>
            <dt>Känns som</dt>
            <dd>{temp(current.feelsLike)}</dd>
          </div>
          <div>
            <dt>Vind</dt>
            <dd>{Math.round(current.wind)} m/s</dd>
          </div>
          <div>
            <dt>Luftfuktighet</dt>
            <dd>{current.humidity} %</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Prognos för fem dagar">
        <h2 className="section-title">Kommande fem dagar</h2>
        <ul className="forecast">
          {forecast.map((day) => (
            <li key={day.key} className="card day">
              <p className="day-name">{capitalize(formatWeekday(day.date))}</p>
              <p className="muted day-date">{formatDayMonth(day.date)}</p>
              <img src={iconUrl(day.icon)} alt={day.description} width="64" height="64" />
              <p className="day-temps">
                <span className="max">{temp(day.max)}</span>
                <span className="min">{temp(day.min)}</span>
              </p>
              {day.pop > 0 && <p className="muted day-pop">💧 {day.pop} %</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function ErrorBox({ error }) {
  const title =
    error.kind === 'bad-key'
      ? 'API-nyckeln fungerar inte'
      : error.kind === 'network'
        ? 'Ingen anslutning'
        : 'Något gick fel'
  return (
    <div className="card notice notice-error" role="alert">
      <h2>{title}</h2>
      <p>{error.message || 'Ett oväntat fel inträffade. Försök igen.'}</p>
    </div>
  )
}

function KeyMissing() {
  return (
    <div className="card notice notice-error" role="alert">
      <h2>API-nyckel saknas</h2>
      <p>Appen behöver en API-nyckel från OpenWeatherMap för att kunna visa vädret.</p>
      <ol>
        <li>
          Skapa ett gratiskonto på{' '}
          <a href="https://openweathermap.org/api" target="_blank" rel="noreferrer">
            openweathermap.org
          </a>{' '}
          och kopiera din nyckel.
        </li>
        <li>
          Skapa filen <code>.env.local</code> i projektmappen med raden{' '}
          <code>VITE_OPENWEATHER_API_KEY=din-nyckel</code>.
        </li>
        <li>Starta om utvecklingsservern.</li>
      </ol>
    </div>
  )
}
