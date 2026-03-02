# User Service (Node.js + Express + MongoDB)

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Create `.env` from `.env.example` and update values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/user-service-db
```

## 3) Run service

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## 4) API endpoints

- `GET /health`
- `POST /api/users`
- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
