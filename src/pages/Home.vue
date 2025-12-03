<template>
  <div class="home-screen">
    <header class="home-header">
      <div class="header-content">
        <h1 class="header-title">Dashboard</h1>
        <p class="header-subtitle">Visão geral das despesas</p>
        <div class="header-box">
          <div class="box-label">Total de Despesas</div>
          <div class="box-value">R$ 5.430,00</div>
          <div class="box-caption">Este mês</div>
        </div>
      </div>
    </header>

    <main class="home-main">
      <div class="expenses-list">
        <ExpenseCard
          v-for="(expense, index) in expenses"
          :key="index"
          v-bind="expense"
        />
      </div>
    </main>

    <BottomNavbar />
  </div>
</template>

<script setup lang="ts">
import BottomNavbar from '../components/BottomNavbar.vue'
import ExpenseCard from '../components/ExpenseCard.vue'

interface Expense {
  date: string
  description: string
  category: string
  projectCode: string
  amount: number
  hasInvoice: boolean
}

const expenses: Expense[] = [
  {
    date: '15/07/2023',
    description: 'Almoço com cliente',
    category: 'Refeição',
    projectCode: 'PROJ-001',
    amount: 78.9,
    hasInvoice: true,
  },
  {
    date: '14/07/2023',
    description: 'Uber para reunião',
    category: 'Deslocamento',
    projectCode: 'PROJ-002',
    amount: 32.5,
    hasInvoice: true,
  },
]
</script>

<style scoped>
.home-screen {
  --header-height: 160px;
  min-height: 100vh;
  background-color: #f7f7f9; /* brisa-gray-50 */
  padding-top: var(--header-height);
  padding-bottom: 5rem; /* espaço para BottomNavbar */
}

.home-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-image: linear-gradient(135deg, #2563eb, #1e40af);
  color: #fff;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.header-content {
  padding: 12px 15px 27px 15px;
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
  margin: 0;
}

.header-subtitle {
  color: #fff;
  font-size: 12px;
  margin-top: 11px;
}

.header-box {
  background: #fff;
  border-radius: 8px;
  width: 156px;
  padding: 17px 20px;
  margin-top: 20px;
}

.box-label { color: #9ca3af; font-size: 10px; font-weight: 500; }
.box-value { color: #1f2a44; font-size: 15px; font-weight: 600; margin-top: 10px; }
.box-caption { color: #4b5563; font-size: 10px; margin-top: 10px; }

.home-main { padding: 16px 24px; }
.expenses-list { max-width: 328px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
</style>
