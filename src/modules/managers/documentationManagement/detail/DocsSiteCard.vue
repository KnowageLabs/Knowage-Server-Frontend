<template>
    <q-card data-tour-id="docs-site-card" class="docs-site-card">
        <q-card-section class="docs-card__header row items-center no-wrap">
            <div class="kn-editor-card-label col">{{ $t('managers.documentationManagement.site.title') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
            <div class="docs-site-card__identity" :class="{ 'docs-site-card__identity--custom': logoMode === 'custom' }">
                <q-input v-model="site.title" outlined dense hide-bottom-space :label="$t('managers.documentationManagement.site.siteTitle')" />
                <q-select v-model="logoMode" outlined dense hide-bottom-space emit-value map-options :options="logoOptions" :label="$t('managers.documentationManagement.site.logo')">
                    <template v-if="logoMode === 'tenant' && logoSrc" #prepend>
                        <img :src="logoSrc" class="docs-site-card__logo" alt="" @error="onError" />
                    </template>
                </q-select>
                <q-input v-if="logoMode === 'custom'" v-model="customLogo" outlined dense hide-bottom-space :label="$t('managers.documentationManagement.site.logoUrl')" @update:model-value="onCustomLogo">
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
        </q-card-section>
        <q-separator />
        <!-- Each switch is a row with a caption, in two groups (spec 14.11). -->
        <q-card-section class="docs-site-card__groups">
            <div>
                <div class="docs-site-card__group">{{ $t('managers.documentationManagement.site.readerGroup') }}</div>
                <label v-for="toggle in READER_TOGGLES" :key="toggle" class="docs-site-card__row">
                    <span class="col">
                        <span class="docs-site-card__label">{{ $t(`managers.documentationManagement.site.${toggle}`) }}</span>
                        <span class="docs-site-card__caption">{{ $t(`managers.documentationManagement.site.${toggle}Hint`) }}</span>
                    </span>
                    <q-toggle v-model="site[toggle]" dense />
                </label>
                <!-- The search position matters only when there is a search. -->
                <div v-if="site.search" class="docs-site-card__position">
                    <div class="docs-site-card__label">{{ $t('managers.documentationManagement.site.searchPosition') }}</div>
                    <div class="docs-site-card__positions" role="radiogroup" :aria-label="$t('managers.documentationManagement.site.searchPosition')">
                        <button v-for="position in SEARCH_POSITIONS" :key="position" type="button" role="radio" class="docs-site-card__position-card" :class="{ 'docs-site-card__position-card--active': site.searchPosition === position }" :aria-checked="site.searchPosition === position" @click="site.searchPosition = position">
                            <span class="docs-site-card__thumb" :class="`docs-site-card__thumb--${position}`"><i class="bar" /><i class="side" /><i class="brand" /><i class="search" /></span>
                            <span class="docs-site-card__label">{{ $t(`managers.documentationManagement.site.position.${position}`) }}</span>
                            <span class="docs-site-card__caption">{{ $t(`managers.documentationManagement.site.position.${position}Hint`) }}</span>
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <div class="docs-site-card__group">{{ $t('managers.documentationManagement.site.menuGroup') }}</div>
                <label v-for="toggle in MENU_TOGGLES" :key="toggle" class="docs-site-card__row">
                    <span class="col">
                        <span class="docs-site-card__label">{{ $t(`managers.documentationManagement.site.${toggle}`) }}</span>
                        <span class="docs-site-card__caption">{{ $t(`managers.documentationManagement.site.${toggle}Hint`) }}</span>
                    </span>
                    <q-toggle v-model="site[toggle]" dense />
                </label>
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

// The page features of the viewer, then the look of the menu (spec 14.5, 14.11).
const READER_TOGGLES = ['toc', 'prevNext', 'search'] as const
const MENU_TOGGLES = ['dense', 'menu'] as const
const SEARCH_POSITIONS = ['header', 'menu', 'sidebar'] as const

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
// The card follows its own width, not the window: the drawer and focus mode change it.
.docs-site-card {
    container-type: inline-size;
}

.docs-site-card__identity {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.docs-site-card__identity--custom {
    grid-template-columns: 1fr 180px 1fr;
}

// A fixed height: inside the field's prepend slot an image with only max sizes shrinks to nothing.
.docs-site-card__logo {
    flex: none;
    width: auto;
    height: 22px;
    max-width: 80px;
    object-fit: contain;
}

.docs-site-card__groups {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 32px;
    align-items: start;
}

.docs-site-card__group {
    margin-bottom: 4px;
    color: rgba(0, 0, 0, 0.54);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.docs-site-card__row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--kn-color-borders);
    cursor: pointer;
}

.docs-site-card__label {
    display: block;
    font-size: 14px;
}

.docs-site-card__caption {
    display: block;
    color: rgba(0, 0, 0, 0.54);
    font-size: 12px;
}

.docs-site-card__position {
    padding-top: 12px;
}

// The cards share the width of the column.
.docs-site-card__positions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
}

.docs-site-card__position-card {
    flex: 1 1 0;
    min-width: 0;
    padding: 6px;
    border: 1px solid var(--kn-color-borders);
    border-radius: 6px;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:hover {
        border-color: rgba(0, 0, 0, 0.4);
    }
}

.docs-site-card__position-card--active,
.docs-site-card__position-card--active:hover {
    padding: 5px;
    border: 2px solid var(--kn-docs-primary);
}

// A small drawing of the docs layout: top bar, menu, brand and search box.
.docs-site-card__thumb {
    position: relative;
    display: block;
    height: 44px;
    margin-bottom: 6px;
    border: 1px solid var(--kn-color-borders);
    border-radius: 3px;
    overflow: hidden;

    i {
        position: absolute;
        display: block;
    }

    .bar {
        top: 0;
        right: 0;
        left: 0;
        height: 9px;
        background: #cfd8dc;
    }

    .side {
        top: 9px;
        bottom: 0;
        left: 0;
        width: 28%;
        background: #eceff1;
    }

    .brand {
        top: 2px;
        left: 3%;
        width: 14%;
        height: 5px;
        background: #90a4ae;
    }

    .search {
        height: 5px;
        border: 1px solid var(--kn-docs-primary);
        background: color-mix(in srgb, var(--kn-docs-primary) 15%, transparent);
    }
}

.docs-site-card__thumb--header .search {
    top: 2px;
    left: 38%;
    width: 24%;
}

.docs-site-card__thumb--menu .search {
    top: 13px;
    left: 3%;
    width: 22%;
}

.docs-site-card__thumb--sidebar {
    .bar {
        display: none;
    }
    .side {
        top: 0;
    }
    .search {
        top: 11px;
        left: 3%;
        width: 22%;
    }
}

@container (max-width: 760px) {
    .docs-site-card__identity,
    .docs-site-card__identity--custom,
    .docs-site-card__groups {
        grid-template-columns: 1fr;
    }
}
</style>
