<template>
    <!-- The docs renderer itself, so the example shows the --kn-docs-* tokens exactly as the docs site uses them. -->
    <DocsMarkdown :source="markdown" class="markdownContent" />
</template>

<script setup lang="ts">
import DocsMarkdown from '@/components/documentation/DocsMarkdown.vue'
import examples from './ThemeManagementDescriptor.json'

const markdown = examples.examples.markdown
</script>
<style lang="scss" scoped>
.markdownContent {
    width: 100%;
    padding: 16px 24px;
}
</style>
