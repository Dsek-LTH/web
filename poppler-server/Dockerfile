# Use a smaller base image
FROM node:alpine

# Install only the necessary dependencies (poppler-utils and poppler-data)
RUN apk update && apk upgrade && \
    apk add --no-cache poppler-utils poppler-data

# Set the working directory to avoid copying unnecessary files
WORKDIR /app

# Copy only the necessary files first to leverage Docker's cache mechanism
COPY package.json pnpm-lock.yaml ./

# Install the dependencies (make sure you're using pnpm if it's preferred)
RUN npm install --production

# Copy the source code after installing dependencies to avoid unnecessary rebuilds
COPY . .

# Expose the port the app will run on
EXPOSE 8800

# Run the server
CMD ["node", "index.js"]
