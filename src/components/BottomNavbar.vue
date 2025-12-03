<template>
  <nav class="bottom-navbar">
    <router-link to="/home" class="nav-item" active-class="active">
      <i class="fas fa-home"></i>
      <span>Home</span>
    </router-link>
    <router-link to="/fatura" class="nav-item" active-class="active">
      <i class="fas fa-file-invoice"></i>
      <span>Fatura</span>
    </router-link>
    <router-link to="/ocr" class="nav-item" active-class="active">
      <i class="fas fa-camera"></i>
      <span>Despesa</span>
    </router-link>
    <router-link to="/configuracao" class="nav-item" active-class="active">
      <i class="fas fa-cog"></i>
      <span>Config</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
</script>

<style scoped>
.bottom-navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #ffffff;
  border-top: 1px solid #ddd;
  padding: 0.5rem 0;
  z-index: 1000;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #6c757d;
  font-size: 0.75rem;
  transition: color 0.2s;
  flex: 1;
}

.nav-item:hover,
.nav-item.active {
  color: #007bff;
}

.nav-item i {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}
</style>