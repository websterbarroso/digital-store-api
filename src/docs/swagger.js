/**
 * Documentação OpenAPI 3 da API (servida em /docs pelo swagger-ui-express).
 */
const errorResponse = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const idParam = {
  name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 },
};

const paginationParams = [
  {
    name: 'limit', in: 'query', schema: { type: 'integer', default: 12, example: 12 }, description: 'Itens por página. Use -1 para buscar todos.',
  },
  {
    name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Página (ignorado quando limit=-1).',
  },
];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Digital Store API',
    version: '1.0.0',
    description:
      'API REST da loja Digital Store (Drip Store). Rotas POST, PUT e DELETE (exceto cadastro e login de usuário) '
      + 'exigem o cabeçalho `Authorization: Bearer <jwt>`. Gere o token em **POST /v1/user/token** '
      + '(usuário de exemplo: admin@digitalstore.com / 123@123) e clique em **Authorize**.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Usuários' },
    { name: 'Categorias' },
    { name: 'Produtos' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Dados da requisição inválidos' },
          details: { type: 'array', items: { type: 'string' } },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          firstname: { type: 'string', example: 'user firstname' },
          surname: { type: 'string', example: 'user surname' },
          email: { type: 'string', example: 'user@mail.com' },
        },
      },
      UserCreate: {
        type: 'object',
        required: ['firstname', 'surname', 'email', 'password', 'confirmPassword'],
        properties: {
          firstname: { type: 'string', example: 'user firstname' },
          surname: { type: 'string', example: 'user surname' },
          email: { type: 'string', example: 'user@mail.com' },
          password: { type: 'string', example: '123@123' },
          confirmPassword: { type: 'string', example: '123@123' },
        },
      },
      UserUpdate: {
        type: 'object',
        properties: {
          firstname: { type: 'string', example: 'user firstname' },
          surname: { type: 'string', example: 'user surname' },
          email: { type: 'string', example: 'user@mail.com' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Shoes' },
          slug: { type: 'string', example: 'shoes' },
          use_in_menu: { type: 'boolean', example: true },
        },
      },
      CategoryInput: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', example: 'Shoes' },
          slug: { type: 'string', example: 'shoes' },
          use_in_menu: { type: 'boolean', example: true },
        },
      },
      ProductOption: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Tamanho' },
          shape: { type: 'string', enum: ['square', 'circle'], example: 'square' },
          radius: { type: 'integer', example: 4 },
          type: { type: 'string', enum: ['text', 'color'], example: 'text' },
          values: { type: 'array', items: { type: 'string' }, example: ['P', 'M', 'G'] },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          enabled: { type: 'boolean', example: true },
          name: { type: 'string', example: 'Produto 01' },
          slug: { type: 'string', example: 'produto-01' },
          use_in_menu: { type: 'boolean', example: false },
          stock: { type: 'integer', example: 10 },
          description: { type: 'string', example: 'Descrição do produto 01' },
          price: { type: 'number', example: 119.9 },
          price_with_discount: { type: 'number', example: 99.9 },
          category_ids: { type: 'array', items: { type: 'integer' }, example: [1, 6] },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                content: { type: 'string', example: 'http://localhost:3000/media/product-1/imagem.png' },
              },
            },
          },
          options: { type: 'array', items: { $ref: '#/components/schemas/ProductOption' } },
        },
      },
      ProductCreate: {
        type: 'object',
        required: ['name', 'slug', 'price', 'price_with_discount'],
        properties: {
          enabled: { type: 'boolean', example: true },
          name: { type: 'string', example: 'Produto 01' },
          slug: { type: 'string', example: 'produto-01' },
          stock: { type: 'integer', example: 10 },
          description: { type: 'string', example: 'Descrição do produto 01' },
          price: { type: 'number', example: 119.9 },
          price_with_discount: { type: 'number', example: 99.9 },
          category_ids: { type: 'array', items: { type: 'integer' }, example: [1] },
          images: {
            type: 'array',
            description: 'Imagens em base64 (ou URL absoluta).',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'image/png' },
                content: { type: 'string', example: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
              },
            },
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Tamanho' },
                shape: { type: 'string', example: 'square' },
                radius: { type: 'string', example: '4px' },
                type: { type: 'string', example: 'text' },
                values: { type: 'array', items: { type: 'string' }, example: ['PP', 'M', 'GG'] },
              },
            },
          },
        },
      },
      ProductUpdate: {
        type: 'object',
        description:
          'Todos os campos são opcionais. Em images/options: item sem "id" é criado; '
          + 'item com "id" e "deleted: true" é removido; item com "id" e novos dados é atualizado.',
        example: {
          name: 'Produto 01 atualizado',
          price: 49.9,
          price_with_discount: 39.9,
          category_ids: [1],
          images: [{ id: 2, deleted: true }],
          options: [{ id: 1, values: ['42/43', '44/45'] }, { title: 'Tipo', values: ['100% algodão'] }],
        },
      },
    },
  },
  paths: {
    '/v1/user/token': {
      post: {
        tags: ['Usuários'],
        summary: 'Gera o token JWT (login)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@digitalstore.com' },
                  password: { type: 'string', example: '123@123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token gerado',
            content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } },
          },
          400: errorResponse('Credenciais ausentes ou incorretas'),
        },
      },
    },
    '/v1/user': {
      post: {
        tags: ['Usuários'],
        summary: 'Cadastra um usuário',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreate' } } } },
        responses: {
          201: { description: 'Usuário criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          400: errorResponse('Dados inválidos'),
        },
      },
    },
    '/v1/user/{id}': {
      get: {
        tags: ['Usuários'],
        summary: 'Obtém um usuário pelo ID',
        parameters: [idParam],
        responses: {
          200: { description: 'Usuário', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          404: errorResponse('Usuário não encontrado'),
        },
      },
      put: {
        tags: ['Usuários'],
        summary: 'Atualiza um usuário',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdate' } } } },
        responses: {
          204: { description: 'Atualizado' },
          400: errorResponse('Dados inválidos'),
          401: errorResponse('Token ausente ou inválido'),
          404: errorResponse('Usuário não encontrado'),
        },
      },
      delete: {
        tags: ['Usuários'],
        summary: 'Remove um usuário',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        responses: {
          204: { description: 'Removido' },
          401: errorResponse('Token ausente ou inválido'),
          404: errorResponse('Usuário não encontrado'),
        },
      },
    },
    '/v1/category/search': {
      get: {
        tags: ['Categorias'],
        summary: 'Lista categorias',
        parameters: [
          ...paginationParams,
          {
            name: 'fields', in: 'query', schema: { type: 'string', example: 'name,slug' }, description: 'Campos retornados',
          },
          {
            name: 'use_in_menu', in: 'query', schema: { type: 'boolean' }, description: 'Apenas categorias do menu',
          },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    page: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: errorResponse('Parâmetros inválidos'),
        },
      },
    },
    '/v1/category/{id}': {
      get: {
        tags: ['Categorias'],
        summary: 'Obtém uma categoria pelo ID',
        parameters: [idParam],
        responses: {
          200: { description: 'Categoria', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
          404: errorResponse('Categoria não encontrada'),
        },
      },
      put: {
        tags: ['Categorias'],
        summary: 'Atualiza uma categoria',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryInput' } } } },
        responses: {
          204: { description: 'Atualizada' },
          400: errorResponse('Dados inválidos'),
          401: errorResponse('Token ausente ou inválido'),
          404: errorResponse('Categoria não encontrada'),
        },
      },
      delete: {
        tags: ['Categorias'],
        summary: 'Remove uma categoria',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        responses: {
          204: { description: 'Removida' },
          401: errorResponse('Token ausente ou inválido'),
          404: errorResponse('Categoria não encontrada'),
        },
      },
    },
    '/v1/category': {
      post: {
        tags: ['Categorias'],
        summary: 'Cadastra uma categoria',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryInput' } } } },
        responses: {
          201: { description: 'Categoria criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
          400: errorResponse('Dados inválidos'),
          401: errorResponse('Token ausente ou inválido'),
        },
      },
    },
    '/v1/product/search': {
      get: {
        tags: ['Produtos'],
        summary: 'Lista produtos com filtros',
        parameters: [
          ...paginationParams,
          {
            name: 'fields', in: 'query', schema: { type: 'string', example: 'name,images,price' }, description: 'Campos retornados',
          },
          {
            name: 'match', in: 'query', schema: { type: 'string', example: 'Tênis' }, description: 'Termo no nome ou descrição',
          },
          {
            name: 'category_ids', in: 'query', schema: { type: 'string', example: '1,6' }, description: 'IDs de categorias',
          },
          {
            name: 'price-range', in: 'query', schema: { type: 'string', example: '100-200' }, description: 'Faixa de preço final (com desconto)',
          },
          {
            name: 'option[1]', in: 'query', schema: { type: 'string', example: '41,42' }, description: 'Valores da opção de ID 1 (troque o número pelo ID da opção)',
          },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    page: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: errorResponse('Parâmetros inválidos'),
        },
      },
    },
    '/v1/product/{id}': {
      get: {
        tags: ['Produtos'],
        summary: 'Obtém um produto pelo ID',
        parameters: [idParam],
        responses: {
          200: { description: 'Produto', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
          404: errorResponse('Produto não encontrado'),
        },
      },
      put: {
        tags: ['Produtos'],
        summary: 'Atualiza um produto',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductUpdate' } } } },
        responses: {
          204: { description: 'Atualizado' },
          400: errorResponse('Dados inválidos'),
          401: errorResponse('Token ausente ou inválido'),
          404: errorResponse('Produto não encontrado'),
        },
      },
      delete: {
        tags: ['Produtos'],
        summary: 'Remove um produto',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        responses: {
          204: { description: 'Removido' },
          401: errorResponse('Token ausente ou inválido'),
          404: errorResponse('Produto não encontrado'),
        },
      },
    },
    '/v1/product': {
      post: {
        tags: ['Produtos'],
        summary: 'Cadastra um produto',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductCreate' } } } },
        responses: {
          201: { description: 'Produto criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
          400: errorResponse('Dados inválidos'),
          401: errorResponse('Token ausente ou inválido'),
        },
      },
    },
  },
};
