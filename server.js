import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import dotenv from "dotenv"

dotenv.config()

const app = express()

// Health check route
app.get('/health', (req, res) => res.send('OK'))
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`)
  next()
})
console.log("IS IT DOING ANYTHING?");

app.use(
  "/",
  createProxyMiddleware({
    target: process.env.MEILI_HOST || "http://localhost:7700",
    changeOrigin: true,
    logger: console, // <--- Add this line for basic logging
    // logLevel: 'debug', // <--- Or this for very verbose logging (requires 'debug' package)
    pathRewrite: {
      "^/": "/",
    },
    onProxyReq: (proxyReq) => {
      if (process.env.MEILI_MASTER_KEY) {
        console.log("Injecting auth header to proxy request...");
        proxyReq.setHeader("Authorization", `Bearer ${process.env.MEILI_MASTER_KEY}`);
      } else {
        console.warn("MEILI_MASTER_KEY is missing in proxy env");
      }
    },
    // Consider adding these for deeper debugging if it still fails:
    onError: (err, req, res) => {
        console.error('Proxy Error:', err.message);
        // console.error('Proxy Error Details:', err); // for more detail
        res.writeHead(500, {
            'Content-Type': 'text/plain',
        });
        res.end('Proxy failed to connect to target.');
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('Proxy received response from target:', proxyRes.statusCode, proxyRes.statusMessage);
    }
  })
);

// Forward everything to the Meilisearch server
// app.use(
//   "/",
//   createProxyMiddleware({
//     target: process.env.MEILI_HOST || "http://localhost:7700",
//     changeOrigin: true,
//     pathRewrite: {
//       "^/": "/", // optional but helps clean base path
//     },
//     onProxyReq: (proxyReq) => {
//       if (process.env.MEILI_MASTER_KEY) {
//         console.log("Injecting auth header to proxy request...")
//         proxyReq.setHeader("Authorization", `Bearer ${process.env.MEILI_MASTER_KEY}`)
//       } else {
//         console.warn("MEILI_MASTER_KEY is missing in proxy env")
//       }
//     },
//   })
// )

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`)
})
