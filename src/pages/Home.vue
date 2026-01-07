<template>
  <div class="home-screen">
    <header class="home-header">
      <div class="header-content">
        <h1 class="header-title">Dashboard</h1>
        <p class="header-subtitle">Visão geral das despesas</p>
        <div class="header-box">
          <div class="box-label">Total de Despesas</div>
          <div class="box-value">{{ formattedTotal }}</div>
          <div class="box-caption">Este mês</div>
        </div>
      </div>
    </header>

    <main class="home-main">
      <div v-if="loading" class="text-center p-4">
        Carregando...
      </div>
      <div v-else-if="expenses.length === 0" class="text-center p-4 text-muted">
        Nenhuma despesa registrada.
      </div>
      <div v-else class="expenses-list">
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
import { ref, onMounted, computed } from 'vue'
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

const expenses = ref<Expense[]>([])
const loading = ref(true)

const totalAmount = computed(() => {
  return expenses.value.reduce((acc, curr) => acc + (curr.amount || 0), 0)
})

const formattedTotal = computed(() => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount.value)
})

async function fetchExpenses() {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('http://localhost:5175/api/expenses', {
      headers
    })
    
    if (response.status === 401 || response.status === 403) {
      // Token inválido ou não fornecido, redirecionar para login
      window.location.href = '/login';
      return;
    }

    if (!response.ok) throw new Error('Erro ao buscar despesas')
    
    const data = await response.json()
    
    // Mapeia os dados do backend para o formato do frontend
    expenses.value = data.map((item: any) => {
      // Suporte para estrutura antiga (JSON file) e nova (Banco de Dados Prisma)
      // Se tiver extractedData, é estrutura antiga. Se não, tenta campos na raiz.
      const isLegacy = !!item.extractedData;
      const source = isLegacy ? item.extractedData : item;
      const itemsList = isLegacy ? source.itens : source.items;
      
      // Tenta pegar o primeiro item da lista de itens ou usa dados gerais
      const firstItem = itemsList && itemsList.length > 0 ? itemsList[0] : {}
      
      return {
        date: source.data || new Date(item.createdAt).toLocaleDateString('pt-BR'),
        description: source.estabelecimento || firstItem.descricao || 'Despesa sem descrição',
        category: source.tipoGasto || source.categoria || firstItem.categoria || 'Outros',
        projectCode: `ID-${item.id.toString()}`, 
        amount: source.valorTotal || firstItem.valor || 0,
        hasInvoice: true // Como veio do OCR, tem nota
      }
    })
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchExpenses()
})
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
  background-image: linear-gradient(135deg, #2563EB, #222844);
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
