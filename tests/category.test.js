const {
  app, request, sequelize, resetDatabase, createUserAndToken,
} = require('./helpers');

describe('Categorias /v1/category', () => {
  let token;
  let categoryId;

  beforeAll(async () => {
    await resetDatabase();
    token = await createUserAndToken();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('retorna 401 ao criar sem token', async () => {
    const res = await request(app).post('/v1/category').send({ name: 'Shoes', slug: 'shoes' });
    expect(res.status).toBe(401);
  });

  it('cria categorias (201)', async () => {
    const res = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
    categoryId = res.body.id;

    await request(app).post('/v1/category').set('Authorization', `Bearer ${token}`).send({ name: 'Offers', slug: 'offers', use_in_menu: true });
    await request(app).post('/v1/category').set('Authorization', `Bearer ${token}`).send({ name: 'Black Friday', slug: 'black-friday' });
  });

  it('retorna 400 com dados inválidos', async () => {
    const res = await request(app).post('/v1/category').set('Authorization', `Bearer ${token}`).send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('retorna 400 com slug duplicado', async () => {
    const res = await request(app).post('/v1/category').set('Authorization', `Bearer ${token}`).send({ name: 'Outro', slug: 'shoes' });
    expect(res.status).toBe(400);
  });

  it('busca com paginação padrão', async () => {
    const res = await request(app).get('/v1/category/search');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 3, limit: 12, page: 1 });
    expect(res.body.data).toHaveLength(3);
  });

  it('busca com limit, page, fields e use_in_menu', async () => {
    const res = await request(app).get('/v1/category/search?limit=1&page=2&fields=name,slug&use_in_menu=true');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data).toEqual([{ name: 'Offers', slug: 'offers' }]);
  });

  it('busca todos com limit=-1', async () => {
    const res = await request(app).get('/v1/category/search?limit=-1');
    expect(res.body.data).toHaveLength(3);
    expect(res.body.limit).toBe(-1);
  });

  it('retorna 400 para parâmetros inválidos', async () => {
    expect((await request(app).get('/v1/category/search?limit=abc')).status).toBe(400);
    expect((await request(app).get('/v1/category/search?page=0')).status).toBe(400);
    expect((await request(app).get('/v1/category/search?fields=senha')).status).toBe(400);
  });

  it('obtém por ID (200/404)', async () => {
    expect((await request(app).get(`/v1/category/${categoryId}`)).status).toBe(200);
    expect((await request(app).get('/v1/category/9999')).status).toBe(404);
  });

  it('atualiza (204/404/400)', async () => {
    const ok = await request(app)
      .put(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tênis', slug: 'tenis', use_in_menu: false });
    expect(ok.status).toBe(204);
    const check = await request(app).get(`/v1/category/${categoryId}`);
    expect(check.body).toMatchObject({ name: 'Tênis', slug: 'tenis', use_in_menu: false });

    expect((await request(app).put('/v1/category/9999').set('Authorization', `Bearer ${token}`).send({ name: 'X' })).status).toBe(404);
    expect((await request(app).put(`/v1/category/${categoryId}`).set('Authorization', `Bearer ${token}`).send({ use_in_menu: 'sim' })).status).toBe(400);
  });

  it('remove (204/404/401)', async () => {
    expect((await request(app).delete(`/v1/category/${categoryId}`)).status).toBe(401);
    expect((await request(app).delete(`/v1/category/${categoryId}`).set('Authorization', `Bearer ${token}`)).status).toBe(204);
    expect((await request(app).delete(`/v1/category/${categoryId}`).set('Authorization', `Bearer ${token}`)).status).toBe(404);
  });
});
