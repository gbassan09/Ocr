import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json()); // Importante para ler JSON no body

// Inicializa Prisma Client
const prisma = new PrismaClient();

// Chave secreta JWT (idealmente no .env)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_key_123';

// Garantir diretórios de armazenamento
const storageDir = path.resolve('./storage');
const imagesDir = path.join(storageDir, 'images');

if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const upload = multer({ dest: path.resolve('./tmp') });

// --- MIDDLEWARES ---

// Middleware de Autenticação (Opcional por enquanto, mas recomendado)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, login, email, senha } = req.body;

    if (!nome || !login || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const existingUser = await prisma.beneficiario.findFirst({
      where: {
        OR: [{ login }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Login ou email já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const user = await prisma.beneficiario.create({
      data: {
        nome,
        login,
        email,
        senha: hashedPassword
      }
    });

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: user.id_beneficiario });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { loginOrEmail, senha } = req.body;

    const user = await prisma.beneficiario.findFirst({
      where: {
        OR: [
          { login: loginOrEmail },
          { email: loginOrEmail }
        ]
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(400).json({ error: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      { id: user.id_beneficiario, login: user.login, nome: user.nome },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id_beneficiario, 
        nome: user.nome, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
});


// --- ROTAS OCR ---

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
  "numeroCartao": number|string|null,
  "valorTotal": number|null,
  "data": "string|null",
  "tipoGasto": "string|null",
  "estabelecimento": "string|null",
  "itens": [
    {
      "descricao": "string|null",
      "quantidade": number|null,
      "valor": number|null,
      "categoria": "string|null"
    }
  ]
}
`;
}

// Função auxiliar para converter string de data dd/mm/yyyy para Date ISO
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  // Se já for ISO
  if (dateStr.includes('-') && dateStr.length >= 10) return new Date(dateStr);
  
  // Tenta formato brasileiro dd/mm/yyyy
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date();
}

// Rota protegida ou que aceita ID via body/header
app.post('/api/ocr', upload.single('file'), async (req, res) => {
  try {
    const confirm =
      ['1', 'true', 'yes'].includes(String(req.body?.confirm || '').toLowerCase());
    // Verifica token manualmente aqui para permitir uploads sem token (retrocompatibilidade)
    // ou enforce se desejar. Vamos tentar extrair o usuário do token se presente.
    let userId = req.body.userId ? parseInt(req.body.userId) : null;
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          userId = decoded.id;
        }
      } catch (e) {
        console.warn('Token inválido ou expirado no upload:', e.message);
      }
    }

    const filePath = req.file?.path;
    const originalName = req.file?.originalname || 'upload';
    
    // Tenta pegar o ID do beneficiário do body (enviado pelo frontend) ou usa 1 (default se não enviado, para compatibilidade)
    // Em produção, deveria pegar do token JWT decodificado (req.user.id)
    const beneficiarioId = userId || 1;

    console.log('--- Novo Arquivo Recebido ---');
    console.log('Caminho do arquivo (servidor):', filePath);
    console.log('Nome original:', originalName);
    console.log('ID Beneficiário:', beneficiarioId);

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

    let json;
    try {
      json = JSON.parse(rawOutput);
    } catch (err) {
      return res.status(422).json({ error: 'Resposta inválida da IA', raw: rawOutput });
    }

    if (!confirm) {
      if (filePath) fs.unlink(filePath, () => {});
      return res.json(json);
    }

    const timestamp = Date.now();
    const safeExt = ext || '.png';
    const storedFileName = `${timestamp}${safeExt}`;
    const storedFilePath = path.join(imagesDir, storedFileName);
    fs.copyFileSync(filePath, storedFilePath);
    fs.unlink(filePath, () => {});

    // Salva os dados no Banco de Dados via Prisma (SQLite)
    try {
      // Verifica se o usuário existe (para evitar erro de foreign key)
      const userExists = await prisma.beneficiario.findUnique({ where: { id_beneficiario: beneficiarioId } });
      
      // Se não existir o usuário 1 e nenhum outro foi passado, cria um padrão
      let finalUserId = beneficiarioId;
      if (!userExists) {
          // Tenta encontrar o primeiro usuário
          const firstUser = await prisma.beneficiario.findFirst();
          if (firstUser) {
              finalUserId = firstUser.id_beneficiario;
          } else {
             // Se não tiver nenhum usuário, cria um padrão
             const newUser = await prisma.beneficiario.create({
                 data: { nome: 'Usuário Padrão', login: 'admin', email: 'admin@admin.com', senha: '123' }
             });
             finalUserId = newUser.id_beneficiario;
          }
      }

      // Garante Tipos de Despesa Básicos
      let tipoDespesa = await prisma.tipoDespesa.findFirst();
      if (!tipoDespesa) {
         tipoDespesa = await prisma.tipoDespesa.create({ data: { descricao: 'Geral' } });
      }

      const isFatura = json.tipoGasto && json.tipoGasto.toLowerCase().includes('fatura');
      const dataEvento = parseDate(json.data);

      if (isFatura) {
        // Fluxo FATURA
        // Garante Cartão e Verificador Dummy se não existirem
        let cartao = await prisma.cartao.findFirst();
        if (!cartao) {
            cartao = await prisma.cartao.create({
                data: { numero: '0000', validade: new Date(), data_emissao: new Date(), id_beneficiario: finalUserId }
            });
        }
        let verificador = await prisma.verificador.findFirst();
        if (!verificador) {
            verificador = await prisma.verificador.create({
                data: { nome: 'Sistema', cargo: 'Auto', email: 'sys@sys.com' }
            });
        }

        const novaFatura = await prisma.fatura.create({
          data: {
            id_cartao: cartao.id_cartao,
            valor_fatura: typeof json.valorTotal === 'number' ? json.valorTotal : 0,
            data_fatura: dataEvento,
            id_verificador: verificador.id_verificador,
          }
        });

        const itensCriados = [];
        if (json.itens && Array.isArray(json.itens)) {
          for (const item of json.itens) {
            // Cria Despesa para o item
            const novaDespesa = await prisma.despesa.create({
              data: {
                id_tipo_despesa: tipoDespesa.id_tipo_despesa,
                id_beneficiario: finalUserId,
                data_despesa: dataEvento,
                valor: typeof item.valor === 'number' ? item.valor : 0,
                cnpj_fornecedor: json.estabelecimento || null,
              }
            });

            // Cria ItemFatura ligando
            const novoItem = await prisma.itemFatura.create({
              data: {
                id_fatura: novaFatura.id_fatura,
                id_despesa: novaDespesa.id_despesa,
                valor_item: typeof item.valor === 'number' ? item.valor : 0,
                data_item: dataEvento,
                status_analise: 'Pendente',
                justificativa: item.descricao || 'Item de fatura'
              }
            });
            itensCriados.push(novoItem);
          }
        }
        
        console.log(`Fatura salva ID: ${novaFatura.id_fatura}`);
        return res.json({ ...json, dbId: novaFatura.id_fatura, type: 'fatura' });

      } else {
        // Fluxo DESPESA AVULSA
        const novaDespesa = await prisma.despesa.create({
          data: {
            id_tipo_despesa: tipoDespesa.id_tipo_despesa,
            id_beneficiario: finalUserId,
            data_despesa: dataEvento,
            valor: typeof json.valorTotal === 'number' ? json.valorTotal : 0,
            cnpj_fornecedor: json.estabelecimento || null,
          }
        });
        
        console.log(`Despesa salva ID: ${novaDespesa.id_despesa}`);
        return res.json({ ...json, dbId: novaDespesa.id_despesa, type: 'despesa' });
      }

    } catch (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
      return res.json({ ...json, _warning: 'Erro ao salvar no banco de dados', _dbError: dbError.message });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

// Novo Endpoint: Listar Histórico (compatível com Home.vue)
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const despesas = await prisma.despesa.findMany({
      where: { id_beneficiario: userId },
      orderBy: { data_despesa: 'desc' },
      take: 50
    });
    
    // Para faturas, precisamos filtrar faturas que tenham itens do usuário ou cartão do usuário
    // Simplificando: Assumindo que o cartão é do usuário.
    const faturas = await prisma.fatura.findMany({
      where: {
        cartao: {
          id_beneficiario: userId
        }
      },
      include: { 
        items_fatura: {
          include: { despesa: true }
        } 
      },
      orderBy: { data_fatura: 'desc' },
      take: 20
    });

    const response = [];

    // Formata Despesas
    for (const d of despesas) {
       // Se quiser excluir despesas que já estão em faturas, precisaria verificar.
       // Mas por simplificação, mostra tudo.
       response.push({
         id: d.id_despesa,
         createdAt: d.data_despesa,
         extractedData: {
            data: d.data_despesa,
            valorTotal: d.valor,
            estabelecimento: d.cnpj_fornecedor || 'Despesa Avulsa',
            tipoGasto: 'Despesa',
            itens: [{ descricao: 'Despesa única', valor: d.valor }]
         }
       });
    }

    // Formata Faturas
    for (const f of faturas) {
       response.push({
         id: f.id_fatura,
         createdAt: f.data_fatura,
         extractedData: {
            data: f.data_fatura,
            valorTotal: f.valor_fatura,
            estabelecimento: 'Fatura Cartão',
            tipoGasto: 'Fatura',
            itens: f.items_fatura.map(i => ({
               descricao: i.justificativa,
               valor: i.valor_item,
               categoria: 'Item Fatura'
            }))
         }
       });
    }

    // Ordena por data (mais recente primeiro)
    response.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(response);
  } catch (err) {
    console.error(err);
    // Se der erro (ex: tabela não existe), retorna array vazio para não quebrar frontend
    res.json([]);
  }
});

const port = process.env.PORT || 5175;
app.listen(port, () => {
  console.log(`OCR API rodando em http://localhost:${port}`);
});
