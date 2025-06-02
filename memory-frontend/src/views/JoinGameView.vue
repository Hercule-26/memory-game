<script setup lang="ts">
import { ref } from "vue";
import { gameStore } from "@/stores/game";
import { useRouter } from "vue-router";

const gameId = ref<number | null>(null);
const errorMessage = ref<string | null>(null);
const game = gameStore();
game.errorMessage = "";
const router = useRouter();

async function joinGame() {
  if (!gameId.value) {
    game.errorMessage = "The game id must not be blank";
  } else {
    errorMessage.value = null;
    await game.joinGame(gameId.value);
    if (game.game) {
      router.push("/game");
    }
  }
}
</script>

<template>
  <div class="flex items-center justify-center h-80 from-pink-50 via-fuchsia-50 to-violet-50 px-4">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 class="text-2xl font-bold text-violet-700 mb-6 text-center">Join a Game</h2>

      <form @submit.prevent="joinGame" class="flex flex-col gap-4">
        <input type="number" v-model="gameId" required placeholder="Game ID"
          class="border border-purple-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 text-purple-500 placeholder-purple-400"/>

        <button type="submit"
          class="bg-fuchsia-600 text-white py-2 rounded hover:bg-fuchsia-700 transition font-semibold">
          Join game
        </button>
      </form>

      <p v-if="game.errorMessage" class="text-pink-600 mt-4 text-center font-medium">
        {{ game.errorMessage }}
      </p>
    </div>
  </div>
</template>
