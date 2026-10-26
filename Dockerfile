FROM node:22-alpine AS base
WORKDIR /app

# Instalación dependencias
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copia código fuente
COPY . .

# Build opcional (para producción, desactivado si initOpenNextCloudflareForDev falla)
# RUN npm run build || echo "Build falló, usando dev"

# Puerto
EXPOSE 3000

# Comando de inicio (dev si se pasa, producción por defecto)
ENV NODE_ENV=production
CMD ["npm", "start"]
