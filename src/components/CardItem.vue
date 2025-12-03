<template>
  <div class="card-item">
    <div class="card-left">
      <div class="brand">{{ cardType }}</div>
      <div class="number">•••• {{ cardNumber }}</div>
    </div>
    <div class="card-right">
      <div class="holder">{{ cardHolder }}</div>
      <div class="status" :class="statusClass">{{ status }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
interface Props {
  cardType: string
  cardNumber: string
  cardHolder: string
  status: string
}

const props = defineProps<Props>()

const statusClass = computed(() => {
  return props.status?.toLowerCase() === 'ativo' ? 'status-active' : 'status-inactive'
})
</script>

<style scoped>
.card-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.card-left { display: flex; flex-direction: column; }
.brand { font-weight: 600; color: #111827; }
.number { font-size: 12px; color: #6b7280; }

.card-right { text-align: right; }
.holder { font-size: 12px; color: #374151; }
.status { font-size: 12px; font-weight: 600; }
.status-active { color: #16a34a; }
.status-inactive { color: #ef4444; }
</style>