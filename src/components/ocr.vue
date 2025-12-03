<template>
  <div class="ocr-screen">
    <header class="ocr-header">
      <h1 class="header-title">Despesas</h1>
    </header>

    <main class="ocr-main">
      <!-- Ações: Abrir Câmera e Ler OCR -->
      <div class="action-card">
        <button class="action-btn primary" @click="openCameraModal">
          <i class="fas fa-camera"></i>
          <span>Abrir Câmera</span>
        </button>
        <button class="action-btn secondary" @click="triggerUpload">
          <i class="fas fa-upload"></i>
          <span>Ler OCR</span>
        </button>
        <input ref="fileInputRef" type="file" accept=".pdf,image/*,.txt" class="d-none" @change="onFileChange" />
      </div>

      <!-- Modal de Câmera (apenas web) -->
      <div v-if="cameraOpen" class="modal-overlay" role="dialog" aria-modal="true">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Câmera</h2>
            <button class="close-btn" @click="closeCamera" aria-label="Fechar">×</button>
          </div>
          <div class="modal-body">
            <video ref="cameraVideoRef" autoplay playsinline class="camera-video"></video>
            <p v-if="cameraError" class="error-text">{{ cameraError }}</p>
          </div>
          <div class="modal-actions">
            <button class="action-btn primary" @click="captureFromCamera">
              <i class="fas fa-camera"></i>
              <span>Capturar</span>
            </button>
            <button class="action-btn secondary" @click="closeCamera">
              <span>Fechar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Apenas a segunda aba (TesseractOCR) -->
      <div class="ocr-panels">
        <div class="panel">
          <div class="panel-body">
            <TesseractOCR
              ref="tesseractOcrRef"
              @ocr-completed="handleOcrCompleted"
              @ocr-progress="handleOcrProgress"
            />
          </div>
        </div>
      </div>
    </main>

    <BottomNavbar />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import TesseractOCR from './TesseractOCR.vue';
import BottomNavbar from './BottomNavbar.vue';

const ocrProgress = ref(0);
const tesseractOcrRef = ref(null);
const fileInputRef = ref(null);
const cameraOpen = ref(false);
const cameraError = ref('');
const cameraVideoRef = ref(null);
let cameraStream = null;

function handleOcrCompleted(result) {
  console.log('OCR concluído com sucesso:', result);
}

function handleOcrProgress(progress) {
  ocrProgress.value = progress;
}

// Removido: função de exemplo dependente do YoloDetector

// Upload para OCR direto
function triggerUpload() {
  const el = fileInputRef.value;
  if (el) el.click();
}

function onFileChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (tesseractOcrRef.value) {
    tesseractOcrRef.value.runOCR(file);
  }
}

// Abrir modal e inicializar câmera (web)
async function openCameraModal() {
  cameraError.value = '';
  cameraOpen.value = true;
  await nextTick();
  await initCamera();
}

async function initCamera() {
  try {
    if (!navigator?.mediaDevices?.getUserMedia) throw new Error('Navegador sem suporte à câmera');
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = cameraVideoRef.value;
    if (video) {
      video.srcObject = cameraStream;
      await video.play();
    }
  } catch (err) {
    cameraError.value = err?.message || String(err);
  }
}

async function captureFromCamera() {
  try {
    const video = cameraVideoRef.value;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png', 1));
    if (blob && tesseractOcrRef.value) {
      await tesseractOcrRef.value.runOCR(blob);
    }
  } catch (err) {
    cameraError.value = err?.message || String(err);
  }
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  cameraOpen.value = false;
}
</script>

<style scoped>
.ocr-screen {
  --header-height: 64px;
  min-height: 100vh;
  background-color: #ffffff;
  padding-top: var(--header-height);
  padding-bottom: 5rem; /* espaço para BottomNavbar */
}

.ocr-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  background-image: linear-gradient(135deg, #2563eb, #1e40af);
  color: #fff;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.header-title { font-size: 17px; font-weight: 600; margin: 0; }

.ocr-main { display: flex; flex-direction: column; align-items: center; padding: 1rem; }
.ocr-main { gap: 1rem; }

.action-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 343px;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
}
.action-btn.primary { background-color: #2563eb; color: #fff; }
.action-btn.secondary { background-color: #f3f4f6; color: #1f2937; }

.status-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 343px;
  padding: 1rem 3.5rem;
  margin-bottom: 0.75rem;
  text-align: center;
}
.status-text { font-size: 12px; font-weight: 700; color: #4b5563; }

.ocr-panels { width: 100%; max-width: 1000px; display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 1rem; margin-left: auto; margin-right: auto; }
.panel { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.panel-body { padding: 1rem; }

/* Modal de câmera */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.2);
  width: clamp(280px, 92vw, 720px);
  max-height: 86vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eef2f7;
}
.modal-title { font-size: 16px; font-weight: 700; }
.close-btn { border: none; background: transparent; font-size: 20px; cursor: pointer; }
.modal-body { padding: 1rem; }
.camera-video { width: 100%; aspect-ratio: 16 / 9; max-height: 60vh; border-radius: 8px; background: #000; object-fit: contain; }
.modal-actions { display: flex; gap: 0.75rem; padding: 0.75rem 1rem; border-top: 1px solid #eef2f7; }
.error-text { color: #b91c1c; font-size: 12px; margin-top: 0.5rem; }

@media (min-width: 768px) {
  .ocr-screen { --header-height: 72px; }
  .header-title { font-size: 20px; }
  .ocr-panels { grid-template-columns: 1fr 1fr; }
}
</style>