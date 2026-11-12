const fs = require('fs');
const path = require('path');
const {
  app, request, sequelize, resetDatabase, createUserAndToken, PNG_BASE64,
} = require('./helpers');

describe('Produtos /v1/product', () => {
  let token;
  let shoesId;
  let offersId;
  let productId;
  let product;

  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    await resetDatabase();
    token = await createUserAndToken();
    shoesId = (await request(app).post('/v1/category').set(auth()).send({ name: 'Shoes', slug: 'shoes' })).body.id;
    offersId = (await request(app).post('/v1/category').set(auth()).send({ name: 'Offers', slug: 'offers' })).body.id;
  });

  afterAll(async () => {
    await sequelize.close();
    fs.rmSync(process.env.MEDIA_DIR, { recursive: true, force: true });
  });

  describe('POST /v1/product', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).post('/v1/product').send({});
      expect(res.status).toBe(401);
    });

    it('cria produto com imagens, opções e categorias (201)', async () => {
      const res = await request(app).post('/v1/product').set(auth()).send({
        enabled: true,
        name: 'Tênis Runner',
        slug: 'tenis-runner',
        stock: 10,
        description: 'Tênis de corrida leve',
        price: 119.9,
        price_with_discount: 99.9,
        category_ids: [shoesId, offersId],
        images: [{ type: 'image/png', content: PNG_BASE64 }, { type: 'image/png', content: PNG_BASE64 }],
        options: [
          {
            title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', value: ['39', '40', '41'],
          },
          {
            title: 'Cor', shape: 'circle', type: 'color', values: ['#000', '#333'],
          },
        ],
      });

      expect(res.status).toBe(201);
      product = res.body;
      productId = product.id;
      expect(product.category_ids).toEqual([shoesId, offersId]);
      expect(product.images).toHaveLength(2);
      expect(product.images[0].content).toMatch(/^http:\/\/localhost:3000\/media\/product-\d+\/.+\.png$/);
      expect(product.options[0]).toMatchObject({ title: 'Tamanho', radius: 4, values: ['39', '40', '41'] });

      // arquivo salvo em disco
      const relative = product.images[0].content.split('/media/')[1];
      expect(fs.existsSync(path.join(process.env.MEDIA_DIR, relative))).toBe(true);
    });

    it('cria um segundo produto sem desconto', async () => {
      const res = await request(app).post('/v1/product').set(auth()).send({
        name: 'Camiseta Básica', slug: 'camiseta-basica', price: 49.9, price_with_discount: 49.9, category_ids: [offersId],
      });
      expect(res.status).toBe(201);
      expect(res.body.enabled).toBe(false); // valor padrão
      expect(res.body.stock).toBe(0);
    });

    it('retorna 400 com dados inválidos', async () => {
      const res = await request(app).post('/v1/product').set(auth()).send({ name: 'Sem preço', slug: 'sem-preco' });
      expect(res.status).toBe(400);
    });

    it('retorna 400 com categoria inexistente', async () => {
      const res = await request(app).post('/v1/product').set(auth()).send({
        name: 'X', slug: 'x', price: 1, price_with_discount: 1, category_ids: [999],
      });
      expect(res.status).toBe(400);
    });

    it('retorna 400 com tipo de imagem inválido', async () => {
      const res = await request(app).post('/v1/product').set(auth()).send({
        name: 'Y', slug: 'y', price: 1, price_with_discount: 1, images: [{ type: 'text/plain', content: 'abc' }],
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/product/search', () => {
    it('lista produtos com paginação', async () => {
      const res = await request(app).get('/v1/product/search');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 2, limit: 12, page: 1 });
    });

    it('filtra por match', async () => {
      const res = await request(app).get('/v1/product/search?match=corrida');
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].slug).toBe('tenis-runner');
    });

    it('filtra por category_ids', async () => {
      expect((await request(app).get(`/v1/product/search?category_ids=${shoesId}`)).body.total).toBe(1);
      expect((await request(app).get(`/v1/product/search?category_ids=${shoesId},${offersId}`)).body.total).toBe(2);
    });

    it('filtra por price-range', async () => {
      const res = await request(app).get('/v1/product/search?price-range=40-60');
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].slug).toBe('camiseta-basica');
    });

    it('filtra por option[id]', async () => {
      const optionId = product.options[0].id;
      expect((await request(app).get(`/v1/product/search?option[${optionId}]=40,45`)).body.total).toBe(1);
      expect((await request(app).get(`/v1/product/search?option[${optionId}]=45`)).body.total).toBe(0);
    });

    it('limita os campos com fields', async () => {
      const res = await request(app).get('/v1/product/search?fields=name,price&limit=1');
      expect(res.body.data).toEqual([{ name: 'Tênis Runner', price: 119.9 }]);
    });

    it('retorna 400 para parâmetros inválidos', async () => {
      expect((await request(app).get('/v1/product/search?price-range=abc')).status).toBe(400);
      expect((await request(app).get('/v1/product/search?category_ids=a,b')).status).toBe(400);
      expect((await request(app).get('/v1/product/search?limit=0')).status).toBe(400);
    });
  });

  describe('GET /v1/product/:id', () => {
    it('retorna o produto (200)', async () => {
      const res = await request(app).get(`/v1/product/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: productId, name: 'Tênis Runner', price_with_discount: 99.9 });
    });

    it('retorna 404 para produto inexistente', async () => {
      expect((await request(app).get('/v1/product/9999')).status).toBe(404);
      expect((await request(app).get('/v1/product/abc')).status).toBe(404);
    });
  });

  describe('PUT /v1/product/:id', () => {
    it('retorna 401 sem token', async () => {
      expect((await request(app).put(`/v1/product/${productId}`).send({ name: 'A' })).status).toBe(401);
    });

    it('atualiza campos, imagens, opções e categorias (204)', async () => {
      const [img1, img2] = product.images;
      const [opt1, opt2] = product.options;

      const res = await request(app).put(`/v1/product/${productId}`).set(auth()).send({
        name: 'Tênis Runner 2',
        slug: 'tenis-runner-2',
        price: 49.9,
        price_with_discount: 0,
        category_ids: [shoesId],
        images: [
          { type: 'image/png', content: PNG_BASE64 }, // nova
          { id: img1.id, deleted: true }, // removida
          { id: img2.id, content: img2.content }, // mantida
        ],
        options: [
          { id: opt1.id, deleted: true },
          { id: opt2.id, radius: '10px', value: ['#fff'] },
          {
            title: 'Tipo', shape: 'square', type: 'text', values: ['100% algodão', '65% algodão'],
          },
        ],
      });
      expect(res.status).toBe(204);

      const updated = (await request(app).get(`/v1/product/${productId}`)).body;
      expect(updated).toMatchObject({ name: 'Tênis Runner 2', price: 49.9, category_ids: [shoesId] });
      expect(updated.images).toHaveLength(2);
      expect(updated.images.map((i) => i.id)).not.toContain(img1.id);
      expect(updated.options).toHaveLength(2);
      expect(updated.options.find((o) => o.id === opt2.id)).toMatchObject({ radius: 10, values: ['#fff'] });
      expect(updated.options.find((o) => o.title === 'Tipo').values).toEqual(['100% algodão', '65% algodão']);
    });

    it('retorna 400 com dados inválidos', async () => {
      expect((await request(app).put(`/v1/product/${productId}`).set(auth()).send({ price: 'caro' })).status).toBe(400);
      expect((await request(app).put(`/v1/product/${productId}`).set(auth()).send({ images: [{ id: 9999, deleted: true }] })).status).toBe(400);
    });

    it('retorna 404 para produto inexistente', async () => {
      expect((await request(app).put('/v1/product/9999').set(auth()).send({ name: 'A' })).status).toBe(404);
    });
  });

  describe('DELETE /v1/product/:id', () => {
    it('retorna 401 sem token', async () => {
      expect((await request(app).delete(`/v1/product/${productId}`)).status).toBe(401);
    });

    it('remove o produto (204) e depois retorna 404', async () => {
      expect((await request(app).delete(`/v1/product/${productId}`).set(auth())).status).toBe(204);
      expect((await request(app).get(`/v1/product/${productId}`)).status).toBe(404);
      expect((await request(app).delete(`/v1/product/${productId}`).set(auth())).status).toBe(404);
    });
  });
});

describe('Rotas gerais', () => {
  it('retorna 404 para rota inexistente', async () => {
    const res = await request(app).get('/v1/nao-existe');
    expect(res.status).toBe(404);
  });

  it('retorna 400 para JSON malformado', async () => {
    const res = await request(app).post('/v1/user').set('Content-Type', 'application/json').send('{"a":');
    expect(res.status).toBe(400);
  });
});
