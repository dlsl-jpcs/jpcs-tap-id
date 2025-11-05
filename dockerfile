# Use Node 18 for pcsclite compatibility
FROM node:18

# Install system packages for NFC / PCSC
RUN apt-get update && apt-get install -y \
  libpcsclite-dev \
  pcscd \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your source code
COPY . .

# Expose the port your Express server runs on
EXPOSE 10000

# Start your server
CMD ["npm", "start"]
