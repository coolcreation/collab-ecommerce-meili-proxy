import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import dotenv from "dotenv"

dotenv.config()

const app = express()

// Health check route
app.get('/health', (req, res) => res.send('OK'))

// Forward everything to the Meilisearch server
app.use(
  "/",
  createProxyMiddleware({
    target: process.env.MEILI_HOST || "http://localhost:7700",
    changeOrigin: true,
    pathRewrite: {
      "^/": "/", // optional but helps clean base path
    },
    onProxyReq: (proxyReq) => {
      if (process.env.MEILI_MASTER_KEY) {
        proxyReq.setHeader("Authorization", `Bearer ${process.env.MEILI_MASTER_KEY}`)
      }
    },
  })
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`)
})
