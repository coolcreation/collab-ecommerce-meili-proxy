import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

// Health check route must be above proxy
app.get('/health', (req, res) => res.send('OK'))

// Proxy all requests to /meili/* → Meilisearch
app.use(
  '/meili',
  createProxyMiddleware({
    target: process.env.MEILI_HOST || 'http://localhost:7700',
    changeOrigin: true,
    pathRewrite: { '^/meili': '' }, // strip /meili before forwarding
    onProxyReq: (proxyReq) => {
      if (process.env.MEILI_MASTER_KEY) {
        proxyReq.setHeader('Authorization', `Bearer ${process.env.MEILI_MASTER_KEY}`)
      }
    },
  })
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`)
})
