# Use the official Node.js 22 image as a base
FROM node:22

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

RUN npx prisma generate
# Build the TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Start the application
# CMD ["npm", "start"]
# CMD ["node", "dist/index.js"]

CMD ["npm", "run","dev"]