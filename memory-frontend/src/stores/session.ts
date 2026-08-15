import { ref } from 'vue'
import { defineStore } from 'pinia'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const sessionStore = defineStore('session', () => {
  const user = ref<string | null>(null)
  const errorMessage = ref<string>('')
  const isResolved = ref<boolean>(false)

  async function login(userName: string): Promise<boolean> {
    errorMessage.value = ''
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userName }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        errorMessage.value = (data && (data.error || data.message)) || 'Error while connecting'
        return false
      }

      user.value = data?.username || null
      isResolved.value = true
      return !!user.value
    } catch (err) {
      console.error(err)
      errorMessage.value = 'Unable to reach the server'
      return false
    }
  }

  async function logout() {
    try {
      const { gameStore } = await import('./game')
      await gameStore().leaveGame()

      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Error while logout')
      }
    } catch (err) {
      console.error(err)
    } finally {
      user.value = null
      isResolved.value = true
    }
  }

  async function fetchUser() {
    try {
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.status === 401) {
        user.value = null
        return
      }

      if (!response.ok) {
        console.error('Unexpected error fetching user:', response.status)
        return
      }

      const data = await response.json()
      user.value = data.username || null

      if (data.gameId && user.value) {
        const { gameStore } = await import('./game')
        await gameStore().restoreGame(data.gameId)
      }
    } catch (err) {
      console.error('Network error while fetching user:', err)
    } finally {
      isResolved.value = true
    }
  }

  return { user, errorMessage, isResolved, login, logout, fetchUser }
})
