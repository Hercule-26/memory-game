<script setup lang="ts">
    import { gameStore } from '@/stores/game';
    import { sessionStore } from '@/stores/session';
    import { onMounted, onUnmounted } from 'vue';
    import { useRouter } from 'vue-router';

    const gameSession: any = gameStore();
    const session = sessionStore();
    const router = useRouter();

    let socket: WebSocket | null = null;

    
    onMounted(async () => {
        if(!session.user) {
            await session.fetchUser();
        }

        if(!gameSession.game) {
            router.push('/');
        }

        socket = new WebSocket("ws://localhost:3000");

        socket.onopen = () => {
            const payload = {
                type: "registerSocket",
                username: session.user,
                gameName: gameSession.game.partyName
            };
            socket!.send(JSON.stringify(payload));
            console.log("WebSocket connected");
        };

        socket.onmessage = (event: MessageEvent) => {
            console.log("Server :", event.data);
        };

        socket.onerror = (event: Event) => {
            console.error("WebSocket error:", event);
        };

        socket.onclose = () => {
            console.log("WebSocket closed");
        };
    });

    onUnmounted(() => {
        if (socket) {
            socket.close();
        }
    });

    function send(): void {
        if (socket && socket.readyState === WebSocket.OPEN) {
          const payload = {
            type: "message",
            username: session.user,
            gameName: gameSession.game.partyName
          };
          socket.send(JSON.stringify(payload));
          console.log("Sent to server:", payload);
        } else {
          console.error("WebSocket not connected");
        }
    }
</script>

<template>
    <div id="content">
        <button @click="send">Send message</button>
        <div v-if="gameSession.game && gameSession.game.players.length < 2" class="waiting-message">
            Waiting for player...
        </div>
        <div v-else>
            {{ gameSession.game }}
        </div>
    </div>
</template>

<style scoped>
    #content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 85vh;
    }
</style>