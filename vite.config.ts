import { resolve } from 'path'

const VAR_MAP: Record<string, Record<string, string>> = {
  'red-bar': { h: '--ed-red-h' },
  logo: { y: '--ed-logo-y', x: '--ed-logo-rx' },
  title: { y: '--ed-title-y', x: '--ed-title-x' },
  content: { y: '--ed-content-py', x: '--ed-content-pr' },
}

const LAYOUT_TAB_TEMPLATE = `
      <div v-show="tab === 'layout'" class="layout-editor-panel" style="padding:8px;font-size:12px;height:100%;overflow-y:auto">
        <div style="padding:4px 2px;font-size:10px;font-weight:600;color:#888;text-transform:uppercase">Elements</div>
        <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:8px">
          <button v-for="name in editor.elementNames.value" :key="name" style="display:flex;align-items:center;gap:8px;padding:5px 6px;border:none;background:transparent;color:inherit;cursor:pointer;border-radius:3px;text-align:left;font-size:12px" :style="editor.selected.value === name ? {background:'rgba(128,128,128,0.2)'} : {}" @click="editor.selected.value = name">
            <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block" :style="{ background: { 'red-bar': '#cb0017', logo: '#e8792b', title: '#2563eb', content: '#16a34a' }[name] }" />
            {{ { 'red-bar': 'Red Bar', logo: 'Logo', title: 'Title', content: 'Content' }[name] }}
          </button>
        </div>
        <div v-if="editor.selected.value" style="margin-bottom:12px">
          <div style="padding:4px 2px;font-size:10px;font-weight:600;color:#888;text-transform:uppercase">Properties</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;padding:2px">
            <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#999">X: <input v-model.number="editor.positions[editor.selected.value].x" type="number" style="width:100%;background:rgba(128,128,128,0.08);border:1px solid rgba(128,128,128,0.15);color:inherit;padding:2px 4px;border-radius:2px;font-size:11px;font-family:monospace;outline:none"></label>
            <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#999">Y: <input v-model.number="editor.positions[editor.selected.value].y" type="number" style="width:100%;background:rgba(128,128,128,0.08);border:1px solid rgba(128,128,128,0.15);color:inherit;padding:2px 4px;border-radius:2px;font-size:11px;font-family:monospace;outline:none"></label>
            <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#999">W: <input v-model.number="editor.positions[editor.selected.value].w" type="number" style="width:100%;background:rgba(128,128,128,0.08);border:1px solid rgba(128,128,128,0.15);color:inherit;padding:2px 4px;border-radius:2px;font-size:11px;font-family:monospace;outline:none"></label>
            <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#999">H: <input v-model.number="editor.positions[editor.selected.value].h" type="number" style="width:100%;background:rgba(128,128,128,0.08);border:1px solid rgba(128,128,128,0.15);color:inherit;padding:2px 4px;border-radius:2px;font-size:11px;font-family:monospace;outline:none"></label>
          </div>
        </div>
        <div style="display:flex;gap:4px;padding:2px">
          <button style="flex:1;padding:6px 4px;border:none;border-radius:3px;background:rgba(128,128,128,0.12);color:inherit;cursor:pointer;font-size:11px;font-weight:500" :disabled="!editor.canUndo()" @click="editor.undo()">Undo</button>
          <button style="flex:1;padding:6px 4px;border:none;border-radius:3px;background:rgba(128,128,128,0.12);color:inherit;cursor:pointer;font-size:11px;font-weight:500" :disabled="!editor.dirty.value" @click="editor.resetLayout()">Reset</button>
          <button style="flex:1;padding:6px 4px;border:none;border-radius:3px;background:#2563eb;color:white;cursor:pointer;font-size:11px;font-weight:500" @click="editor.saveLayout()">{{ editor.saving.value ? '...' : editor.saved.value ? 'Done' : 'Save' }}</button>
        </div>
      </div>
`

export default {
  plugins: [
    {
      name: 'slidev-side-editor-override',
      transform(code, id) {
        if (!id.includes('internals/SideEditor.vue')) return null

        let mod = code

        // 1) Add 'layout' to the tab union
        mod = mod.replace(
          "const tab = ref<'content' | 'note'>('content')",
          "const tab = ref<'content' | 'note' | 'layout'>('content')",
        )

        // 2) Import useEditor composable
        mod = mod.replace(
          "import { activeElement,",
          `import { useEditor } from '/@fs${resolve(import.meta.dirname, 'composables/useEditor.ts')}'\nimport { activeElement,`,
        )

        // 3) Instantiate editor
        mod = mod.replace(
          'const { info, update } = useDynamicSlideInfo(currentSlideNo)',
          'const { info, update } = useDynamicSlideInfo(currentSlideNo)\nconst editor = useEditor()',
        )

        // 4) Watch tab and showEditor for editor state
        mod = mod.replace(
          'useEventListener(\'keydown\'',
          'watch(tab, (t) => { editor.editing.value = t === \'layout\'; if (t !== \'layout\') editor.selected.value = null })\nwatch(showEditor, (v) => { if (!v) { editor.editing.value = false; editor.selected.value = null } })\n\nuseEventListener(\'keydown\'',
        )

        // 5) Layout tab button — insert after notes button, before inner div close
        mod = mod.replace(
          '        </IconButton>\n      </div>',
          '        </IconButton>\n        <IconButton title="Switch to layout tab" :class="tab === \'layout\' ? \'text-primary\' : \'\'" @click="switchTab(\'layout\')"><div class="i-carbon:fit-to-screen" /></IconButton>\n      </div>',
        )

        // 6) Layout tab content area
        mod = mod.replace(
          '<ShikiEditor v-show="tab === \'note\'" v-model="noteRef" placeholder="Write some notes..." />',
          '<ShikiEditor v-show="tab === \'note\'" v-model="noteRef" placeholder="Write some notes..." />' + LAYOUT_TAB_TEMPLATE,
        )

        // 7) Heading text
        mod = mod.replace(
          "'Slide' : 'Notes'",
          "'Slide' : tab === 'note' ? 'Notes' : 'Layout'",
        )

        // 8) Add import for watch if not already present (the original uses watch)
        // The original already imports 'watch' from 'vue' ✓

        return mod
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
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString())
          const { readFileSync, writeFileSync } = await import('fs')
          const { resolve: resolvePath } = await import('path')
          const layoutPath = resolvePath(process.cwd(), 'layouts/default.vue')
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

          writeFileSync(layoutPath, content, 'utf-8')
          res.statusCode = 200
          res.end('OK')
        })
      },
    },
  ],
}
