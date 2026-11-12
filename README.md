# Digital Store API

API REST da loja **Digital Store (Drip Store)**, desenvolvida como projeto final de Back-end do curso **Geração Tech – Digital College**, seguindo o escopo do repositório [digitalcollegebr/projeto-backend](https://github.com/digitalcollegebr/projeto-backend).

**Integrante:** Webster Bezerra

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| Node.js + Express | Servidor HTTP e rotas da API |
| MySQL + Sequelize | Banco de dados, models e migrations |
| SQLite | Alternativa opcional para rodar sem instalar MySQL (e banco em memória nos testes) |
| JWT (jsonwebtoken) | Autenticação das rotas POST, PUT e DELETE |
| bcryptjs | Hash das senhas (mesmo algoritmo do bcrypt, sem compilação nativa) |
| Dotenv | Configuração por variáveis de ambiente |
| Nodemon | Reinício automático em desenvolvimento |
| Jest + Supertest | Testes automatizados dos endpoints |
| Swagger UI | Documentação interativa da API |

## Estrutura (MVC + Services)

```
backend/
├── public/media/          # imagens dos produtos (seed/ = imagens de exemplo)
├── src/
│   ├── config/            # banco de dados, conexão e JWT
│   ├── controllers/       # recebem a requisição e devolvem a resposta HTTP
│   ├── database/
│   │   ├── migrations/    # criação das tabelas
│   │   └── seeders/       # dados de exemplo
│   ├── docs/              # documentação OpenAPI (Swagger)
│   ├── middleware/        # autenticação JWT, validação de ID e tratamento de erros
│   ├── models/            # models do Sequelize e associações
│   ├── routes/            # definição das rotas /v1/...
│   ├── services/          # regras de negócio
│   ├── utils/             # helpers (erros, paginação, query strings)
│   ├── app.js             # configuração do Express
│   └── server.js          # inicialização do servidor
├── tests/                 # testes Jest
├── .env.example
└── package.json
```

## Banco de dados

| Tabela | Colunas |
| --- | --- |
| `users` | id, firstname, surname, email (único), password (hash), created_at, updated_at |
| `categories` | id, name, slug (único), use_in_menu, created_at, updated_at |
| `products` | id, enabled, name, slug (único), use_in_menu, stock, description, price, price_with_discount, created_at, updated_at |
| `product_images` | id, product_id (FK), enabled, path |
| `product_options` | id, product_id (FK), title, shape (square/circle), radius, type (text/color), values |
| `product_categories` | product_id (FK), category_id (FK) — chave primária composta |

As chaves estrangeiras usam `ON DELETE CASCADE`. Há índices em `products.name` (busca) e `product_categories.category_id` (filtro por categoria).

## Como rodar

Pré-requisito: **Node.js 18+**.

```bash
npm install
cp .env.example .env
```

### Opção A: MySQL (padrão do projeto)

Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` no `.env` e rode:

```bash
npm run db:create
npm run setup
npm run dev
```

### Opção B: SQLite (sem instalar nada)

No `.env`, troque `DB_DIALECT=mysql` por `DB_DIALECT=sqlite` e rode:

```bash
npm run setup
npm run dev
```

A API fica em `http://localhost:3000` e a documentação Swagger em **http://localhost:3000/docs**.

### Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Inicia com nodemon |
| `npm start` | Inicia em modo produção |
| `npm run db:create` | Cria o banco (MySQL) |
| `npm run setup` | Executa migrations e seeders |
| `npm run db:reset` | Desfaz tudo e recria com os dados de exemplo |
| `npm test` | Executa os testes (SQLite em memória, não precisa de banco) |

### Usuário de exemplo (seed)

- E-mail: `admin@digitalstore.com`
- Senha: `123@123`

O seed também cria 6 categorias e 16 produtos com imagens, opções (tamanho e cor) e categorias.

## Endpoints

Rotas marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Descrição | Status |
| --- | --- | --- | --- |
| POST | `/v1/user/token` | Gera o token JWT | 200, 400 |
| GET | `/v1/user/:id` | Obtém usuário | 200, 404 |
| POST | `/v1/user` | Cadastra usuário | 201, 400 |
| PUT 🔒 | `/v1/user/:id` | Atualiza usuário | 204, 400, 401, 404 |
| DELETE 🔒 | `/v1/user/:id` | Remove usuário | 204, 401, 404 |
| GET | `/v1/category/search` | Lista categorias (`limit`, `page`, `fields`, `use_in_menu`) | 200, 400 |
| GET | `/v1/category/:id` | Obtém categoria | 200, 404 |
| POST 🔒 | `/v1/category` | Cadastra categoria | 201, 400, 401 |
| PUT 🔒 | `/v1/category/:id` | Atualiza categoria | 204, 400, 401, 404 |
| DELETE 🔒 | `/v1/category/:id` | Remove categoria | 204, 401, 404 |
| GET | `/v1/product/search` | Lista produtos (`limit`, `page`, `fields`, `match`, `category_ids`, `price-range`, `option[id]`) | 200, 400 |
| GET | `/v1/product/:id` | Obtém produto | 200, 404 |
| POST 🔒 | `/v1/product` | Cadastra produto (imagens em base64) | 201, 400, 401 |
| PUT 🔒 | `/v1/product/:id` | Atualiza produto, imagens, opções e categorias | 204, 400, 401, 404 |
| DELETE 🔒 | `/v1/product/:id` | Remove produto | 204, 401, 404 |

### Exemplo rápido

```bash
# 1. Gerar o token
curl -X POST http://localhost:3000/v1/user/token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@digitalstore.com","password":"123@123"}'

# 2. Criar uma categoria usando o token
curl -X POST http://localhost:3000/v1/category \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Acessórios","slug":"acessorios","use_in_menu":true}'

# 3. Buscar produtos
curl "http://localhost:3000/v1/product/search?match=Nike&price-range=100-300&fields=name,price,images"
```

### Detalhes de implementação

- **Imagens:** no POST/PUT de produto as imagens chegam em base64 (`type` + `content`, ou data URL) e são salvas em `public/media/product-<id>/`. O banco guarda o caminho relativo e a API devolve a URL pública em `content`.
- **Atualização de imagens/opções:** item sem `id` é criado; com `id` e `deleted: true` é removido; com `id` e novos dados é atualizado. Opções aceitam `values` ou `value`, e `radius` aceita `4` ou `"4px"`.
- **`price-range`** filtra pelo preço final (`price_with_discount`).
- **`option[45]=GG,PP`** retorna produtos cuja opção 45 tenha algum dos valores informados.
- **Transações:** criação/atualização/remoção de produto rodam em transação; se algo falhar, nada é gravado e os arquivos enviados são descartados.
- **Token ausente ou inválido** retorna **401 Unauthorized**, como especificado na lista de status de cada endpoint.
- **Erros** sempre retornam JSON `{ "message": "...", "details": [...] }`.

## Testes

```bash
npm test
```

São 49 testes cobrindo o CRUD de usuários, categorias e produtos, autenticação JWT, filtros de busca, paginação e códigos de status HTTP.
