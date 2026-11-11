import { useState } from 'react'
import { searchPlaces } from './api.js'
import { placeLabel } from './format.js'

export default function SearchBar({ onSelect, onError, disabled }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setResults(null)
    try {
      const places = await searchPlaces(q)
      if (places.length === 1) {
        choose(places[0])
      } else {
        setResults(places)
      }
    } catch (err) {
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  function choose(place) {
    setResults(null)
    setQuery('')
    onSelect(place)
  }

  return (
    <div className="search">
      <form className="search-form" onSubmit={handleSubmit} role="search">
        <label htmlFor="search-input" className="visually-hidden">
          Sök ort
        </label>
        <input
          id="search-input"
          type="search"
          placeholder="Sök ort, t.ex. Göteborg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
          disabled={disabled}
        />
        <button type="submit" className="btn btn-primary" disabled={disabled || loading}>
          {loading ? 'Söker…' : 'Sök'}
        </button>
      </form>

      {results && (
        <div className="search-results" aria-live="polite">
          {results.length === 0 ? (
            <p className="muted">Ingen ort hittades. Prova att stava på ett annat sätt.</p>
          ) : (
            <ul>
              {results.map((p) => (
                <li key={p.id}>
                  <button type="button" className="result-btn" onClick={() => choose(p)}>
                    <span className="result-name">{p.name}</span>
                    <span className="muted">{placeLabel(p, { withName: false })}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
