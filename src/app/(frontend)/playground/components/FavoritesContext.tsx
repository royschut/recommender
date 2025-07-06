import React, { createContext, useContext, useState, ReactNode } from 'react'

export type FavoriteMovie = {
  id: string
  title: string
  posterUrl?: string
}

type FavoritesContextType = {
  favorites: FavoriteMovie[]
  isFavorite: (id: string) => boolean
  addFavorite: (movie: FavoriteMovie) => void
  removeFavorite: (id: string) => void
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([])

  const isFavorite = (id: string) => favorites.some((m) => m.id === id)
  const addFavorite = (movie: FavoriteMovie) => {
    setFavorites((prev) => (isFavorite(movie.id) ? prev : [...prev, movie]))
  }
  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, addFavorite, removeFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider')
  return ctx
}
