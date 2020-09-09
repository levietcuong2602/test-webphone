FROM node:latest
WORKDIR /app
COPY . .
CMD ["yarn", "dev"]