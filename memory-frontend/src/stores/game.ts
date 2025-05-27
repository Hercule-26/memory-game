import { ref } from 'vue'
import { defineStore } from 'pinia'

export const gameStore = defineStore('game', () => {
  const game = ref(null);
  const errorMessage = ref<string>("");

  async function createGame(gameName: string) {
    try {
      const response = await fetch("http://localhost:3000/game/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameId: gameName }),
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage.value = data;
        throw new Error(errorMessage.value);
      }
      game.value = data.game;
    } catch (err: any) {
      console.error("Error while creating game: ", err.message);
    }
  }
  return { game, errorMessage, createGame };
});
