import { useEffect, useState } from 'react'

const STORAGE_KEY = 'solkollen-favoriter'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // Privat läge eller full lagring – favoriterna gäller då bara för den här visningen.
    }
  }, [favorites])

  const isFavorite = (place) => favorites.some((f) => f.id === place?.id)

  const toggle = (place) =>
    setFavorites((list) =>
      list.some((f) => f.id === place.id) ? list.filter((f) => f.id !== place.id) : [...list, place]
    )

  const remove = (id) => setFavorites((list) => list.filter((f) => f.id !== id))

  return { favorites, isFavorite, toggle, remove }
}
