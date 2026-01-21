<template>
  <div class="home-screen">
    <header class="header">
      <div>
        <p class="welcome-text">Bem-vindo de volta,</p>
        <h1 class="user-name">{{ firstName }}</h1>
      </div>
      <div class="user-avatar glass-card">
        <span class="avatar-text">{{ initials }}</span>
      </div>
    </header>

    <div class="stats-grid">
      <div class="glass-card stat-card">
        <div class="stat-header">
          <CreditCard class="stat-icon text-primary" />
        </div>
        <p class="stat-value">{{ formattedTotal }}</p>
        <p class="stat-label">Despesas do Mês</p>
      </div>

      <div class="glass-card stat-card">
        <div class="stat-header">
          <CheckCircle class="stat-icon text-success" />
        </div>
        <p class="stat-value">{{ approvedCount }}</p>
        <p class="stat-label">Cadastrados</p>
      </div>
    </div>

    <div class="glass-panel transactions-card">
      <div class="transactions-header">
        <h3 class="section-title">Últimas Despesas</h3>
        <RouterLink to="/despesas" class="view-all-btn">
          Ver todas
          <ArrowUpRight class="icon-sm" />
        </RouterLink>
      </div>

      <div class="transactions-list">
        <div v-if="loading" class="state-text">
          Carregando...
        </div>
        <div v-else-if="expenses.length === 0" class="state-text">
          Nenhuma despesa registrada.
        </div>
        <div v-else class="transactions-space">
          <div
            v-for="(tx, index) in latestExpenses"
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  CreditCard,
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
const currentUser = ref<any>(null)

const totalAmount = computed(() => {
  return expenses.value.reduce((acc, curr) => acc + (curr.amount || 0), 0)
})

const formattedTotal = computed(() => {
  return formatCurrency(totalAmount.value)
})

const approvedCount = computed(() => expenses.value.length)
const pendingCount = computed(() => 0)
const displayName = computed(() => {
  const u = currentUser.value || {}
  return u.nome || u.name || u.login || 'Usuário'
})
const firstName = computed(() => {
  const name: string = displayName.value || ''
  return name.trim().split(/\s+/)[0] || name
})
const initials = computed(() => {
  const name: string = displayName.value || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : (parts[0]?.[1] || '')
  return (first + last).toUpperCase()
})
const latestExpenses = computed(() => expenses.value.slice(0, 3))

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
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch('http://localhost:5175/api/expenses', {
      headers
    })

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
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const u = localStorage.getItem('user')
  if (u) {
    try { currentUser.value = JSON.parse(u) } catch {}
  }
  fetchExpenses()
})
</script>

<style scoped>
.home-screen {
  min-height: 100vh;
  background: radial-gradient(1000px 700px at 20% 0%, #4c1d95 0%, #6c6b8b 45%, #0f172a 100%);
  width: 100%;
  max-width: 28rem; /* ~448px, equivalente ao max-w-md */
  margin: 0 auto;
  padding: 1.5rem 1rem 2rem 1rem;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #ffffff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.welcome-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.user-avatar {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}

.avatar-text {
  font-size: 1.125rem;
  font-weight: 600;
}

.glass-card {
  background: linear-gradient(135deg, rgba(76, 29, 149, 0.28), rgba(30, 58, 138, 0.22));
  border-radius: 1rem;
  border: none;
  backdrop-filter: blur(12px);
  padding: 1rem;
}

.glass-card-strong {
  background: radial-gradient(circle at top left, rgba(76, 29, 149, 0.35), rgba(30, 58, 138, 0.25));
  border-radius: 1.25rem;
  border: none;
  backdrop-filter: blur(18px);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.balance-card .balance-bg-blur {
  position: absolute;
  top: -2.5rem;
  right: -2.5rem;
  width: 8rem;
  height: 8rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.5), rgba(139, 92, 246, 0.5));
  filter: blur(36px);
}

.balance-content {
  position: relative;
}

.balance-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.25rem;
}

.balance-value {
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0;
}

.balance-sub {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
}

.progress-bar-container {
  margin-top: 1rem;
  height: 0.5rem;
  width: 100%;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #2563eb, #8b5cf6);
  border-radius: 9999px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.stat-trend {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
}

.trend-icon {
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.9);
  margin: 0;
}

.text-primary {
  color: #2563eb;
}

.text-success {
  color: #10b981;
}

.text-warning {
  color: #f59e0b;
}

.transactions-card {
  padding: 1rem;
}

.transactions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.view-all-btn {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  color: #2563eb;
  font-size: 0.875rem;
  cursor: pointer;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
  margin-left: 0.25rem;
}

.state-text {
  text-align: center;
  padding: 1rem;
  font-size: 0.875rem;
  color: rgba(148, 163, 184, 0.9);
}

.transactions-space {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  transition: background 0.2s, transform 0.1s;
}

.transaction-item:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateY(-1px);
}

.transaction-icon-box {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-weight: 500;
  color: #ffffff;
  margin: 0;
  font-size: 0.95rem;
}

.transaction-meta {
  font-size: 0.75rem;
  color: rgba(209, 213, 219, 0.9);
  margin: 0;
}

.transaction-amount-box {
  text-align: right;
}

.transaction-amount {
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  font-size: 0.95rem;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  margin-top: 0.125rem;
}

.status-approved {
  background: rgba(16, 185, 129, 0.18);
  color: #6ee7b7;
}

.status-pending {
  background: rgba(245, 158, 11, 0.18);
  color: #fde68a;
}
</style>
