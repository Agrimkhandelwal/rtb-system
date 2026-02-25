FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate JS files
RUN npm run build || echo "no build step yet"

EXPOSE 5000

# Start development server
CMD ["npm", "run", "dev"]
