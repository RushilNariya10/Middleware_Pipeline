# Practical 11 - Backend image (Node/Express + Mongoose)
FROM node:20-alpine
WORKDIR /app

# Manifests first: the slow dependency layer is cached until package*.json changes
COPY package*.json ./
RUN npm ci --omit=dev

# Application source (node_modules and .env are excluded by .dockerignore)
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Run as the unprivileged user shipped with the node image
USER node
CMD ["node", "server.js"]
