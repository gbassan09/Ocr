<template>
  <div class="auth-wrapper">
    <div class="row g-0 h-100">
      <!-- Coluna da ilustração (visível apenas em telas médias e maiores) -->
      <div class="col-md-8 d-none d-md-flex bg-primary">
        <div class="position-relative w-100 d-flex align-items-center justify-content-center">
          <div class="text-center text-white">
            <h1 class="display-4 fw-bold mb-4">
              <i class="fas fa-eye me-3"></i>
              Sistema OCR
            </h1>
            <p class="fs-5 mb-4">
              Faça login para acessar todas as funcionalidades de reconhecimento óptico de caracteres
            </p>
            <div class="mt-5">
              <i class="fas fa-file-image fa-5x opacity-75"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna do formulário de login -->
      <div class="col-12 col-md-4 d-flex align-items-center justify-content-center bg-light">
        <div class="card shadow-lg border-0" style="max-width: 400px; width: 100%;">
          <div class="card-body p-5">
            <div class="text-center mb-4">
              <h4 class="card-title mb-2">Bem-vindo! 👋</h4>
              <p class="text-muted mb-0">Faça login na sua conta para continuar</p>
            </div>

            <!-- Credenciais de demonstração -->
            <div class="alert alert-info alert-dismissible fade show" role="alert">
              <small><strong>Demo:</strong> admin@demo.com / admin123</small>
            </div>

            <form @submit.prevent="onSubmit">
              <!-- Campo de e-mail -->
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                  <input
                    id="email"
                    v-model="credentials.email"
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="exemplo@email.com"
                    required
                  >
                  <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
                </div>
              </div>

              <!-- Campo de senha -->
              <div class="mb-3">
                <label for="password" class="form-label">Senha</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="fas fa-lock"></i></span>
                  <input
                    id="password"
                    v-model="credentials.password"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'is-invalid': errors.password }"
                    placeholder="············"
                    required
                  >
                  <button type="button" class="btn btn-outline-secondary" @click="isPasswordVisible = !isPasswordVisible">
                    <i :class="isPasswordVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                  <div v-if="errors.password" class="invalid-feedback">{{ errors.password }}</div>
                </div>
              </div>

              <!-- Lembrar-me e Esqueci a senha -->
              <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="form-check">
                  <input id="rememberMe" v-model="rememberMe" class="form-check-input" type="checkbox">
                  <label class="form-check-label" for="rememberMe">Lembrar-me</label>
                </div>
                <a href="#" class="text-primary text-decoration-none">Esqueceu a senha?</a>
              </div>

              <!-- Botão de login -->
              <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ isLoading ? 'Entrando...' : 'Entrar' }}
              </button>

              <!-- Registro de nova conta -->
              <div class="text-center">
                <span class="text-muted">Novo por aqui? </span>
                <a href="#" class="text-primary text-decoration-none">Criar uma conta</a>
              </div>
            </form>

            <!-- Separador -->
            <div class="text-center my-4">
              <span class="text-muted">ou continue com</span>
            </div>

            <!-- Botões de redes sociais -->
            <div class="d-flex justify-content-center gap-2">
              <button class="btn btn-outline-primary btn-sm"><i class="fab fa-facebook-f"></i></button>
              <button class="btn btn-outline-danger btn-sm"><i class="fab fa-google"></i></button>
              <button class="btn btn-outline-info btn-sm"><i class="fab fa-twitter"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const emit = defineEmits(['login'])
const router = useRouter()

const isPasswordVisible = ref(false)
const isLoading = ref(false)
const errors = ref({ email: undefined, password: undefined })

const credentials = ref({ email: 'admin@demo.com', password: 'admin123' })
const rememberMe = ref(false)

const login = async () => {
  try {
    isLoading.value = true
    errors.value = { email: undefined, password: undefined }
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (credentials.value.email === 'admin@demo.com' && credentials.value.password === 'admin123') {
      const userData = { email: credentials.value.email, name: 'Administrador', role: 'admin' }
      emit('login', userData)
      router.push('/home')
    } else {
      errors.value.email = 'Credenciais inválidas'
      errors.value.password = 'Credenciais inválidas'
    }
  } catch (err) {
    console.error(err)
    errors.value.email = 'Erro no servidor'
  } finally {
    isLoading.value = false
  }
}

const onSubmit = () => {
  const email = credentials.value.email?.trim() || ''
  const password = credentials.value.password || ''
  errors.value = { email: undefined, password: undefined }
  if (!email) errors.value.email = 'E-mail é obrigatório'
  else if (!/.+@.+\..+/.test(email)) errors.value.email = 'E-mail deve ser válido'
  if (!password) errors.value.password = 'Senha é obrigatória'
  else if (password.length < 6) errors.value.password = 'Senha deve ter pelo menos 6 caracteres'
  if (!errors.value.email && !errors.value.password) login()
}
</script>

<style scoped>
.auth-wrapper { min-height: 100vh; }
</style>