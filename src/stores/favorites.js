import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  // 从localStorage读取收藏
  const favorites = ref(JSON.parse(localStorage.getItem('corpus-favorites') || '[]'))
  
  const isFavorite = computed(() => (id) => {
    return favorites.value.some(f => f.id === id)
  })
  
  const favoriteCount = computed(() => favorites.value.length)
  
  const addFavorite = (item) => {
    if (!isFavorite.value(item.id)) {
      favorites.value.push({
        id: item.id,
        en: item.en,
        zh: item.zh,
        theme: item.theme_zh,
        addedAt: new Date().toISOString()
      })
      saveToStorage()
    }
  }
  
  const removeFavorite = (id) => {
    const index = favorites.value.findIndex(f => f.id === id)
    if (index > -1) {
      favorites.value.splice(index, 1)
      saveToStorage()
    }
  }
  
  const toggleFavorite = (item) => {
    if (isFavorite.value(item.id)) {
      removeFavorite(item.id)
    } else {
      addFavorite(item)
    }
  }
  
  const saveToStorage = () => {
    localStorage.setItem('corpus-favorites', JSON.stringify(favorites.value))
  }
  
  return {
    favorites,
    isFavorite,
    favoriteCount,
    addFavorite,
    removeFavorite,
    toggleFavorite
  }
})