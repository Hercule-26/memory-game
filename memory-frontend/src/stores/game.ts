import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'
import { sessionStore } from '@/stores/session'

export interface PublicCard {
  value: number | null
  isRevealed: boolean
  isMatched: boolean
}

export interface PublicPlayer {
  name: string
  score: number
}

export interface PublicGame {
  partyName: string
  gameIsOver: boolean
  nbCardRevealed: number
  currentPlayerIndex: number
  matchedPairs: number
  totalPairs: number
  askedToRestart: string[]
  players: PublicPlayer[]
  board: PublicCard[][]
  isFull: boolean
}

interface SocketMessage {
  type: string
  gameId?: string
  game?: PublicGame
  username?: string
  code?: string
  error?: string
  reason?: string
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const socketUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3000'

const REQUEST_TIMEOUT_MS = 8000
const RECONNECT_BASE_MS = 500
const RECONNECT_MAX_MS = 10000
const OPPONENT_LEFT_DELAY_MS = 5000

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    })

    const raw = await response.text()
    let data: unknown = null
    if (raw) {
      try {
        data = JSON.parse(raw)
      } catch {
        data = null
      }
    }

    if (!response.ok) {
      const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
      const message =
        (typeof body?.error === 'string' && body.error) ||
        (typeof body?.message === 'string' && body.message) ||
        (typeof data === 'string' && data) ||
        `Request failed (${response.status})`
      throw new ApiError(message, response.status)
    }
    return data as T
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('The server took too long to answer', 0)
    }
    throw new ApiError('Unable to reach the server', 0)
  } finally {
    clearTimeout(timeout)
  }
}

function asApiError(err: unknown): ApiError {
  return err instanceof ApiError ? err : new ApiError('Unexpected error', 0)
}

export const gameStore = defineStore('game', () => {
  const session = sessionStore()

  const game = ref<PublicGame | null>(null)
  const gameId = ref<string | null>(null)
  const errorMessage = ref<string>('')
  const isConnected = ref<boolean>(false)
  const opponentLeft = ref<boolean>(false)
  const isBusy = ref<boolean>(false)

  let socket: WebSocket | null = null
  let reconnectAttempts = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let opponentLeftTimer: ReturnType<typeof setTimeout> | null = null
  let closedByClient = false

  const playerIndex = computed(() => {
    if (!game.value || !session.user) return null
    const index = game.value.players.findIndex((player) => player.name === session.user)
    return index === -1 ? null : index
  })

  const isMyTurn = computed(
    () => playerIndex.value !== null && game.value?.currentPlayerIndex === playerIndex.value
  )

  const canPlay = computed(
    () =>
      !!game.value &&
      game.value.isFull &&
      !game.value.gameIsOver &&
      game.value.nbCardRevealed < 2 &&
      isMyTurn.value
  )

  function applyState(nextGame: PublicGame | null, nextGameId?: string | null) {
    if (nextGameId) gameId.value = String(nextGameId)
    if (nextGame) game.value = nextGame
  }

  function resetState() {
    clearTimers()
    closeSocket()
    game.value = null
    gameId.value = null
    opponentLeft.value = false
    isConnected.value = false
  }

  function clearTimers() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (opponentLeftTimer) {
      clearTimeout(opponentLeftTimer)
      opponentLeftTimer = null
    }
  }

  function handleOnline() {
    if (gameId.value && !isConnected.value) connect()
  }

  function handleVisibility() {
    if (document.visibilityState === 'visible') handleOnline()
  }

  function closeSocket() {
    closedByClient = true
    window.removeEventListener('online', handleOnline)
    document.removeEventListener('visibilitychange', handleVisibility)
    if (socket) {
      socket.onopen = null
      socket.onmessage = null
      socket.onerror = null
      socket.onclose = null
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close()
      }
      socket = null
    }
    isConnected.value = false
  }

  function scheduleReconnect() {
    if (closedByClient || !gameId.value || reconnectTimer) return

    const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempts, RECONNECT_MAX_MS)
    reconnectAttempts++
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      openSocket()
    }, delay + Math.random() * 250)
  }

  function openSocket() {
    if (!gameId.value) return
    if (!session.user) return scheduleReconnect()
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      socket = new WebSocket(socketUrl)
    } catch {
      scheduleReconnect()
      return
    }

    socket.onopen = () => {
      reconnectAttempts = 0
      isConnected.value = true
      socket?.send(
        JSON.stringify({
          type: 'registerSocket',
          username: session.user,
          gameId: gameId.value,
        })
      )
    }

    socket.onmessage = (event: MessageEvent) => {
      let data: SocketMessage
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      if (!data || typeof data.type !== 'string') return

      switch (data.type) {
        case 'gameState':
          applyState(data.game ?? null, data.gameId)
          break

        case 'playerDisconnected':
          applyState(data.game ?? null, data.gameId)
          if (data.username !== session.user) handleOpponentLeft()
          break

        case 'error':
          if (data.code === 'GAME_NOT_FOUND' || data.code === 'FORBIDDEN') {
            errorMessage.value = data.error || 'This game is no longer available'
            leaveGame({ redirect: true })
          }
          break
      }
    }

    socket.onerror = () => {
      isConnected.value = false
    }

    socket.onclose = () => {
      isConnected.value = false
      scheduleReconnect()
    }
  }

  function connect() {
    closedByClient = false
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)
    openSocket()
  }

  function disconnect() {
    clearTimers()
    closeSocket()
  }

  function handleOpponentLeft() {
    if (opponentLeftTimer) return
    opponentLeft.value = true
    opponentLeftTimer = setTimeout(() => {
      opponentLeftTimer = null
      opponentLeft.value = false
      quitGame()
    }, OPPONENT_LEFT_DELAY_MS)
  }

  async function createGame(gameName: string): Promise<boolean> {
    errorMessage.value = ''
    try {
      const data = await request<{ gameId: string; game: PublicGame }>('/game/create', {
        method: 'POST',
        body: JSON.stringify({ gameName }),
      })
      applyState(data.game, data.gameId)
      return true
    } catch (err) {
      errorMessage.value = asApiError(err).message
      return false
    }
  }

  async function joinGame(gameIdJoin: string | number): Promise<boolean> {
    errorMessage.value = ''
    try {
      const data = await request<{ gameId: string; game: PublicGame }>(
        `/game/join/${encodeURIComponent(String(gameIdJoin))}`,
        { method: 'POST' }
      )
      applyState(data.game, data.gameId)
      return true
    } catch (err) {
      errorMessage.value = asApiError(err).message
      return false
    }
  }

  async function fetchGameDetails(id: string | number): Promise<boolean> {
    try {
      const data = await request<{ gameId: string; game: PublicGame }>(
        `/game/${encodeURIComponent(String(id))}`
      )
      applyState(data.game, data.gameId)
      return true
    } catch (err) {
      const error = asApiError(err)
      if (error.status === 404 || error.status === 403) {
        resetState()
        return false
      }
      errorMessage.value = error.message
      return false
    }
  }

  async function restoreGame(id: string | number): Promise<boolean> {
    gameId.value = String(id)
    const ok = await fetchGameDetails(id)
    if (!ok) gameId.value = null
    return ok
  }

  async function revealCard(rowIndex: number, colIndex: number): Promise<void> {
    if (!gameId.value || !canPlay.value || isBusy.value) return

    const card = game.value?.board?.[rowIndex]?.[colIndex]
    if (!card || card.isRevealed || card.isMatched) return

    isBusy.value = true
    try {
      const data = await request<{ gameId: string; game: PublicGame }>(
        `/game/reveal/${rowIndex}/${colIndex}`,
        { method: 'POST' }
      )
      applyState(data.game, data.gameId)
    } catch (err) {
      const error = asApiError(err)
      errorMessage.value = error.message
      if (error.status === 404) resetState()
    } finally {
      isBusy.value = false
    }
  }

  async function askedToRestart(): Promise<void> {
    if (!gameId.value || !session.user) return
    if (game.value?.askedToRestart.includes(session.user)) return

    try {
      const data = await request<{ gameId: string; game: PublicGame }>('/game/restart', {
        method: 'POST',
      })
      applyState(data.game, data.gameId)
    } catch (err) {
      const error = asApiError(err)
      errorMessage.value = error.message
      if (error.status === 404) resetState()
    }
  }

  async function leaveGame(options: { redirect?: boolean } = {}): Promise<void> {
    const hadGame = !!gameId.value
    resetState()
    if (hadGame) {
      await request('/game/exit', { method: 'POST' }).catch(() => null)
    }
    if (options.redirect && router.currentRoute.value.name !== 'home') {
      await router.push('/')
    }
  }

  function quitGame(): Promise<void> {
    return leaveGame({ redirect: true })
  }

  return {
    game,
    gameId,
    playerIndex,
    isMyTurn,
    canPlay,
    isConnected,
    opponentLeft,
    errorMessage,
    createGame,
    joinGame,
    quitGame,
    leaveGame,
    revealCard,
    askedToRestart,
    fetchGameDetails,
    restoreGame,
    connect,
    disconnect,
  }
})
