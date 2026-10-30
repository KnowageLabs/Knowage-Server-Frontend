<template>
    <div class="docs-site-block row items-center no-wrap" :class="{ 'docs-site-block--selected': selected }" role="button" tabindex="0" data-tour-id="docs-site-block" @click="emit('select')" @keydown.enter="emit('select')">
        <img v-if="logoSrc" :src="logoSrc" class="docs-site-block__logo" alt="" @error="onError" />
        <div class="col column no-wrap docs-site-block__text">
            <span class="docs-site-block__title ellipsis">{{ site.title || $t('managers.documentationManagement.site.untitled') }}</span>
            <span class="docs-site-block__sub ellipsis">{{ $t('managers.documentationManagement.site.blockHint') }}</span>
        </div>
        <DocsLetter :letter="letter" />
        <q-icon name="settings" size="16px" class="docs-site-block__icon" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDocs } from '../useDocsWorkingCopy'
import { useDocsLogo } from '../useDocsLogo'
import DocsLetter from './DocsLetter.vue'

defineProps<{ selected: boolean }>()
const emit = defineEmits<{ (e: 'select'): void }>()

const wc = useDocs()
const site = wc.site
const { logoSrc, onError } = useDocsLogo(site)

// The block opens the site settings and the start page, so it shows a change in either.
const letter = computed(() => (wc.siteChanged.value ? 'M' : wc.homeLetter.value))
</script>

<style lang="scss" scoped>
.docs-site-block {
    flex: none;
    gap: 8px;
    min-height: 48px;
    padding: 6px 8px 6px 12px;
    border-bottom: 1px solid var(--kn-color-borders);
    cursor: pointer;
    outline: none;

    &:hover,
    &:focus-visible {
        background: rgba(0, 0, 0, 0.04);
    }
}

.docs-site-block--selected,
.docs-site-block--selected:hover {
    background: var(--kn-tree-selected-background-color);
}

.docs-site-block__logo {
    max-width: 90px;
    max-height: 28px;
}

.docs-site-block__text {
    min-width: 0;
}

.docs-site-block__title {
    font-size: 0.875rem;
    font-weight: 500;
}

.docs-site-block__sub {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.54);
}

.docs-site-block__icon {
    color: rgba(0, 0, 0, 0.45);
}
</style>
