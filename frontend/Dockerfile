FROM node:16-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Create a start script that properly sets HOST
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'sed -i "s|http://localhost:3001|$REACT_APP_AUTH_URL|g" /app/src/services/api.js' >> /app/start.sh && \
    echo 'sed -i "s|http://localhost:3003|$REACT_APP_API_URL|g" /app/src/services/api.js' >> /app/start.sh && \
    echo 'sed -i "s|http://localhost:3002|$REACT_APP_RESTAURANT_URL|g" /app/src/services/api.js' >> /app/start.sh && \
    echo 'HOST=0.0.0.0 npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000

# Use the custom start script
CMD ["/app/start.sh"] 