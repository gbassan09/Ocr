<template>
  <div class="fatura-screen">
    <header class="fatura-header">
      <h1 class="header-title">Conferência de Fatura</h1>
    </header>

    <main class="fatura-main">
      <div class="card-upload">
        <div class="upload-icon">
          <i class="fas fa-upload"></i>
        </div>
        <h2 class="upload-title">Carregar Fatura</h2>
        <p class="upload-desc">Faça upload da fatura do cartão corporativo para reconciliação</p>
      </div>

      <div class="card-list">
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

    <BottomNavbar />
  </div>
 </template>

 <script setup lang="ts">
 import BottomNavbar from '../components/BottomNavbar.vue'
 import CardItem from '../components/CardItem.vue'

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
 </script>

 <style scoped>
 .fatura-screen {
   --header-height: 64px;
   min-height: 100vh;
   background-color: #f7f7f9; /* brisa-gray-50 */
   padding-top: var(--header-height); /* evita conteúdo sob o header fixo */
   padding-bottom: 5rem; /* espaço para BottomNavbar */
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
   background-image: linear-gradient(135deg, #2563eb, #1e40af); /* brisa-blue → brisa-blue-dark */
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
   background: #fff;
   border-radius: 12px;
   box-shadow: 0 2px 8px rgba(0,0,0,0.06);
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

 .upload-title { font-size: 14px; font-weight: 700; color: #4b5563; }
 .upload-desc { font-size: 12px; color: #9ca3af; margin-top: 0.5rem; }

 .card-list {
   background: #fff;
   border-radius: 12px;
   box-shadow: 0 2px 8px rgba(0,0,0,0.06);
   width: 100%;
   max-width: 343px;
   padding: 1rem;
 }

 .list-title { font-size: 12px; font-weight: 700; color: #4b5563; margin-bottom: 1rem; }
 .list-items { display: flex; flex-direction: column; gap: 0.5rem; }

 /* Responsividade */
 @media (min-width: 768px) {
   .fatura-screen { --header-height: 72px; }
   .header-title { font-size: 20px; }
 }
 </style>