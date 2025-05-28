import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import CreateGameView from '@/views/CreateGameView.vue'
import GameView from '@/views/GameView.vue'
import LoginView from '@/views/LoginView.vue'
import { sessionStore } from '@/stores/session'
import { gameStore } from '@/stores/game'
import JoinGameView from '@/views/JoinGameView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/game/create',
      name: 'createGame',
      component: CreateGameView,
      meta: { requiresAuth: true },
    },
    {
      path: '/game/join',
      name: 'joinGame',
      component: JoinGameView,
      meta: { requiresAuth: true },
    },
    {
      path: '/game',
      name: 'game',
      component: GameView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})


router.beforeEach(async (to, from, next) => {
  const store = sessionStore();
  const game = gameStore();
  if (to.meta.requiresAuth && !store.user) {
    next({ name: 'login' });
  } 
  
  if(to.name === 'home' || to.name === 'createGame' || to.name === 'joinGame') {
    if(game.gameId) {
      router.push('/game');
    }
  }
  next();
})

export default router
