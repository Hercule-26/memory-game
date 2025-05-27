import { ref } from 'vue'
import { defineStore } from 'pinia'

export const gameStore = defineStore('game', () => {
  const game = ref(null);
  return { game };
});
