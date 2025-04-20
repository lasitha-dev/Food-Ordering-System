FROM node:16-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies and nodemon globally
RUN npm install && npm install -g nodemon

# Copy the rest of the application
COPY . .

EXPOSE 3003

# Command to run the app
CMD ["npm", "run", "dev"] 