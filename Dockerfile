FROM node:20-alpine
WORKDIR /app

# BACKEND
COPY memory-backend ./memory-backend
WORKDIR /app/memory-backend
RUN npm install

# 🎨 FRONTEND
WORKDIR /app
COPY memory-frontend ./memory-frontend

WORKDIR /app/memory-frontend
RUN npm install && npm run build

RUN mkdir -p /app/memory-backend/public && \
    cp -r dist/* /app/memory-backend/public/

# START SERVER
WORKDIR /app/memory-backend

ENV PORT=3000

EXPOSE 3000
EXPOSE 5173

CMD ["node", "server.js"]