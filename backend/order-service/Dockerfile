FROM node:18-alpine

WORKDIR /app

# Install curl and wget for healthchecks
RUN apk --no-cache add curl wget

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production && \
    npm install -g nodemon

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3003

# Set environment variables
ENV NODE_ENV=production

# Command to run the app in development mode
CMD ["npm", "run", "dev"] 