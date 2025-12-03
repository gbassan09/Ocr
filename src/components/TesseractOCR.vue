<template>
  <div class="mb-3">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h2 class="h5 mb-0">Resultado do OCR</h2>
      <div class="btn-group">
        <button
          @click="copyTxt"
          :disabled="!ocrResult"
          class="btn btn-outline-secondary btn-sm"
        >
          <i class="fas fa-copy me-1"></i> Copiar
        </button>
        <button
          @click="downloadTxt"
          :disabled="!ocrResult"
          class="btn btn-outline-secondary btn-sm"
        >
          <i class="fas fa-download me-1"></i> Salvar TXT
        </button>
      </div>
    </div>

    <textarea
      v-model="ocrResult"
      placeholder="O texto reconhecido aparecerá aqui..."
      spellcheck="false"
      class="form-control font-monospace mb-3"
      style="min-height: 200px;"
    ></textarea>

    <!-- Extracted Fields -->
    <div class="mb-3">
      <h3 class="h5 mb-2">Campos Extraídos</h3>
      <div class="row g-3">
        <div class="col-12 col-sm-4">
          <div class="border rounded p-3 border-primary border-start border-3">
            <label class="text-uppercase small fw-bold text-muted">
              CNPJ
            </label>
            <p class="font-monospace mb-0 fw-medium">
              {{ extractedFields.cnpj || '—' }}
            </p>
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="border rounded p-3 border-success border-start border-3">
            <label class="text-uppercase small fw-bold text-muted">
              Data
            </label>
            <p class="font-monospace mb-0 fw-medium">
              {{ extractedFields.data || '—' }}
            </p>
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="border rounded p-3 border-primary border-start border-3">
            <label class="text-uppercase small fw-bold text-muted">
              Valor Total
            </label>
            <p class="font-monospace mb-0 fw-medium">
              {{ extractedFields.total ? extractedFields.total.toFixed(2) : '—' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 flex-wrap">
      <button
        @click="parseFields(ocrResult)"
        :disabled="!ocrResult"
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Re-extrair Campos
      </button>
      <button
        @click="showJson = !showJson"
        :disabled="!extractedFields.cnpj && !extractedFields.data && !extractedFields.total"
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ showJson ? 'Ocultar' : 'Ver' }} JSON
      </button>
    </div>

    <!-- JSON Display -->
    <div v-if="showJson" class="p-3 bg-gray-100 rounded-lg">
      <pre class="text-xs font-mono whitespace-pre-wrap text-gray-600">{{ getJson() }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, defineEmits } from 'vue';

const emit = defineEmits(['ocr-completed', 'ocr-progress']);

// Estados principais
const ocrStatus = ref('');
const ocrProgress = ref(0);
const ocrResult = ref('');
const extractedFields = reactive({
  cnpj: null,
  data: null,
  total: null,
});
const showJson = ref(false);
const isProcessing = ref(false);
const showPrompt = ref(false);
const customPrompt = ref(`Você é um sistema corporativo que extrai dados estruturados de notas fiscais.

REGRAS IMPORTANTES:
- Retorne SOMENTE JSON válido.
- Nunca inclua explicações, texto ou comentários.
- Siga exatamente o schema abaixo.
- Campos ausentes = null.
Tarefa:
Classifique cada item da nota fiscal em uma categoria de gasto.

Instruções:
Leia a descrição do produto/serviço.
Quero que coloque os ultimos numeros do cartão, caso esteja disponível na nota fiscal/fatura.
Caso você identifique que seja uma fatura coloque em tipoGasto = Fatura.
Determine o tipo de gasto mais adequado com base no que foi comprado.
Sempre responda usando apenas o nome da categoria, sem explicações adicionais.
Caso a descrição seja ambígua, escolha a categoria mais provável.
CATEGORIZE CADA TIPO DE PRODUTO NA FATURA por favor.

Categorias permitidas:
Alimentação — refeições, lanches, restaurantes, bebida alcólica e mercados relacionados a comida.
Transporte — Uber, táxi, combustível, passagens.
Saúde — medicamentos, farmácia, exames.
Educação — cursos, mensalidades, material escolar.
Lazer — cinema, jogos, eventos, bares.
Compras — roupas, eletrônicos, acessórios.
Serviços — manutenção, consertos, serviços gerais.
Moradia — aluguel, contas residenciais, móveis.
Outros — qualquer item que não se encaixe nas categorias acima.

Formato de resposta:
Retorne um JSON no formato:
{
  "descricao": "<texto do item>",
  "categoria": "<categoria>"
}

SCHEMA:
{
  "numeroCartao": number|null,
  "valorTotal": number|null,
  "data": "string|null",
  "tipoGasto": "string|null",
  "estabelecimento": "string|null",
  "itens": [
    {
      "descricao": "string|null",
      "quantidade": number|null,
      "valor": number|null
    }
  ]
}`);

function showToast(title, description, type = 'info') {
  alert(`${title}\n${description}`);
}

function copyTxt() {
  if (!ocrResult.value) {
    showToast('Nenhum texto', 'Não há texto para copiar.', 'error');
    return;
  }

  navigator.clipboard
    .writeText(ocrResult.value)
    .then(() => {
      showToast('Copiado!', 'Texto copiado para a área de transferência.');
    })
    .catch((err) => {
      console.error('Erro ao copiar:', err);
      showToast('Erro ao copiar', 'Não foi possível copiar o texto.', 'error');
    });
}

function downloadTxt() {
  if (!ocrResult.value) {
    showToast('Nenhum texto', 'Não há texto para baixar.', 'error');
    return;
  }

  const blob = new Blob([ocrResult.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ocr-nota-fiscal.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Arquivo salvo!', 'Texto salvo como TXT com sucesso.');
}

function getJson() {
  return JSON.stringify(extractedFields, null, 2);
}

function parseFields(text) {
  if (!text) {
    extractedFields.cnpj = extractedFields.data = extractedFields.total = null;
    return;
  }

  // Tenta primeiro interpretar como JSON do backend
  try {
    const parsed = JSON.parse(text);
    extractedFields.data = parsed?.data || null;
    extractedFields.total = typeof parsed?.valorTotal === 'number' ? parsed.valorTotal : null;
    // CNPJ não está presente no schema do backend; mantém valor atual ou null
    extractedFields.cnpj = extractedFields.cnpj || null;
    return;
  } catch (e) {
    // segue com heurísticas em texto puro
  }

  const txt = text.replace(/[\t\r]+/g, ' ').replace(/\s{2,}/g, ' ').toUpperCase();

  const mCNPJ =
    txt.match(/\b(\d{2}[\.\/-]?\d{3}[\.\/-]?\d{3}[\.\/-]?\d{4}[\.\/-]?\d{2})\b/) ||
    txt.match(/CNPJ[:\s]*(\d{2}[\.\/-]?\d{3}[\.\/-]?\d{3}[\.\/-]?\d{4}[\.\/-]?\d{2})/);

  const mData =
    txt.match(/\b(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})\b/) ||
    txt.match(/DATA[:\s]*(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})/);

  const mTotal = txt.match(
    /(TOTAL|VALOR\s*TOTAL|VALOR\s*A\s*PAGAR|TOTAL\s*A\s*PAGAR|VALOR\s*LIQUIDO)[^\d]*(\d{1,3}(?:[\.\,]\d{3})*[\.\,]\d{2})/
  );

  let cnpj = null;
  let data = null;
  let total = null;

  if (mCNPJ) {
    cnpj = mCNPJ[1] || mCNPJ[2] || mCNPJ[0];
    cnpj = cnpj.replace(/[\.\/-]/g, '');
    if (cnpj.length === 14) {
      cnpj = `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
    }
  }

  if (mData) {
    data = mData[1] || mData[2] || mData[0];
  }

  if (mTotal) {
    const totalStr = mTotal[2];
    if (totalStr) {
      let cleanTotal = totalStr.replace(/\./g, '').replace(',', '.');
      const parsedTotal = parseFloat(cleanTotal);
      if (!isNaN(parsedTotal)) {
        total = parsedTotal;
      }
    }
  }

  extractedFields.cnpj = cnpj;
  extractedFields.data = data;
  extractedFields.total = total;
}

async function runOCR(blob) {
  if (!blob) {
    showToast('Erro', 'Nenhuma imagem/arquivo para processar.', 'error');
    return;
  }

  ocrStatus.value = 'Enviando para processamento...';
  ocrProgress.value = 0;
  isProcessing.value = true;
  emit('ocr-progress', 0);

  try {
    let fileToSend;
    if (blob instanceof File) {
      fileToSend = blob;
    } else {
      const type = blob.type || 'image/png';
      fileToSend = new File([blob], 'captura.png', { type });
    }

    const form = new FormData();
    form.append('file', fileToSend);
    if (customPrompt.value && customPrompt.value.trim().length > 0) {
      form.append('prompt', customPrompt.value);
    }

    const resp = await fetch('http://localhost:5175/api/ocr', {
      method: 'POST',
      body: form,
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Falha no servidor: ${resp.status} ${errText}`);
    }
    const json = await resp.json();

    const jsonText = JSON.stringify(json, null, 2);
    ocrResult.value = jsonText;
    parseFields(jsonText);

    emit('ocr-completed', {
      text: jsonText,
      confidence: null,
      fields: { ...extractedFields }
    });

    showToast('OCR concluído', 'Dados estruturados extraídos com sucesso.');
    return jsonText;
  } catch (err) {
    console.error('Erro no OCR OpenAI:', err);
    ocrStatus.value = 'Erro no processamento: ' + (err.message || err);
    showToast('Erro no OCR', err.message || 'Falha ao processar o arquivo', 'error');
    throw err;
  } finally {
    isProcessing.value = false;
    ocrProgress.value = 0;
    emit('ocr-progress', 0);
  }
}

// Métodos expostos
defineExpose({
  runOCR,
  parseFields,
  setOcrResult: (text) => {
    ocrResult.value = text;
    parseFields(text);
  }
});
</script>