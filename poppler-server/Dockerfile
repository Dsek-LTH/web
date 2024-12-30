# Use a lightweight Node.js image
FROM node:alpine
ENV NODE_ENV=production

# Install pdftotext (from poppler-utils)
RUN apk add --no-cache poppler-utils

# Enable Corepack (comes pre-installed with Node.js)
RUN corepack enable

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and install dependencies
COPY ./package.json ./pnpm-lock.yaml ./
RUN corepack prepare pnpm@latest --activate && pnpm install

# Copy the web service's code
COPY . .

# Expose the port the application will run on
EXPOSE 8800

# Run as a non-root
USER node

# Command to run the web service
CMD ["node", "index.js"]