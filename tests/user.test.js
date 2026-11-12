const {
  app, request, sequelize, resetDatabase,
} = require('./helpers');

const validUser = {
  firstname: 'Maria',
  surname: 'Silva',
  email: 'maria@mail.com',
  password: '123@123',
  confirmPassword: '123@123',
};

describe('Usuários /v1/user', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /v1/user', () => {
    it('cadastra um usuário (201) sem retornar a senha', async () => {
      const res = await request(app).post('/v1/user').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(Number), firstname: 'Maria', surname: 'Silva', email: 'maria@mail.com',
      });
      userId = res.body.id;
    });

    it('retorna 400 quando as senhas não conferem', async () => {
      const res = await request(app).post('/v1/user').send({ ...validUser, email: 'x@mail.com', confirmPassword: 'outra' });
      expect(res.status).toBe(400);
    });

    it('retorna 400 quando faltam campos', async () => {
      const res = await request(app).post('/v1/user').send({ email: 'y@mail.com' });
      expect(res.status).toBe(400);
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('retorna 400 para e-mail duplicado', async () => {
      const res = await request(app).post('/v1/user').send(validUser);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /v1/user/token', () => {
    it('gera o token JWT (200)', async () => {
      const res = await request(app).post('/v1/user/token').send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      token = res.body.token;
    });

    it('retorna 400 com senha incorreta', async () => {
      const res = await request(app).post('/v1/user/token').send({ email: validUser.email, password: 'errada' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/user/:id', () => {
    it('retorna o usuário (200)', async () => {
      const res = await request(app).get(`/v1/user/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(validUser.email);
      expect(res.body.password).toBeUndefined();
    });

    it('retorna 404 para usuário inexistente', async () => {
      const res = await request(app).get('/v1/user/9999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /v1/user/:id', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).put(`/v1/user/${userId}`).send({ firstname: 'Novo' });
      expect(res.status).toBe(401);
    });

    it('retorna 401 com token inválido', async () => {
      const res = await request(app).put(`/v1/user/${userId}`).set('Authorization', 'Bearer abc').send({ firstname: 'Novo' });
      expect(res.status).toBe(401);
    });

    it('atualiza o usuário (204)', async () => {
      const res = await request(app)
        .put(`/v1/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstname: 'Maria Clara', surname: 'Souza', email: 'maria@mail.com' });
      expect(res.status).toBe(204);
      expect(res.text).toBe('');

      const check = await request(app).get(`/v1/user/${userId}`);
      expect(check.body.firstname).toBe('Maria Clara');
    });

    it('retorna 400 para dados inválidos', async () => {
      const res = await request(app).put(`/v1/user/${userId}`).set('Authorization', `Bearer ${token}`).send({ email: 'invalido' });
      expect(res.status).toBe(400);
    });

    it('retorna 404 para usuário inexistente', async () => {
      const res = await request(app).put('/v1/user/9999').set('Authorization', `Bearer ${token}`).send({ firstname: 'A' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /v1/user/:id', () => {
    it('retorna 401 sem token', async () => {
      const res = await request(app).delete(`/v1/user/${userId}`);
      expect(res.status).toBe(401);
    });

    it('remove o usuário (204) e depois retorna 404', async () => {
      const res = await request(app).delete(`/v1/user/${userId}`).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
      const again = await request(app).delete(`/v1/user/${userId}`).set('Authorization', `Bearer ${token}`);
      expect(again.status).toBe(404);
    });
  });
});
