<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNavbar from './components/BottomNavbar.vue'
import GlobalStyles from './components/GlobalStyles.vue'

const route = useRoute()
const showBottomNavbar = computed(() => route.name !== 'login' && route.name !== 'ocr' && route.name !== 'register')
</script>

<template>
  <div class="vuexy-app" :class="{ 'has-bottom-navbar': showBottomNavbar }">
    <GlobalStyles />
    <RouterView />
    <BottomNavbar v-if="showBottomNavbar" />
  </div>
</template>

<style>
@import './vuexy/assets/styles/styles.scss';

.vuexy-app {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 1rem;
}

.card {
  border-radius: 0.5rem;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  background-color: #fff;
}

.card-body {
  padding: 1.5rem;
}

body {
  /* Removido: o padding inferior será aplicado apenas quando a BottomNavbar estiver visível */
}

/* Aplica padding inferior quando a BottomNavbar está presente */
.has-bottom-navbar {
  padding-bottom: 80px;
}

/* Padding maior em telas médias e grandes */
@media (min-width: 768px) {
  .vuexy-app { padding: 1.5rem; }
}

@media (min-width: 992px) {
  .vuexy-app { padding: 2rem; }
}
</style>
