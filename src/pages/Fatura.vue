<template>
  <div class="fatura-screen">
    <header class="fatura-header">
      <h1 class="header-title">Conferência de Fatura</h1>
    </header>

    <main class="fatura-main">
      <div class="glass-panel card-upload">
        <div class="upload-icon">
          <i class="fas fa-upload"></i>
        </div>
        <h2 class="upload-title">Carregar Fatura</h2>
        <p class="upload-desc">Faça upload da fatura do cartão corporativo para reconciliação</p>
        <div class="upload-actions">
          <button class="gradient-btn" @click="triggerUpload">
            <i class="fas fa-upload"></i>
            <span>Selecionar arquivo</span>
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".pdf,image/*,.txt"
            class="d-none"
            @change="onFileChange"
          />
        </div>
      </div>

      <div class="glass-panel card-list">
        <h3 class="list-title">Cartões Disponíveis</h3>
        <div class="list-items">
          <CardItem
            v-for="(card, index) in cards"
            :key="index"
            v-bind="card"
          />
        </div>
      </div>
    </main>
    <div v-if="isLoading" class="loading-overlay" aria-live="polite" aria-busy="true">
      <div class="loading-box">
        <div class="spinner"></div>
        <div>
          <div style="font-weight:600;">Processando fatura...</div>
          <div style="font-size:0.8rem; color:rgba(209,213,219,0.9);">Aguarde um instante</div>
        </div>
      </div>
    </div>
  </div>
 </template>

 <script setup lang="ts">
 import CardItem from '../components/CardItem.vue'
 import { ref } from 'vue'

 interface Card {
   cardType: string
   cardNumber: string
   cardHolder: string
   status: string
 }

 const cards: Card[] = [
   { cardType: 'Visa', cardNumber: '1234', cardHolder: 'João Silva', status: 'Ativo' },
   { cardType: 'Mastercard', cardNumber: '5678', cardHolder: 'Maria Souza', status: 'Ativo' },
 ]

const isLoading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerUpload() {
  const el = fileInputRef.value
  if (el) el.click()
}

async function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files && target.files[0]
  if (!file) return
  isLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1200))
  } finally {
    isLoading.value = false
  }
}
 </script>

 <style scoped>
.fatura-screen {
  --header-height: 64px;
  min-height: auto;
  background: radial-gradient(1000px 700px at 20% 0%, #4c1d95 0%, #312e81 45%, #0f172a 100%);
  padding-top: var(--header-height);
}

 .fatura-header {
   position: fixed;
   top: 0;
   left: 0;
   right: 0;
   height: var(--header-height);
   display: flex;
   align-items: center;
   gap: 0.75rem;
   padding: 0 1rem;
   background-image: linear-gradient(135deg, #2563EB, #222844);
   color: #fff;
   z-index: 1000;
   box-shadow: 0 2px 8px rgba(0,0,0,0.12);
 }

 .header-title {
   font-size: 16px;
   font-weight: 600;
   margin: 0;
 }

.fatura-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.card-upload {
  background: transparent;
  border-radius: 12px;
  box-shadow: none;
  width: 100%;
  max-width: 343px;
  padding: 1.5rem 3rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

 .upload-icon {
   display: flex;
   align-items: center;
   justify-content: center;
   width: 74px;
   height: 74px;
   border-radius: 50%;
   color: #4b5563; /* brisa-gray-700 */
   font-size: 48px;
   margin: 0 auto 0.5rem;
 }

.upload-title { font-size: 14px; font-weight: 700; color: #e5e7eb; }
.upload-desc { font-size: 12px; color: #9ca3af; margin-top: 0.5rem; }

.card-list {
  background: transparent;
  border-radius: 12px;
  box-shadow: none;
  width: 100%;
  max-width: 343px;
  padding: 1rem;
}

.list-title { font-size: 12px; font-weight: 700; color: #e5e7eb; margin-bottom: 1rem; }
.list-items { display: flex; flex-direction: column; gap: 0.5rem; }

 .upload-actions {
   display: flex;
   justify-content: center;
   gap: 0.75rem;
   margin-top: 0.75rem;
 }
 .gradient-btn {
   display: inline-flex;
   align-items: center;
   gap: 0.5rem;
   padding: 0.625rem 1.25rem;
   border-radius: 9999px;
   border: none;
   background: linear-gradient(to right, #2563eb, #8b5cf6);
   color: #ffffff;
   font-size: 0.875rem;
   font-weight: 600;
 }

 .loading-overlay {
   position: fixed;
   inset: 0;
   background: rgba(15, 23, 42, 0.65);
   backdrop-filter: blur(4px);
   display: flex;
   align-items: center;
   justify-content: center;
   z-index: 3000;
 }
 .loading-box {
   background: rgba(17, 24, 39, 0.9);
   border: 1px solid rgba(148, 163, 184, 0.5);
   border-radius: 1rem;
   padding: 1rem 1.25rem;
   display: flex;
   align-items: center;
   gap: 0.75rem;
   color: #fff;
 }
 .spinner {
   width: 24px;
   height: 24px;
   border: 3px solid rgba(148,163,184,0.35);
   border-top-color: #8b5cf6;
   border-radius: 50%;
   animation: spin 0.9s linear infinite;
 }
 @keyframes spin {
   to { transform: rotate(360deg); }
 }

 /* Responsividade */
 @media (min-width: 768px) {
   .fatura-screen { --header-height: 72px; }
   .header-title { font-size: 20px; }
 }
 </style>
