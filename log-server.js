import { createServer } from 'http'
import { appendFileSync, writeFileSync } from 'fs'

const LOG_FILE = './debug.log'

// Clear the log file on start
writeFileSync(LOG_FILE, `=== Log started at ${new Date().toISOString()} ===\n`)

const server = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body)
        const logLine = `[${new Date().toISOString()}] ${message}\n`
        appendFileSync(LOG_FILE, logLine)
        console.log(logLine.trim())
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

const PORT = 3001
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Log server running on http://0.0.0.0:${PORT}`)
  console.log(`Logs will be written to ${LOG_FILE}`)
})
