import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { sessionStore } from './session';

export const gameStore = defineStore('game', () => {
  const userSession = sessionStore();
  const game = ref<any>(null);
  const gameId = ref<number | null>(null);
  const errorMessage = ref<string>("");
  let playerIndex = ref<number | null>(null);

  async function createGame(gameName: string) {
    try {
      const response = await fetch("http://localhost:3000/game/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameName: gameName }),
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage.value = data;
        throw new Error(errorMessage.value);
      }
      game.value = data.game;
      gameId.value = data.gameId;
    } catch (err: any) {
      console.error("Error while creating game: ", err.message);
    }
  }

  async function joinGame(gameIdJoin: number): Promise<any> {
    try {
      const response = await fetch(`http://localhost:3000/game/join/${gameIdJoin}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage.value = data;
      } else {
        game.value = data.game;
        gameId.value = gameIdJoin;
      }
    } catch (err: any) {
      console.error("Join game error:", err.message);
    }
  }

  async function quitGame(player: any) {
    if(gameId) {
      try {
        const response = await fetch(`http://localhost:3000/game/exit/${gameId.value}/${player}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          errorMessage.value = data;
        } else {
          game.value = null;
          gameId.value = null;
        }
      } catch (err: any) {
        console.error("error while exiting the game : ", err.message);
      }
    }
  }

  async function revealCard(rowIndex: number, colIndex: number) {
      if (!gameId.value) {
        console.log("GameId is null");
        return;
      }
      try {
        const response = await fetch(`http://localhost:3000/game/reveal/${rowIndex}/${colIndex}`, {
          method: "GET",
          credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
          const { rowIndex, colIndex, card, nbCardRevealed } = data;
          game.value.board[rowIndex][colIndex] = card;
          game.value.nbCardRevealed = nbCardRevealed;         
        } else {
          throw new Error(data);
        }
      } catch (err: any) {
        errorMessage.value = err.message;
      }
    }
  async function fetchGameDetails(id: number) {
    try {
      const response = await fetch(`http://localhost:3000/game/${id}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        game.value = data;
      } else {
        throw new Error(data);
      }
    } catch (err: any) {
      console.error("Fetch game error:", err.message);
    }
  }

  watch(gameId, async (newId) => {
    if (newId) {
      await fetchGameDetails(newId);
      playerIndex.value = game.value.players.findIndex((p: { name: string; }) => p.name === userSession.user);
    }
  });

  return { game, gameId, playerIndex, errorMessage, createGame, joinGame, quitGame, revealCard };
});
