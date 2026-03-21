FROM node:20

WORKDIR /app

COPY . .

WORKDIR /app/memory-backend
RUN npm install

WORKDIR /app/memory-frontend
RUN npm install
RUN npm run build

RUN npm install -g concurrently

EXPOSE 3000
EXPOSE 4173

WORKDIR /app
CMD concurrently \
  "cd memory-backend && node server.js" \
  "cd memory-frontend && npm run preview -- --port 4173 --host 0.0.0.0"