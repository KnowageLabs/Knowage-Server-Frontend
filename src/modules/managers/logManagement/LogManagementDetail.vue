<template>
  <div class="log-detail">
    <div class="file-toolbar kn-toolbar--secondary">
      <div class="file-title">{{ file?.name }}</div>
      <div class="file-toolbar-actions">
        <button class="btn-close" :aria-label="$t('common.close')" @click="$emit('close')">✕</button>
      </div>
    </div>

    <div class="file-viewer-body">
      <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
      
      <knMonaco v-if="content" class="file-viewer__editor" v-model="content" language="text" readonly :options="{ wordWrap: 'on', wrappingIndent: 'indent' }"/>
      <div v-else-if="!loading" class="p-text-italic">{{ $t('managers.logManagement.noContent') ?? 'No Content' }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue';
import ProgressBar from 'primevue/progressbar'

export default defineComponent({
  name: 'LogDetail',
  components: { ProgressBar, knMonaco },
  props: {
    file: { type: Object as any, default: null },
    content: { type: String as any, default: '' },
    loading: { type: Boolean, default: false }
  },
  emits: ['close']
})
</script>

<style scoped lang="scss">
.log-detail{
  display: flex;
  flex-direction: column;
  height: 100%;
}
.file-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--kn-border-color, #e6e6e6);
  background: var(--kn-sidebar-bg, transparent);
}
.file-title {
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-toolbar-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.btn-close {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
}
.file-viewer-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  overflow: auto;
  box-sizing: border-box;
}
.file-viewer__editor {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
}
</style>