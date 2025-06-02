<script setup lang="ts">
import { gameStore } from '@/stores/game';

const emits = defineEmits(['cardClic']);
const gameSession: any = gameStore();

</script>

<template>
  <div class="max-w-xl mx-auto font-sans text-center px-4">
    <h1 class="text-2xl mb-4 text-white font-semibold">🎮 Party : {{ gameSession.game.partyName }}</h1>

    <div class="players mb-6">
      <h2 class="text-xl mb-2 text-white font-semibold">👥 Players</h2>
      <ul class="list-none p-0">
        <li v-for="(player, index) in gameSession.game.players" :key="index"
          :class="{
            'font-bold text-white bg-violet-700 rounded px-2 py-1 shadow-md': index === gameSession.game.currentPlayerIndex,
            'text-white/80': index !== gameSession.game.currentPlayerIndex
          }"
          class="mb-1 flex items-center justify-center">
          {{ player.name }} — {{ player.score }} pts
        </li>
      </ul>
    </div>

    <h2 class="text-xl mb-4 text-white font-semibold">🧠 Board</h2>
    <div class="board grid gap-2 mb-8">
      <div v-for="(row, rowIndex) in gameSession.game.board" :key="rowIndex" class="flex justify-center gap-2">
        <div v-for="(card, colIndex) in row" :key="colIndex" @click="emits('cardClic', rowIndex, colIndex)"
          class="card w-10 h-10 bg-white rounded-md flex items-center justify-center font-bold text-gray-800 shadow-md cursor-pointer select-none relative overflow-hidden transition">
          <div class="absolute inset-0 bg-gradient-to-tr from-pink-300 via-purple-300 to-violet-400 opacity-30 pointer-events-none rounded-md"></div>
          <span class="relative z-10" v-if="card.isMatched || card.isRevealed">
            {{ card.value }}
          </span>
          <span class="relative z-10 text-gray-400" v-else>❓</span>
        </div>
      </div>
    </div>




    <p class="text-white font-medium mb-6">
      ✅ Pairs found : {{ gameSession.game.matchedPairs }} / {{ gameSession.game.totalPairs }}
    </p>
  </div>
</template>
