<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNavbar from './components/BottomNavbar.vue'
import GlobalStyles from './components/GlobalStyles.vue'

const route = useRoute()
const showBottomNavbar = computed(() => {
  const name = String(route.name || '')
  return name !== 'login' && name !== 'register' && name !== 'ocr' && name !== 'admin'
})
const isHome = computed(() => route.name === 'home')
</script>

<template>
  <div
    class="vuexy-app"
    :class="{
      'has-bottom-navbar': showBottomNavbar,
      'home-fullscreen': isHome
    }"
  >
    <GlobalStyles />
    <RouterView />
    <BottomNavbar v-if="showBottomNavbar" />
  </div>
</template>

<style>
@import './vuexy/assets/styles/styles.scss';

.vuexy-app {
  min-height: 100vh;
  background: radial-gradient(1000px 700px at 20% 0%, #4c1d95 0%, #312e81 45%, #0f172a 100%);
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.vuexy-app.home-fullscreen {
  background: radial-gradient(1000px 700px at 20% 0%, #4c1d95 0%, #312e81 45%, #0f172a 100%);
}

/* Padding maior em telas médias e grandes */
@media (min-width: 768px) {
  .vuexy-app:not(.home-fullscreen) { padding: 1.5rem; }
}

@media (min-width: 992px) {
  .vuexy-app:not(.home-fullscreen) { padding: 2rem; }
}

body {
  margin: 0;
  background: radial-gradient(1000px 700px at 20% 0%, #4c1d95 0%, #312e81 45%, #0f172a 100%);
}

html, body, #app {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}

/* Aplica padding inferior quando a BottomNavbar está presente */
.has-bottom-navbar {
  padding-bottom: 90px;
}

::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 9999px;
  border: 2px solid rgba(15, 23, 42, 0.95);
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(191, 219, 254, 0.9);
}

html {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
}
</style>
