<script setup lang="ts">
  import { gameStore } from '@/stores/game';
  import GameComponent from '@/components/GameComponent.vue';
  import { useRouter } from 'vue-router';
  import { onMounted, onUnmounted, ref } from 'vue';
  import { sessionStore } from '@/stores/session';

  const gameSession: any = gameStore();
  const userSession: any = sessionStore();
  const showAlert = ref(false);
  let socket: WebSocket | null = null;
  const router = useRouter();

  onMounted(async () => {
    if(!userSession.user) {
      await userSession.fetchUser();
    }
    const socketUrl = import.meta.env.VITE_SOCKER_URL || "ws://localhost:3000";
    socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      const payload = {
        type: "registerSocket",
        username: userSession.user,
        gameId: gameSession.gameId,
      };
      socket!.send(JSON.stringify(payload));
      console.log("WebSocket connected");
    };

    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if(data.type === "playerJoined") {
        const player = data.player;
        gameSession.game.players.push(player);

      } else if (data.type === "playerDisconnected") {
        showAlert.value = true;
        setTimeout(async () => {
          showAlert.value = false;
          await gameSession.quitGame(userSession.user);
          router.push('/');
        }, 5000); // 5 sec

      } else if(data.type === "cardRevealed") {
        const { rowIndex, colIndex, card, nbCardRevealed } = data;
        gameSession.game.board[rowIndex][colIndex] = card;
        gameSession.game.nbCardRevealed = nbCardRevealed;

      }else if (data.type === "checkCardsMatch") {
        const { card1, card2, currentPlayerIndex, matchedPairs, gameIsOver, players, nbCardRevealed } = data;

        const x1 = parseInt(card1.x);
        const y1 = parseInt(card1.y);
        const x2 = parseInt(card2.x);
        const y2 = parseInt(card2.y);

        gameSession.game.board[x1][y1] = card1.card;
        gameSession.game.board[x2][y2] = card2.card;

        gameSession.game.currentPlayerIndex = currentPlayerIndex;
        gameSession.game.matchedPairs = matchedPairs;
        gameSession.game.gameIsOver = gameIsOver;
        gameSession.game.players = players;
        gameSession.game.nbCardRevealed = nbCardRevealed;

      }
    };

    socket.onerror = (event: Event) => {
      console.error("WebSocket error:", event);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    };
    if(gameSession.game && gameSession.game.nbCardRevealed == 2) {
      await gameSession.checkCardsMatch();
    }
  });

  onUnmounted(async () => {
    if (socket) {
      socket.close();
    }
  });

  async function handleCardClick(rowIndex: number, colIndex: number) {
    const card = gameSession.game.board[rowIndex][colIndex];
    if((!card.isRevealed || !card.isMatched) && !gameSession.game.gameIsOver && gameSession.game.nbCardRevealed < 2 && gameSession.game.currentPlayerIndex == gameSession.playerIndex) {
      console.log(`Row : ${rowIndex} | Col : ${colIndex}`);
      await gameSession.revealCard(rowIndex, colIndex);
      if(gameSession.game.nbCardRevealed == 2) {
        console.log("2 card revealed");
        setTimeout(async () => {
          await gameSession.checkCardsMatch();
        }, 3000); // 3sec
      }
    }
  }
</script>

<template>
  <div class="flex flex-col justify-center items-center h-80 px-4">
    <h1 v-if="showAlert" class="text-xl font-semibold text-pink-600 mb-4 drop-shadow-md">
      ⚠️ Player disconnected
    </h1>

    <h1 v-if="gameSession.game && gameSession.game.gameIsOver" class="text-xl font-bold text-violet-900 mb-4 drop-shadow-md">
      🎉 Game Is Over!
    </h1>

    <div
      v-if="gameSession.game && gameSession.game.players.length < 2"
      class="text-center bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-md w-full"
    >
      <div v-if="gameSession.gameId" class="mb-2 text-purple-800 font-semibold">
        Game ID: {{ gameSession.gameId }}
      </div>
      <div class="text-lg font-semibold text-purple-900">
        Waiting for player to join...
      </div>
    </div>

    <GameComponent v-else @card-clic="handleCardClick" />
  </div>
</template>


