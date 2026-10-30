<template>
    <span v-if="letter" class="docs-letter" :class="`docs-letter--${letter}`" :title="$t(`managers.documentationManagement.letters.${letter}`)">{{ letter }}</span>
</template>

<script setup lang="ts">
import type { iDocsLetter } from '../DocumentationManagement'

defineProps<{ letter: iDocsLetter | '' }>()
</script>

<style lang="scss" scoped>
.docs-letter {
    display: inline-block;
    min-width: 14px;
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
}

.docs-letter--U {
    color: var(--kn-docs-change-new);
}

.docs-letter--M {
    color: var(--kn-docs-change-modified);
}

.docs-letter--R {
    color: var(--kn-docs-change-renamed);
}

.docs-letter--D {
    color: var(--kn-docs-change-deleted);
}
</style>
