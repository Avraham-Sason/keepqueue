FROM node:22-alpine
# install curl
RUN apk add --no-cache curl
# Create and set the app directory
WORKDIR /usr/src/app

# Install app dependencies with pnpm (via corepack)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile

# Copy the rest of the application (including root .env)
COPY . .

# Build the TypeScript code
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 9000

# Command to run the app
CMD [ "node", "dist/app.js" ]
