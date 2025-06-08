import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import dotenv from "dotenv"

dotenv.config()

console.log("Proxy's MEILI_MASTER_KEY at startup:", process.env.MEILI_MASTER_KEY);

const app = express()

// Health check route
app.get('/health', (req, res) => res.send('OK'))

// Custom logging middleware (keep this, it's working)
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// === NEW MIDDLEWARE TO SET AUTHORIZATION HEADER ===
app.use((req, res, next) => {
  if (process.env.MEILI_MASTER_KEY) {
    const authHeader = `Bearer ${process.env.MEILI_MASTER_KEY}`;
    req.headers['authorization'] = authHeader; // Set the header directly on the request object
    console.log(`[EXPRESS-MIDDLEWARE] Set Authorization header: ${authHeader}`);
  } else {
    console.warn("[EXPRESS-MIDDLEWARE] MEILI_MASTER_KEY not available to set header.");
  }
  next();
});
// ====================================================

// Removed the "IS IT DOING ANYTHING?" log as it was a startup log and confusing
// console.log("IS IT DOING ANYTHING?");

app.use(
  "/",
  createProxyMiddleware({
    target: process.env.MEILI_HOST || "http://localhost:7700",
    changeOrigin: true,
    // REMOVED: logger: console, (to avoid potential log suppression issues)
    pathRewrite: {
      "^/": "/",
    },
    // Keep onProxyReq for a final debug, but it's not the primary way we're setting the header now
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[ONPROXYREQ-CHECK] Triggered for ${req.method} ${req.url}. Key present: ${!!process.env.MEILI_MASTER_KEY}`);
      // Confirm the header is already there from the previous middleware
      console.log(`[ONPROXYREQ-CHECK] Header on proxyReq: ${proxyReq.getHeader('Authorization') || 'Not Set'}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy failed to connect to target.');
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('Proxy received response from target:', proxyRes.statusCode, proxyRes.statusMessage);
    }
  })
);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`)
})