# Use multi-stage build: install Meilisearch binary + Node app
FROM node:22 AS builder

# Install Meilisearch
# RUN curl -L https://install.meilisearch.com | sh
RUN curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.4.2/meilisearch-linux-amd64 -o /meilisearch \
  && chmod +x /meilisearch


# Create working dir for proxy
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:22

WORKDIR /app

COPY --from=builder /app /app
COPY --from=builder /meilisearch /usr/bin/meilisearch

EXPOSE 3000

# Start both Meilisearch and the proxy
CMD ["sh", "-c", "meilisearch --master-key=$MEILI_MASTER_KEY --http-addr='0.0.0.0:7700' & node server.js"]
