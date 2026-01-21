import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import OCR from '../components/ocr.vue'
import Home from '../pages/Home.vue'
import Carteira from '../pages/Carteira.vue'
import Fatura from '../pages/Fatura.vue'
import Configuracao from '../pages/Configuracao.vue'
import Despesas from '../pages/Despesas.vue'
import Admin from '../pages/Admin.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/home', name: 'home', component: Home },
  { path: '/ocr', name: 'ocr', component: OCR },
  { path: '/carteira', name: 'carteira', component: Carteira },
  { path: '/fatura', name: 'fatura', component: Fatura },
  { path: '/despesas', name: 'despesas', component: Despesas },
  { path: '/admin', name: 'admin', component: Admin },
  { path: '/configuracao', name: 'configuracao', component: Configuracao },
]
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
