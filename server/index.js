import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const app = express();
app.use(cors());

const upload = multer({ dest: path.resolve('./tmp') });

function buildPrompt() {
  return `
Você é um sistema corporativo que extrai dados estruturados de notas fiscais.

REGRAS IMPORTANTES:
- Retorne SOMENTE JSON válido.
- Nunca inclua explicações, texto ou comentários.
- Siga exatamente o schema abaixo.
- Campos ausentes = null.
Tarefa:
Classifique cada item da nota fiscal em uma categoria de gasto.

Instruções:
Leia a descrição do produto/serviço.
Quero que coloque os ultimos numeros do cartão, caso esteja disponível na nota fiscal/fatura
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
}
`;
}

app.post('/api/ocr', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file?.path;
    const originalName = req.file?.originalname || 'upload';
    if (!filePath) return res.status(400).json({ error: 'Arquivo não enviado.' });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = (req.body?.prompt && String(req.body.prompt)) || buildPrompt();
    const ext = path.extname(originalName).toLowerCase();
    let rawOutput = '{}';

    if (ext === '.pdf') {
      const uploaded = await client.files.create({ file: fs.createReadStream(filePath), purpose: 'user_data' });
      const response = await client.responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt },
              { type: 'input_file', file_id: uploaded.id },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      });
      rawOutput = response.output_text ?? '{}';
    } else if (ext === '.txt') {
      const text = fs.readFileSync(filePath, 'utf8');
      const response = await client.responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt },
              { type: 'input_text', text },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      });
      rawOutput = response.output_text ?? '{}';
    } else {
      // Trata imagem
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
      });
      rawOutput = completion.choices[0]?.message?.content ?? '{}';
    }

    // Remove temporário
    fs.unlink(filePath, () => {});

    let json;
    try {
      json = JSON.parse(rawOutput);
    } catch (err) {
      return res.status(422).json({ error: 'Resposta inválida da IA', raw: rawOutput });
    }

    return res.json(json);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

const port = process.env.PORT || 5175;
app.listen(port, () => {
  console.log(`OCR API rodando em http://localhost:${port}`);
});