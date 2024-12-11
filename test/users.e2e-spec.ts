import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('UsersService (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    prisma = app.get(PrismaService);
    await prisma.$connect();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  // Создание пользователя
  describe('/users (POST)', () => {
    it('Создание нового пользователя', async () => {
      const userDto = {
        name: 'Иван',
        login: 'ivan0110',
        password: 'passwordIvan0101',
        roles: [1, 4],
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toHaveProperty('login', 'ivan0110');
    });

    it('Имя указано не строкой', async () => {
      const userDto = {
        name: 1,
        login: 'ivan0111',
        password: 'passwordIvan0101',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);

      expect(response.body.message).toContain('Поле имя должно быть строкой');
    });

    it('Имя пустое', async () => {
      const userDto = {
        name: '',
        login: 'ivan0112',
        password: 'passwordIvan0101',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);

      expect(response.body.message).toContain('Имя не может быть пустым');
    });

    it('Логин указано не строкой', async () => {
      const userDto = {
        name: 'Иван',
        login: 1,
        password: 'passwordIvan0101',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);

      expect(response.body.message).toContain('Поле логин должно быть строкой');
    });

    it('Логин пустой', async () => {
      const userDto = {
        name: 'Иван',
        login: '',
        password: 'passwordIvan0101',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);

      expect(response.body.message).toContain('Логин не может быть пустым');
    });

    it('Логин уже занят', async () => {
      const userDto = {
        name: 'Иван',
        login: 'ivan0110',
        password: 'passwordIvan0101',
        roles: [1, 4],
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);
    });

    it('Роли не указаны', async () => {
      const userDto = {
        name: 'Иван',
        login: 'ivan0114',
        password: 'passwordIvan0101',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);
    });

    it('Пароль указано не строкой', async () => {
      const userDto = {
        name: 'Иван',
        login: 'ivan0115',
        password: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);

      expect(response.body.message).toContain(
        'Поле пароля должно быть строкой',
      );
    });

    it('Пароль пустой', async () => {
      const userDto = {
        name: 'Иван',
        login: 'ivan0116',
        password: '',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);

      expect(response.body.message).toContain('Пароль не может быть пустым');
    });

    it('Пароль не соответствует требованиям', async () => {
      const userDto = {
        name: 'Иван',
        login: 'ivan0117',
        password: 'passwordIvan',
        roles: [1, 4],
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);
    });

    it('Роли не являются массивом', async () => {
      const userDto = {
        name: 'Иван',
        login: 'ivan0118',
        password: 'passwordIvan0101',
        roles: 'UwU',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);

      expect(response.body.message).toContain('ID роли должен быть массивом');
    });

    it('Роли не являются числами', async () => {
      const userDto = {
        name: 'Иван',
        login: 'ivan0119',
        password: 'passwordIvan0101',
        roles: ['UwU'],
      };
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);

      expect(response.body.message).toContain(
        'Каждый ID роли должен быть числом',
      );
    });

    it('Массив ролей пустой', async () => {
      const userDto = {
        name: 'Иван',
        login: 'ivan0120',
        password: 'passwordIvan0101',
        roles: [],
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(400);

      expect(response.body.message).toContain(
        'Массив с ролями не может быть пустым',
      );
    });
  });

  // Изменяем пользователя
  describe('/users/:id (PUT)', () => {
    it('Должен обновить пользователя с валидными данными', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Иван',
          login: 'ivan0102',
          password: 'passwordIvan0101',
          roles: { create: [{ roleId: 1 }, { roleId: 2 }] },
        },
      });

      const updateDto = { name: 'Виталий' };

      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser).toHaveProperty('name', 'Виталий');
    });

    it('Пользователь не найден', async () => {
      const updateDto = { name: 'Арсений' };

      await request(app.getHttpServer())
        .put('/users/99999')
        .send(updateDto)
        .expect(404);
    });

    it('Имя пустое', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Иван',
          login: 'ivan0103',
          password: 'passwordIvan0101',
          roles: { create: [{ roleId: 1 }, { roleId: 2 }] },
        },
      });

      const updateDto = { name: '' };

      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .send(updateDto)
        .expect(400);

      expect(response.body).toHaveProperty('message', [
        'Имя не может быть пустым',
      ]);
    });

    it('Логин пустой', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Иван',
          login: 'ivan0104',
          password: 'passwordIvan0101',
          roles: { create: [{ roleId: 1 }, { roleId: 2 }] },
        },
      });

      const updateDto = { login: '' };

      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .send(updateDto)
        .expect(400);

      expect(response.body).toHaveProperty('message', [
        'Логин не может быть пустым',
      ]);
    });

    it('Пароль не соответствует требованиям', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Иван',
          login: 'ivan0105',
          password: 'passwordIvan0101',
          roles: { create: [{ roleId: 1 }, { roleId: 2 }] },
        },
      });

      const updateDto = { password: 'password' };

      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .send(updateDto)
        .expect(400);

      expect(response.body).toHaveProperty('message', [
        'Пароль должен содержать хотя бы одну заглавную букву и одну цифру',
      ]);
    });

    it('Роли не являются массивом', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Иван',
          login: 'ivan0106',
          password: 'passwordIvan0101',
          roles: { create: [{ roleId: 1 }, { roleId: 2 }] },
        },
      });

      const updateDto = { roles: 'UwU' };

      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .send(updateDto)
        .expect(400);

      expect(response.body.message).toContain('ID роли должен быть массивом');
      expect(response.body.message).toContain(
        'Массив с ролями не может быть пустым',
      );
      expect(response.body.message).toContain(
        'Каждый ID роли должен быть числом',
      );
    });

    it('ID роли не является числом', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Иван',
          login: 'ivan0107',
          password: 'passwordIvan0101',
          roles: { create: [{ roleId: 1 }, { roleId: 2 }] },
        },
      });

      const updateDto = { roles: ['-w-'] };

      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .send(updateDto)
        .expect(400);

      expect(response.body).toHaveProperty('message', [
        'Каждый ID роли должен быть числом',
      ]);
    });

    it('Массив ролей пустой', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Иван',
          login: 'ivan0108',
          password: 'passwordIvan0101',
          roles: { create: [{ roleId: 1 }, { roleId: 2 }] },
        },
      });

      const updateDto = { roles: [] };

      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .send(updateDto)
        .expect(400);

      expect(response.body).toHaveProperty('message', [
        'Массив с ролями не может быть пустым',
      ]);
    });

    it('Изменений не отправлено', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Иван',
          login: 'ivan0109',
          password: 'passwordIvan0101',
          roles: { create: [{ roleId: 1 }, { roleId: 2 }] },
        },
      });

      const updateDto = { name: 'Иван' };

      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  // Удаление пользователя
  describe('/users/:id (DELETE)', () => {
    it('Удаление пользователя', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Иван',
          login: 'ivan0001',
          password: 'passwordIvan0101',
          roles: { create: [{ roleId: 1 }, { roleId: 2 }] },
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('Пользователь не найден', async () => {
      await request(app.getHttpServer()).delete('/users/99999').expect(404);
    });
  });
});
