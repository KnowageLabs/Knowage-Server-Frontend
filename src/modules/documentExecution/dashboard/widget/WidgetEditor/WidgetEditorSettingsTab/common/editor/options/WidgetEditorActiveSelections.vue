<template>
    <q-select v-model="selectedColumnName" outlined dense :options="widgetModel.columns" option-value="columnName" option-label="columnName" emit-value map-options :label="$t('common.column')" @update:model-value="onColumnChanged" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-editor-active-selections',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['insertChanged'],
    data() {
        return {
            selectedColumnName: ''
        }
    },
    created() {},
    methods: {
        onColumnChanged() {
            const forInsert = `[kn-active-selection='${this.selectedColumnName}']`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
