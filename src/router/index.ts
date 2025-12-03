import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import OCR from '../components/ocr.vue'
import Home from '../pages/Home.vue'
import Carteira from '../pages/Carteira.vue'
import Fatura from '../pages/Fatura.vue'
import Configuracao from '../pages/Configuração.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login },
  { path: '/home', name: 'home', component: Home },
  { path: '/ocr', name: 'ocr', component: OCR },
  { path: '/carteira', name: 'carteira', component: Carteira },
  { path: '/fatura', name: 'fatura', component: Fatura },
  { path: '/configuracao', name: 'configuracao', component: Configuracao },
]
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router