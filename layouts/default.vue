<script setup lang="ts">
import { useEditor } from '../composables/useEditor'

const editor = useEditor()
</script>

<template>
  <div
    class="slidev-layout default relative h-full w-full bg-white text-black"
    :class="{ editing: editor.editing.value }"
    :style="editor.editing.value ? editor.rootStyle.value : {}"
  >
    <div
      class="red-bar"
      :class="{ 'el-active': editor.editing.value && editor.selected.value === 'red-bar' }"
      @mousedown.stop="editor.startDrag($event, 'red-bar')"
    >
      <div
        v-if="editor.editing.value && editor.selected.value === 'red-bar'"
        class="resize-handle b"
        @mousedown.stop="editor.startResize($event, 'red-bar')"
      />
    </div>

    <div
      class="logo"
      :class="{ 'el-active': editor.editing.value && editor.selected.value === 'logo' }"
      @mousedown.stop="editor.startDrag($event, 'logo')"
    >
      <img src="/images/logo.png" alt="Logo">
      <div
        v-if="editor.editing.value && editor.selected.value === 'logo'"
        class="resize-handle se"
        @mousedown.stop="editor.startResize($event, 'logo')"
      />
    </div>

    <div
      class="content"
      :class="{ 'el-active': editor.editing.value && editor.selected.value === 'content' }"
      @mousedown.stop="editor.startDrag($event, 'content')"
    >
      <slot />
      <div
        v-if="editor.editing.value && editor.selected.value === 'content'"
        class="resize-handle se"
        @mousedown.stop="editor.startResize($event, 'content')"
      />
    </div>

    <div
      v-if="editor.editing.value"
      class="title-overlay"
      :style="{ top: editor.positions.title.y + 'px', left: editor.positions.title.x + 'px' }"
      :class="{ 'el-active': editor.selected.value === 'title' }"
      @mousedown.stop="editor.startDrag($event, 'title')"
    >
      <span class="el-tag">Title</span>
      <div
        v-if="editor.selected.value === 'title'"
        class="resize-handle se"
        @mousedown.stop="editor.startResize($event, 'title')"
      />
    </div>
  </div>
</template>

<style>
.slidev-layout.default h1:first-child {
  position: absolute;
  top: var(--ed-title-y, 20px);
  left: var(--ed-title-x, 24px);
  margin: 0;
  font-weight: 700;
  color: #cb0017;
  font-size: 1.5rem;
  line-height: 1.2;
}

.slidev-layout.default h1:first-child + p {
  margin-top: 0;
  opacity: 1;
}
</style>

<style scoped>
.red-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--ed-red-h, 10px);
  background-color: #cb0017;
  z-index: 100;
}

.logo {
  position: absolute;
  top: var(--ed-logo-y, 20px);
  right: var(--ed-logo-rx, 24px);
  z-index: 50;
}

.logo img {
  height: 48px;
  width: auto;
}

.content {
  padding-top: var(--ed-content-py, 80px);
  padding-right: var(--ed-content-pr, 24px);
  min-height: 200px;
}

.editing .red-bar,
.editing .logo,
.editing .content {
  cursor: move;
  outline: 2px dashed transparent;
  transition: outline-color 0.15s;
}

.editing .red-bar { outline-color: #cb0017; }
.editing .logo { outline-color: #e8792b; }
.editing .content { outline-color: #16a34a; }

.editing .red-bar.el-active,
.editing .logo.el-active,
.editing .content.el-active {
  outline-style: solid;
}

.title-overlay {
  position: absolute;
  width: 400px;
  height: 36px;
  cursor: move;
  outline: 2px dashed #2563eb;
  border-radius: 2px;
  z-index: 60;
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.title-overlay.el-active {
  outline-style: solid;
}

.el-tag {
  font-size: 10px;
  font-weight: 600;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  padding: 0 4px;
  border-radius: 2px;
  margin-left: 2px;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid #333;
  border-radius: 2px;
  z-index: 70;
}

.resize-handle.se {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}

.resize-handle.b {
  bottom: -6px;
  left: 50%;
  margin-left: -6px;
  cursor: ns-resize;
}

</style>
