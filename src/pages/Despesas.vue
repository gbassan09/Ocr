<template>
  <div class="expenses-screen">
    <div class="expenses-container">
      <header class="header">
        <h1 class="title">Todas as Despesas</h1>
        <p class="subtitle">Lista completa das suas despesas</p>
      </header>

      <div class="glass-panel transactions-card">
        <div class="transactions-header">
          <h3 class="section-title">Despesas</h3>
        </div>

        <div class="transactions-list">
          <div v-if="loading" class="state-text">Carregando...</div>
          <div v-else-if="expenses.length === 0" class="state-text">Nenhuma despesa registrada.</div>
          <div v-else class="transactions-space">
            <div
              v-for="(tx, index) in expenses"
              :key="index"
              class="transaction-item"
            >
              <div class="transaction-icon-box">
                <component :is="getCategoryIcon(tx.category)" class="icon-md text-primary" />
              </div>
              <div class="transaction-info">
                <p class="transaction-title">{{ tx.description }}</p>
                <p class="transaction-meta">{{ tx.category }} • {{ tx.date }}</p>
              </div>
              <div class="transaction-amount-box">
                <p class="transaction-amount">{{ formatCurrency(tx.amount) }}</p>
                <span
                  class="status-badge"
                  :class="tx.hasInvoice ? 'status-approved' : 'status-pending'"
                >
                  {{ tx.hasInvoice ? 'Aprovada' : 'Pendente' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  ShoppingBag,
  Coffee,
  Car,
  FileText
} from 'lucide-vue-next'

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getCategoryIcon(category: string) {
  const lower = category.toLowerCase()
  if (lower.includes('transporte') || lower.includes('uber') || lower.includes('combust')) return Car
  if (lower.includes('aliment') || lower.includes('restaurante') || lower.includes('almo')) return Coffee
  if (lower.includes('compra') || lower.includes('suprimento') || lower.includes('material')) return ShoppingBag
  return FileText
}

async function fetchExpenses() {
  try {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch('http://localhost:5175/api/expenses', { headers })
    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login'
      return
    }
    if (!response.ok) throw new Error('Erro ao buscar despesas')
    const data = await response.json()

    expenses.value = data.map((item: any) => {
      const isLegacy = !!item.extractedData
      const source = isLegacy ? item.extractedData : item
      const itemsList = isLegacy ? source.itens : source.items
      const firstItem = itemsList && itemsList.length > 0 ? itemsList[0] : {}
      return {
        date: source.data || new Date(item.createdAt).toLocaleDateString('pt-BR'),
        description: source.estabelecimento || firstItem.descricao || 'Despesa sem descrição',
        category: source.tipoGasto || source.categoria || firstItem.categoria || 'Outros',
        projectCode: `ID-${item.id.toString()}`,
        amount: source.valorTotal || firstItem.valor || 0,
        hasInvoice: true
      }
    })
  } finally {
    loading.value = false
  }
}

onMounted(fetchExpenses)
</script>

<style scoped>
.expenses-screen {
  min-height: auto;
  background: radial-gradient(1000px 700px at 20% 0%, #4c1d95 0%, #312e81 45%, #0f172a 100%);
  padding: 1rem 1rem 4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.expenses-container {
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
}
.header { margin-bottom: 1rem; }
.title { font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0 0.25rem 0; }
.subtitle { font-size: 0.875rem; color: rgba(255,255,255,0.6); margin: 0; }
.transactions-card { padding: 1rem; }
.transactions-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.section-title { font-size: 1rem; font-weight: 600; margin: 0; }
.state-text { text-align: center; padding: 1rem; font-size: 0.875rem; color: rgba(148, 163, 184, 0.9); }
.transactions-space { display: flex; flex-direction: column; gap: 0.75rem; }
.transaction-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 0.75rem; background: rgba(255,255,255,0.08); transition: background 0.2s, transform 0.1s; }
.transaction-item:hover { background: rgba(255,255,255,0.14); transform: translateY(-1px); }
.transaction-icon-box { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; }
.icon-md { width: 1.25rem; height: 1.25rem; }
.transaction-info { flex: 1; }
.transaction-title { font-weight: 500; color: #ffffff; margin: 0; font-size: 0.95rem; }
.transaction-meta { font-size: 0.75rem; color: rgba(209, 213, 219, 0.9); margin: 0; }
.transaction-amount-box { text-align: right; }
.transaction-amount { font-weight: 600; color: #ffffff; margin: 0; font-size: 0.95rem; }
.status-badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; margin-top: 0.125rem; }
.status-approved { background: rgba(16, 185, 129, 0.18); color: #6ee7b7; }
.status-pending { background: rgba(245, 158, 11, 0.18); color: #fde68a; }
</style>
