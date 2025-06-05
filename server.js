import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

// Health check for Render
app.get('/', (req, res) => res.send('OK'))

// Proxy all other routes to Meilisearch
app.use(
  '/',
  createProxyMiddleware({
    target: process.env.MEILI_HOST || 'http://localhost:7700',
    changeOrigin: true,
    pathRewrite: {
      '^/': '/', // Optional, keeps paths clean
    },
    onProxyReq: (proxyReq, req, res) => {
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