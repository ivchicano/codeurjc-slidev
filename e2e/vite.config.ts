import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = resolve(import.meta.dirname, '..')

const VAR_MAP: Record<string, Record<string, string>> = {
  'red-bar': { h: '--ed-red-h' },
  logo: { y: '--ed-logo-y', x: '--ed-logo-rx' },
  title: { y: '--ed-title-y', x: '--ed-title-x' },
  content: { y: '--ed-content-py', x: '--ed-content-pr' },
}

const customSideEditorPath = resolve(__dirname, '_override/SideEditor.vue')
const useEditorAbsPath = `/@fs${resolve(__dirname, 'composables/useEditor.ts')}`

export default {
  plugins: [
    {
      name: 'slidev-side-editor-override',
      enforce: 'pre',
      transform(code, id) {
        if (!id.includes('SideEditor.vue') || id.includes('?vue')) return null
        let content = readFileSync(customSideEditorPath, 'utf-8')
        content = content.replace('__USE_EDITOR_PATH__', useEditorAbsPath)
        return content
      },
    },
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
          const { resolve: resolvePath } = await import('path')
          const layoutDir = resolvePath(import.meta.dirname, 'layouts')
          const layoutPath = resolvePath(layoutDir, 'default.vue')
          let content = readFileSync(layoutPath, 'utf-8')

          for (const [name, pos] of Object.entries(body.positions)) {
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

          let layoutName = 'default'
          const saveAs = body.saveAs !== false

          if (saveAs) {
            let name: string
            if (body.layoutName && body.layoutName.trim()) {
              name = body.layoutName.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
              if (!name) name = `layout-${Date.now()}`
            } else {
              name = `layout-${Date.now()}`
            }
            if (existsSync(resolvePath(layoutDir, `${name}.vue`))) {
              name = `${name}-${Date.now()}`
            }
            writeFileSync(resolvePath(layoutDir, `${name}.vue`), content, 'utf-8')
            layoutName = name
          } else {
            writeFileSync(layoutPath, content, 'utf-8')
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ layoutName }))
        })
      },
    },
  ],
}
