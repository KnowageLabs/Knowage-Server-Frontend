<template>
    <q-card data-tour-id="docs-site-card">
        <q-card-section class="docs-card__header row items-center no-wrap">
            <div class="kn-editor-card-label col">{{ $t('managers.documentationManagement.site.title') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
            <div class="row q-col-gutter-sm items-center">
                <div class="col-12" :class="logoMode === 'custom' ? 'col-md-5' : 'col-md-7'">
                    <q-input v-model="site.title" outlined dense hide-bottom-space :label="$t('managers.documentationManagement.site.siteTitle')" />
                </div>
                <div :class="logoMode === 'custom' ? 'col-12 col-sm-4 col-md-2' : 'col-12 col-md-5'">
                    <q-select v-model="logoMode" outlined dense hide-bottom-space emit-value map-options :options="logoOptions" :label="$t('managers.documentationManagement.site.logo')">
                        <template v-if="logoMode === 'tenant' && logoSrc" #prepend>
                            <img :src="logoSrc" class="docs-site-card__logo" alt="" @error="onError" />
                        </template>
                    </q-select>
                </div>
                <div v-if="logoMode === 'custom'" class="col-12 col-sm-8 col-md-5">
                    <q-input v-model="customLogo" outlined dense hide-bottom-space :label="$t('managers.documentationManagement.site.logoUrl')" @update:model-value="onCustomLogo">
                        <template #prepend>
                            <img v-if="logoSrc" :src="logoSrc" class="docs-site-card__logo" alt="" @error="onError" />
                        </template>
                        <template #append>
                            <q-btn flat round dense size="sm" icon="photo_library" @click="imageDialog = true">
                                <q-tooltip :delay="500">{{ $t('managers.documentationManagement.site.pickImage') }}</q-tooltip>
                            </q-btn>
                            <q-icon name="help_outline" size="18px">
                                <q-tooltip>{{ $t('managers.documentationManagement.site.logoUrlHint') }}</q-tooltip>
                            </q-icon>
                        </template>
                    </q-input>
                </div>
                <div class="col-12 row items-center q-gutter-x-xl">
                    <q-toggle v-model="site.dense" dense :label="$t('managers.documentationManagement.site.dense')" />
                    <div class="row items-center no-wrap">
                        <q-toggle v-model="site.menu" dense :label="$t('managers.documentationManagement.site.menu')" />
                        <q-icon name="help_outline" size="16px" class="kn-editor-card-hint q-ml-xs">
                            <q-tooltip>{{ $t('managers.documentationManagement.site.menuHint') }}</q-tooltip>
                        </q-icon>
                    </div>
                </div>
            </div>
        </q-card-section>
        <DocsImageDialog :visible="imageDialog" @close="imageDialog = false" @pick="onPickImage" />
    </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useDocs } from '../useDocsWorkingCopy'
import { useDocsLogo } from '../useDocsLogo'
import DocsImageDialog from '../dialogs/DocsImageDialog.vue'

const wc = useDocs()
const { t } = useI18n()
const $q = useQuasar()

const site = wc.site
const { logoSrc, onError } = useDocsLogo(site)

const imageDialog = ref(false)
const logoMode = ref<'tenant' | 'none' | 'custom'>(site.value.logo === true ? 'tenant' : typeof site.value.logo === 'string' && site.value.logo ? 'custom' : 'none')
const customLogo = ref(typeof site.value.logo === 'string' ? site.value.logo : '')

const logoOptions = [
    { label: t('managers.documentationManagement.site.logoTenant'), value: 'tenant' },
    { label: t('managers.documentationManagement.site.logoCustom'), value: 'custom' },
    { label: t('managers.documentationManagement.site.logoNone'), value: 'none' }
]

watch(logoMode, (mode) => {
    site.value.logo = mode === 'tenant' ? true : mode === 'custom' ? customLogo.value || false : false
})

// Discard and restore change the site from outside.
watch(
    () => site.value.logo,
    (logo) => {
        if (logo === true) logoMode.value = 'tenant'
        else if (typeof logo === 'string' && logo) {
            logoMode.value = 'custom'
            customLogo.value = logo
        } else if (logoMode.value === 'tenant') logoMode.value = 'none'
    }
)

// The viewer takes an http or data URL as the logo.
function onCustomLogo(value: string | number | null) {
    site.value.logo = String(value ?? '').trim() || false
}

async function onPickImage(path: string) {
    imageDialog.value = false
    try {
        const blob = await wc.readImage(path)
        if (!blob) return
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(new Blob([blob], { type: path.endsWith('.svg') ? 'image/svg+xml' : blob.type }))
        })
        customLogo.value = dataUrl
        site.value.logo = dataUrl
    } catch (error: any) {
        $q.notify({ type: 'negative', message: error?.message ?? t('common.error.generic') })
    }
}
</script>

<style lang="scss" scoped>
// A fixed height: inside the field's prepend slot an image with only max sizes shrinks to nothing.
.docs-site-card__logo {
    flex: none;
    width: auto;
    height: 22px;
    max-width: 80px;
    object-fit: contain;
}
</style>
