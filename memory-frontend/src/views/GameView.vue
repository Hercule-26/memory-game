<script setup lang="ts">
    import { gameStore } from '@/stores/game';
    import { sessionStore } from '@/stores/session';
    import { ref, onMounted } from 'vue';
    import { useRouter } from 'vue-router';

    const game = gameStore();
    const session = sessionStore();
    const router = useRouter();

    onMounted(async () => {
        if(!session.user) {
            await session.fetchUser();
        }
        if(!game.game) {
            router.push('/');
        }
    });
</script>

<template>
    <div>
        {{ game.game }}
    </div>
</template>

<style>

</style>