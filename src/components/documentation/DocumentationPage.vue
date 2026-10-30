<template>
    <q-btn round flat icon="menu" @click="toggleDrawer" class="drawerButton" />
    <q-btn round flat icon="link" @click="copyLink" class="copyButton">
        <q-tooltip :delay="500">{{ $t('documentExecution.main.copyLink') }}</q-tooltip>
    </q-btn>
    <DocsMarkdown v-if="markdown" :source="markdown" :page-folder="pageFolder" class="markdownContent" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { findSubfolder } from './DocumentationHelper'
import { downloadText, findDocsFolder, getFolders } from './docsResourceApi'
import DocsMarkdown from './DocsMarkdown.vue'
import mainStore from '@/App.store'
import { useQuasar } from 'quasar'
import i18n from '@/App.i18n'

const { t } = i18n.global
const $q = useQuasar()
const store = mainStore()

const markdown = ref<string | null>(null)

const props = defineProps<{ path?: string[] }>()

const emit = defineEmits<{
    (e: 'toggle-drawer'): void
}>()

// The folder of the page, relative to docs: the relative images of the page start from here.
const pageFolder = computed(() => (props.path ? props.path.slice(0, -1).join('/') : ''))

onMounted(async () => {
    await loadMarkdown()
})

watch(
    () => props.path,
    async (newPath, oldPath) => {
        if (newPath !== oldPath) await loadMarkdown()
    }
)

async function loadMarkdown() {
    store.setLoading(true)
    try {
        const docs = findDocsFolder(await getFolders())
        const folder = props.path && props.path.length > 1 ? findSubfolder(docs, props.path.slice(0, -1)) : docs
        const fileName = `${props.path ? props.path[props.path.length - 1] : 'index.md'}`
        markdown.value = folder ? await downloadText(folder.key, fileName) : null
    } catch {
        markdown.value = null
    } finally {
        store.setLoading(false)
    }
}

function copyLink() {
    const url = window.location.href

    navigator.clipboard.writeText(url)
    $q.notify({
        position: 'top',
        type: 'positive',
        message: t('documentExecution.main.urlCopiedToClipboard')
    })
}

function toggleDrawer() {
    emit('toggle-drawer')
}
</script>

<style lang="scss" scoped>
.drawerButton {
    position: absolute;
    top: 4px;
    left: 4px;
    z-index: 1000;
    display: none;
}
.copyButton {
    position: absolute;
    right: 4px;
    top: 4px;
    z-index: 1000;
}
.markdownContent {
    position: relative;
    width: 100%;
    top: 0;
    margin-top: 0;
    padding-left: 20%;
    padding-right: 20%;
}

@media screen and (max-width: 1200px) {
    .markdownContent {
        padding-left: 10%;
        padding-right: 10%;
    }
}
@media screen and (max-width: 1066px) {
    .drawerButton {
        display: inline-flex;
    }
}
@media screen and (max-width: 900px) {
    .markdownContent {
        padding-left: 50px;
        padding-right: 50px;
    }
}
</style>
