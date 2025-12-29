# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /code

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---------- SERVE ----------
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /code/dist/terra-canada /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
