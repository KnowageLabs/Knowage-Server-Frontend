<template>
  <div class="log-detail">
    <div class="file-toolbar kn-toolbar--secondary">
      <div class="file-title">{{ file?.name }}</div>
      <div class="file-toolbar-actions">
        <Button icon="fas fa-sync-alt" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" :aria-label="$t('common.refresh')" @click="$emit('refresh')" />
        <Button icon="pi pi-times" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" :aria-label="$t('common.close')" @click="$emit('close')" />
      </div>
    </div>

    <div class="file-viewer-body">
      <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
      
      <knMonaco v-if="typeof content === 'string' && content.length > 0" class="file-viewer__editor" v-model="content" language="logLang" :options="{  readOnly: true, wordWrap: 'on', wrappingIndent: 'indent' }"/>
      <div v-else-if="!loading" class="p-text-italic">{{ $t('managers.logManagement.FileContentMissing') }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, onMounted } from 'vue'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue';
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'
import { registerLogLanguageForMonaco } from '@/components/UI/KnMonaco/logLang'

try { registerLogLanguageForMonaco() } catch (e) {}

const API_BASE = `${import.meta.env.VITE_KNOWAGE_API_CONTEXT}/api/2.0/resources/logs`

export default defineComponent({
  name: 'LogDetail',
  components: { ProgressBar, knMonaco, Button },
  props: {
    file: { type: Object as any, default: null },
  },
  emits: ['close', 'refresh'],
  data() {
    return {
      content: '' as string,
      loading: false as boolean,
    }
  },
  watch: {
    file: {
      immediate: true,
      handler(newVal: any) {
        this.loadFileContent(newVal)
      }
    }
  },
  methods: {
    async loadFileContent(file: any) {
      this.content = ''
      if (!file || !file.name) return
      this.loading = true
      try {
        const url = file.folderName
          ? `${API_BASE}/folders/${encodeURIComponent(file.folderName)}/files/${encodeURIComponent(file.name)}`
          : `${API_BASE}/root/${encodeURIComponent(file.name)}`
        const resp = await (this as any).$http.get(url, { responseType: 'text' })
        // axios response -> resp.data ; normalize null->''
        const data = resp && resp.data !== undefined ? resp.data : resp
        this.content = data == null ? '' : data
      } catch (e: any) {
        // optionally notify parent via setError emit/prop; keep it simple here
        console.error('LogDetail loadFileContent failed', e)
        this.content = ''
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<style scoped lang="scss">

// --- FILE VIEWER ---
.log-detail{
  display: flex;
  flex-direction: column;
  height: 100%;

  .file-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--kn-border-color, #e6e6e6);
    background: var(--kn-sidebar-bg, transparent);

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

      .p-button {
        min-width: 34px;
        height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .file-viewer-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    overflow: auto;
    box-sizing: border-box;

    .file-viewer__editor {
      flex: 1 1 auto;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow: auto;
    }
  }
}
</style>