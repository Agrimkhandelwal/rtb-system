FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate static files for verification build (optional for dev)
RUN npm run build || echo "no build step yet"

EXPOSE 3000

# Start development server with host bindings
CMD ["npm", "run", "dev"]
