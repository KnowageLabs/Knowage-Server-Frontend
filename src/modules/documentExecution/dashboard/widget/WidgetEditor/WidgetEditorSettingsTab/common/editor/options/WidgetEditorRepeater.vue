<template>
    <div v-if="!widgetModel.dataset" class="row items-center text-warning q-mb-sm">
        <q-icon name="warning" class="q-mr-sm" />
        {{ $t('managers.functionsCatalog.noDatasetSelected') }}
    </div>
    <q-input v-else v-model="repeaterLimit" outlined dense :label="$t('dashboard.widgetEditor.editorTags.limit')" @update:model-value="onColumnChanged" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-editor-repeater',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['insertChanged'],
    data() {
        return {
            repeaterLimit: ''
        }
    },
    methods: {
        onColumnChanged() {
            let limit = null as any
            if (this.repeaterLimit) limit = this.repeaterLimit
            const forInsert = `<div kn-repeat="true" limit="${limit}"></div>`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
