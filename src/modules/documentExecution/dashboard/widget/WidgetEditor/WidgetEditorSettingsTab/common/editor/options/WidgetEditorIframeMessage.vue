<template>
    <q-input v-model="value" outlined dense :label="$t('common.value')" @update:model-value="onColumnChanged" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-editor-iframe-message',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['insertChanged'],
    data() {
        return {
            value: ''
        }
    },
    methods: {
        onColumnChanged() {
            const forInsert = `<div kn-message="${this.value}"></div>`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
