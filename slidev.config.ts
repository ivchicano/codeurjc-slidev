import { defineConfig } from 'slidev'

const VAR_MAP: Record<string, Record<string, string>> = {
  'red-bar': { h: '--ed-red-h' },
  logo: { y: '--ed-logo-y', x: '--ed-logo-rx' },
  title: { y: '--ed-title-y', x: '--ed-title-x' },
  content: { y: '--ed-content-py', x: '--ed-content-pr' },
}

export default defineConfig({
  vite: {
    plugins: [
      {
        name: 'slidev-layout-saver',
        configureServer(server) {
          server.middlewares.use('/api/save-layout', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end()
              return
            }
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk)
            const body = JSON.parse(Buffer.concat(chunks).toString())
            const { readFileSync, writeFileSync } = await import('fs')
            const { resolve } = await import('path')
            const layoutPath = resolve(process.cwd(), 'layouts/default.vue')
            let content = readFileSync(layoutPath, 'utf-8')

            for (const [name, pos] of Object.entries(body.positions) as [string, Record<string, number>][]) {
              const map = VAR_MAP[name]
              if (!map) continue
              for (const [prop, cssVar] of Object.entries(map)) {
                const val = pos[prop]
                if (val !== undefined) {
                  content = content.replace(
                    new RegExp(`(${cssVar},\\s*)[\\d.]+px`, 'g'),
                    `$1${val}px`,
                  )
                }
              }
            }

            writeFileSync(layoutPath, content, 'utf-8')
            res.statusCode = 200
            res.end('OK')
          })
        },
      },
    ],
  },
})
