<template>
    <q-input v-model="i18n" outlined dense :label="$t('dashboard.widgetEditor.editorTags.i18n')" @update:model-value="onColumnChanged" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'widget-editor-internationalization',
    emits: ['insertChanged'],
    data() {
        return {
            i18n: ''
        }
    },
    methods: {
        onColumnChanged() {
            const forInsert = `[kn-i18n='${this.i18n}']`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
