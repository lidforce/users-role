## Установка
Для базы данных я использую Docker, вот команда запуска контейнера:
```bash
docker run -d \
  --name testname \
  -e POSTGRESQL_USERNAME=postgres \
  -e POSTGRESQL_PASSWORD=123test1 \
  -p 5434:5432 \
  bitnami/postgresql
```

Затем в `.env` меняем адрес базы данных:<br/>
```DATABASE_URL="postgresql://postgres:password@localhost:PORT/users-role?schema=public"```<br/>
на данные указанные выше<br/>
```DATABASE_URL="postgresql://postgres:123test1@localhost:5434/users-role?schema=public"```

Затем в терминале директории пишем:<br/>
  1. `npm i`
  2. `npm run db:migrate`
  3. `npm run start` или `npm run start:dev`

## API
### Создание пользователя:
POST запрос:`http://localhost:4000/users`<br/>
Данные:
```json
{
  "name": "Иван",
  "login": "ivan0109",
  "password": "passwordA1",
  "role": [1, 2]
}
```
> [!Caution]  
> **Для присвоения роли необходимо создать их в базе.**


### Удаление пользователя:
DELETE запрос:`http://localhost:4000/users/:id`<br/>

### Изменение пользователя
PUT запрос:`http://localhost:4000/users/:id`<br/>
```json
{
  "name": "Иван",
  "login": "0109ivan",
  "password": "passwordB2",
  "role": [2, 3]
}
```
Любое ключ и значение необязательны, но как минимум одно должно быть указано.

## Unit тесты:
`npm run test:e2e`

