<template>
  <div class="auth-wrapper">
    <div class="row g-0 h-100">
      <!-- Coluna da ilustração -->
      <div class="col-md-8 d-none d-md-flex bg-primary">
        <div class="position-relative w-100 d-flex align-items-center justify-content-center">
          <div class="text-center text-white">
            <h1 class="display-4 fw-bold mb-4">
              <i class="fas fa-user-plus me-3"></i>
              Junte-se a nós
            </h1>
            <p class="fs-5 mb-4">
              Crie sua conta e comece a gerenciar suas notas fiscais com facilidade.
            </p>
          </div>
        </div>
      </div>

      <!-- Coluna do formulário de registro -->
      <div class="col-12 col-md-4 d-flex align-items-center justify-content-center bg-light">
        <div class="card shadow-lg border-0" style="max-width: 400px; width: 100%;">
          <div class="card-body p-5">
            <div class="text-center mb-4">
              <h4 class="card-title mb-2">Crie sua conta 🚀</h4>
              <p class="text-muted mb-0">Preencha os dados abaixo para começar</p>
            </div>

            <form @submit.prevent="onSubmit">
              <!-- Nome -->
              <div class="mb-3">
                <label for="nome" class="form-label">Nome Completo</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="fas fa-user"></i></span>
                  <input
                    id="nome"
                    v-model="form.nome"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.nome }"
                    placeholder="Seu nome"
                    required
                  >
                  <div v-if="errors.nome" class="invalid-feedback">{{ errors.nome }}</div>
                </div>
              </div>

              <!-- Login (Username) -->
              <div class="mb-3">
                <label for="login" class="form-label">Usuário (Login)</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="fas fa-at"></i></span>
                  <input
                    id="login"
                    v-model="form.login"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.login }"
                    placeholder="usuario123"
                    required
                  >
                  <div v-if="errors.login" class="invalid-feedback">{{ errors.login }}</div>
                </div>
              </div>

              <!-- Email -->
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="exemplo@email.com"
                    required
                  >
                  <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
                </div>
              </div>

              <!-- Senha -->
              <div class="mb-3">
                <label for="senha" class="form-label">Senha</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="fas fa-lock"></i></span>
                  <input
                    id="senha"
                    v-model="form.senha"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'is-invalid': errors.senha }"
                    placeholder="············"
                    required
                  >
                  <button type="button" class="btn btn-outline-secondary" @click="isPasswordVisible = !isPasswordVisible">
                    <i :class="isPasswordVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                  <div v-if="errors.senha" class="invalid-feedback">{{ errors.senha }}</div>
                </div>
              </div>

              <!-- Botão de registro -->
              <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ isLoading ? 'Criando conta...' : 'Cadastrar' }}
              </button>

              <!-- Link para login -->
              <div class="text-center">
                <span class="text-muted">Já tem uma conta? </span>
                <router-link to="/login" class="text-primary text-decoration-none">Fazer login</router-link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isPasswordVisible = ref(false)
const isLoading = ref(false)
const errors = ref({})
const form = ref({
  nome: '',
  login: '',
  email: '',
  senha: ''
})

const register = async () => {
  try {
    isLoading.value = true
    errors.value = {}
    
    const response = await fetch('http://localhost:5175/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.error && data.error.includes('Login')) {
        errors.value.login = data.error
      } else if (data.error && data.error.includes('email')) {
        errors.value.email = data.error
      } else {
        alert(data.error || 'Erro ao registrar')
      }
      return
    }

    alert('Cadastro realizado com sucesso! Faça login.')
    router.push('/login')

  } catch (err) {
    console.error(err)
    alert('Erro de conexão com o servidor')
  } finally {
    isLoading.value = false
  }
}

const onSubmit = () => {
  errors.value = {}
  
  if (!form.value.nome) errors.value.nome = 'Nome é obrigatório'
  if (!form.value.login) errors.value.login = 'Login é obrigatório'
  if (!form.value.email) errors.value.email = 'Email é obrigatório'
  if (!form.value.senha) errors.value.senha = 'Senha é obrigatória'
  else if (form.value.senha.length < 6) errors.value.senha = 'A senha deve ter no mínimo 6 caracteres'

  if (Object.keys(errors.value).length === 0) {
    register()
  }
}
</script>

<style scoped>
.auth-wrapper { min-height: 100vh; }
</style>
