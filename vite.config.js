import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import moonHandler from './api/moon.js'

// In dev, run the Vercel serverless handler as Vite middleware so /api/moon
// behaves the same locally as in production. The handler reads its key from
// process.env, so we mirror loadEnv() into process.env before mounting.
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/moon', async (req, res) => {
        try { await moonHandler(req, res) } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.IPGEOLOCATION_API_KEY) process.env.IPGEOLOCATION_API_KEY = env.IPGEOLOCATION_API_KEY
  return {
    plugins: [react(), devApi()],
  }
})
