### Adding a Reverse Proxy with Express.js in Front of Meilisearch  
---

While deploying Meilisearch on Render using a Dockerfile, the service **times out and fails** on Meilisearch free tier.  
- On the **free plan** Render only allows **Web Services** not Background Workers.
- Meilisearch doesn't respond with an HTTP success on `/` (the root path), which is **required by Render to confirm the service is healthy**.
- As a result, even though Meilisearch is running correctly on port 7700, Render shuts it down thinking it’s broken.

---

### Solution: Add a Reverse Proxy with Express.js

A tiny Node.js app using Express can:

1. Listen on port 80 (what Render expects).
2. Reply with `200 OK` to `/` or `/health` for Render's health checks.
3. Forward (proxy) **all other traffic to Meilisearch** on port 7700.

This keeps both Render and Meilisearch happy — and costs nothing on the free tier.

---

### Why This Works for Production

- **Compliant with Render:** Render needs a web service on port 80/443 and a working `/` route — which this proxy provides.
- **Meilisearch Compatibility:** Meilisearch doesn’t offer a default root response, but the proxy fills that gap and forwards all API traffic.
- **Lightweight & Fast:** The proxy introduces minimal latency, using `http-proxy-middleware` or native Express proxying.
- **Extendable:** You can later add custom headers, rate limiting, logging, auth, or metrics to the proxy.

---

### Production Considerations

- **Authentication:** Keep your `MEILI_MASTER_KEY` secure. Do not expose it publicly in logs, code, or environments.
- **Index Naming:** If using across multiple projects, use descriptive index names (`products_ecommerce`, `articles_blog`, etc.) to avoid collisions.
- **Scalability:** The proxy can be scaled independently from Meilisearch, especially if used in multiple apps.
- **Observability:** Add logging or monitoring at the proxy layer if needed.

---

### How to Deploy on Render

1. Create a new repo for the proxy:   
   
```js
collab-ecommerce-meili-proxy/
├── Dockerfile
├── server.js
├── package.json
├── .env
└── .gitignore

``` 

1. Set it up as a **Node.js Web Service** on Render.
2. In your code, ensure:
    - The Express app listens on `process.env.PORT`.
    - It forwards traffic to `http://localhost:7700` (Meilisearch).
3. In Render:
    - Point it to your GitHub repo.
    - Add `MEILI_MASTER_KEY` and any other env vars.
4. Ensure:
    - `GET /` returns "OK".
    - `GET /indexes` and other Meilisearch endpoints proxy correctly.

---

### Running this project with Docker  

**Make sure Node and NPM are installed on your machine, then:**
```js
npm install
```
**Make sure Docker desktop is up and running, then:**
```js
docker build -t meili-proxy .
docker run -p 7700:7700 -p 80:80 meili-proxy
```
**It should look something like this:**
```js
Proxy server running on port 3000

888b     d888          d8b 888 d8b                                            888     
8888b   d8888          Y8P 888 Y8P                                            888     
88888b.d88888              888                                                888     
888Y88888P888  .d88b.  888 888 888 .d8888b   .d88b.   8888b.  888d888 .d8888b 88888b. 
888 Y888P 888 d8P  Y8b 888 888 888 88K      d8P  Y8b     "88b 888P"  d88P"    888 "88b
888  Y8P  888 88888888 888 888 888 "Y8888b. 88888888 .d888888 888    888      888  888
888   "   888 Y8b.     888 888 888      X88 Y8b.     888  888 888    Y88b.    888  888
888       888  "Y8888  888 888 888  88888P'  "Y8888  "Y888888 888     "Y8888P 888  888

Config file path:       "none"
Database path:          "./data.ms"
Server listening on:    "http://0.0.0.0:7700"
Environment:            "development"
Commit SHA:             "unknown"
Commit date:            "unknown"
Package version:        "1.14.0"

Thank you for using Meilisearch!


We collect anonymized analytics to improve our product and your experience. To learn more, including how to turn off analytics, visit our dedicated documentation page: https://www.meilisearch.com/docs/learn/what_is_meilisearch/telemetry

Anonymous telemetry:    "Enabled"
Instance UID:           "XXXXXXXXX-ac85-460e-9bc5-bXXXXXXXXXXX"

A master key has been set. Requests to Meilisearch won't be authorized unless you provide an authentication key.



 A master key of at least 16 bytes will be required when switching to a production environment.


We generated a new secure master key for you (you can safely use this token):

>> --master-key 3_X7cXXXXXXXXXXXXXXX_XXXXX_XXXXXXXXXXXXXXXX <<

Restart Meilisearch with the argument above to use this new and secure master key.

Check out Meilisearch Cloud!    https://www.meilisearch.com/cloud?utm_campaign=oss&utm_source=engine&utm_medium=cli
Documentation:                  https://www.meilisearch.com/docs
Source code:                    https://github.com/meilisearch/meilisearch
Discord:                        https://discord.meilisearch.com

2025-06-05T19:39:46.895007Z  INFO actix_server::builder: starting 4 workers
2025-06-05T19:39:46.895105Z  INFO actix_server::server: Actix runtime found; starting in Actix runtime
```
---


**TAKE `master-key` that we can see above, and put it in .env file under `MEILI_MASTER_KEY`**  
**Then use keyboard buttons `crtl + c` to kill terminal process**  

**Now rebuild docker image:**
```
docker build -t meili-proxy . 
``` 

**Make sure all image files are not running:**
```
docker stop $(docker ps -q)
```

**Run image again**
```
docker run -p 7700:7700 -p 80:80 --env-file .env meili-proxy
```
**It should look something like this, and now has the proper `master-key`**
```js
888b     d888          d8b 888 d8b                                            888
8888b   d8888          Y8P 888 Y8P                                            888
88888b.d88888              888                                                888
888Y88888P888  .d88b.  888 888 888 .d8888b   .d88b.   8888b.  888d888 .d8888b 88888b.
888 Y888P 888 d8P  Y8b 888 888 888 88K      d8P  Y8b     "88b 888P"  d88P"    888 "88b
888  Y8P  888 88888888 888 888 888 "Y8888b. 88888888 .d888888 888    888      888  888
888   "   888 Y8b.     888 888 888      X88 Y8b.     888  888 888    Y88b.    888  888
888       888  "Y8888  888 888 888  88888P'  "Y8888  "Y888888 888     "Y8888P 888  888

Config file path:       "none"
Database path:          "./data.ms"
Server listening on:    "http://0.0.0.0:7700"
Environment:            "development"
Commit SHA:             "unknown"
Commit date:            "unknown"
Package version:        "1.14.0"

Thank you for using Meilisearch!


We collect anonymized analytics to improve our product and your experience. To learn more, including how to turn off analytics, visit our dedicated documentation page: https://www.meilisearch.com/docs/learn/what_is_meilisearch/telemetry

Anonymous telemetry:    "Enabled"
Instance UID:           "XXXXXXXXX-ac85-460e-9bc5-bXXXXXXXXXXX"

A master key has been set. Requests to Meilisearch won't be authorized unless you provide an authentication key.

Check out Meilisearch Cloud!    https://www.meilisearch.com/cloud?utm_campaign=oss&utm_source=engine&utm_medium=cli
Documentation:                  https://www.meilisearch.com/docs
Source code:                    https://github.com/meilisearch/meilisearch
Discord:                        https://discord.meilisearch.com

2025-06-05T19:47:31.577286Z  INFO actix_server::builder: starting 4 workers
2025-06-05T19:47:31.579668Z  INFO actix_server::server: Actix runtime found; starting in Actix runtime
Proxy server running on port 3000
2025-06-05T19:48:42.503065Z  INFO HTTP request{method=GET host="localhost:7700" route=/health query_parameters= user_agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0 status_code=200}: meilisearch: close time.busy=3.47ms time.idle=2.96ms
2025-06-05T19:48:42.583567Z  INFO HTTP request{method=GET host="localhost:7700" route=/favicon.ico query_parameters= user_agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0 status_code=404}: meilisearch: close time.busy=27.5µs time.idle=9.43µs
```
**It now says `A master key has been set`**
