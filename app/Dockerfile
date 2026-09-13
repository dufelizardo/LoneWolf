FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# sections.json and public/illustrations/ are pre-generated and committed to
# git (from en/xhtml/lw/01fftd, which isn't in the Docker build context), so
# build directly instead of via `npm run build`'s `prebuild` (parse-content) hook.
RUN npx tsc -b && npx vite build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
