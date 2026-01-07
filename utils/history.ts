// History utility functions for localStorage

export interface HistoryItem {
  id: string
  timestamp: number
  input: any
  result: any
}

const MAX_HISTORY_ITEMS = 50

export function saveHistory(feature: 'speaking' | 'writing' | 'vocabulary', input: any, result: any) {
  try {
    const key = `history_${feature}`
    const existing = getHistory(feature)
    
    const newItem: HistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      input,
      result,
    }
    
    const updated = [newItem, ...existing].slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(key, JSON.stringify(updated))
    
    return newItem
  } catch (error) {
    console.error('Error saving history:', error)
    return null
  }
}

export function getHistory(feature: 'speaking' | 'writing' | 'vocabulary'): HistoryItem[] {
  try {
    const key = `history_${feature}`
    const data = localStorage.getItem(key)
    if (!data) return []
    
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading history:', error)
    return []
  }
}

export function clearHistory(feature: 'speaking' | 'writing' | 'vocabulary') {
  try {
    const key = `history_${feature}`
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error clearing history:', error)
  }
}

export function deleteHistoryItem(feature: 'speaking' | 'writing' | 'vocabulary', id: string) {
  try {
    const key = `history_${feature}`
    const existing = getHistory(feature)
    const updated = existing.filter(item => item.id !== id)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (error) {
    console.error('Error deleting history item:', error)
  }
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

