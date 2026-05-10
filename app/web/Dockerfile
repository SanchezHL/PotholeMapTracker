# Usamos Node para compilar la web
FROM node:20-slim

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# Construimos la app (Vite)
RUN npm run build

# Para servirla, usaremos un servidor ligero
RUN npm install -g serve
EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]

