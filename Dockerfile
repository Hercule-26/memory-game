FROM node:20 AS frontend-build

WORKDIR /app/memory-frontend

COPY memory-frontend/package*.json ./

RUN npm install

COPY memory-frontend/ .

RUN npm run build

FROM node:20

WORKDIR /app

COPY memory-backend/ ./memory-backend/
WORKDIR /app/memory-backend
RUN npm install

COPY --from=frontend-build /app/memory-frontend/dist ./memory-frontend/dist
COPY --from=frontend-build /app/memory-frontend/package*.json ./memory-frontend/

RUN npm install -g concurrently

EXPOSE 3000
EXPOSE 4173

WORKDIR /app
CMD concurrently \
  "cd memory-backend && node server.js" \
  "cd memory-frontend && npm run preview -- --port 4173 --host 0.0.0.0"