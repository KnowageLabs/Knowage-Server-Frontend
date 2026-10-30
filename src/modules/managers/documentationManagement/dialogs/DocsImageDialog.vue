<template>
    <q-dialog :model-value="visible" @update:model-value="(value) => !value && emit('close')" @show="load" @hide="release">
        <q-card class="docs-image-dialog column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('managers.documentationManagement.images.title') }}</q-toolbar-title>
                <q-btn flat round dense icon="upload" :loading="uploading" @click="fileInput?.click()">
                    <q-tooltip :delay="500">{{ $t('managers.documentationManagement.images.upload') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="close" @click="emit('close')" />
            </q-toolbar>
            <q-linear-progress v-if="loading || uploading" indeterminate color="primary" />
            <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />
            <q-scroll-area class="col">
                <div v-if="images.length" class="docs-image-dialog__grid">
                    <button v-for="image in images" :key="image.path" type="button" class="docs-image-dialog__item" @click="emit('pick', image.path)">
                        <span class="docs-image-dialog__thumb"><img v-if="urls[image.path]" :src="urls[image.path]" :alt="image.name" /></span>
                        <span class="docs-image-dialog__name ellipsis">{{ image.name }}</span>
                    </button>
                </div>
                <div v-else-if="!loading" class="docs-image-dialog__empty column items-center">
                    <q-icon name="image" size="2.5rem" color="grey-5" class="q-mb-sm" />
                    <span>{{ $t('managers.documentationManagement.images.empty') }}</span>
                </div>
            </q-scroll-area>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useDocs } from '../useDocsWorkingCopy'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'pick', path: string): void
}>()

const wc = useDocs()
const { t } = useI18n()
const $q = useQuasar()

const images = ref<{ name: string; path: string }[]>([])
const urls = ref<Record<string, string>>({})
const loading = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function release() {
    Object.values(urls.value).forEach((url) => URL.revokeObjectURL(url))
    urls.value = {}
}

async function load() {
    release()
    loading.value = true
    try {
        images.value = await wc.listImages()
        await Promise.all(
            images.value.map(async (image) => {
                try {
                    const blob = await wc.readImage(image.path)
                    if (blob) urls.value[image.path] = URL.createObjectURL(new Blob([blob], { type: image.name.endsWith('.svg') ? 'image/svg+xml' : blob.type }))
                } catch {
                    // a thumbnail that fails stays empty
                }
            })
        )
    } catch (error: any) {
        $q.notify({ type: 'negative', message: error?.message ?? t('common.error.generic') })
    } finally {
        loading.value = false
    }
}

async function onFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    uploading.value = true
    try {
        await wc.uploadImage(file, file.name)
        await load()
    } catch (error: any) {
        $q.notify({ type: 'negative', message: error?.message ?? t('common.error.generic') })
    } finally {
        uploading.value = false
    }
}
</script>

<style lang="scss" scoped>
.docs-image-dialog {
    width: min(640px, 92vw);
    height: min(520px, 80vh);
}

.docs-image-dialog__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    padding: 16px;
}

.docs-image-dialog__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 6px;
    border: 1px solid var(--kn-color-borders);
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    text-align: center;

    &:hover,
    &:focus-visible {
        border-color: var(--q-primary);
        background: var(--kn-color-selected);
    }
}

.docs-image-dialog__thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 90px;
    background: var(--kn-color-background);

    img {
        max-width: 100%;
        max-height: 100%;
    }
}

.docs-image-dialog__name {
    font-size: 0.75rem;
}

.docs-image-dialog__empty {
    padding: 32px 16px;
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.54);
}
</style>
