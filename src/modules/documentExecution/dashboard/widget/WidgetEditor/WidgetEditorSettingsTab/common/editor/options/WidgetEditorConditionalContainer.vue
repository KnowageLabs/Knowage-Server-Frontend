<template>
    <q-input v-model="condition" outlined dense type="textarea" rows="4" maxlength="150" :label="$t('common.condition')" @update:model-value="onColumnChanged" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'widget-editor-conditional-container',
    components: {},
    emits: ['insertChanged'],
    data() {
        return {
            condition: ''
        }
    },
    methods: {
        onColumnChanged() {
            const forInsert = `<div kn-if="${this.condition}"></div>`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
