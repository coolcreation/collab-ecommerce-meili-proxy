import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(
  "/",
  createProxyMiddleware({
    target: process.env.MEILI_HOST || "http://localhost:7700",
    changeOrigin: true,
  })
)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`)
})
