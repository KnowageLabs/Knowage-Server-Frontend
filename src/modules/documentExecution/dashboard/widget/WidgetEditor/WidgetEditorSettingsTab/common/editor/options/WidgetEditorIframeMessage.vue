<template>
    <div class="p-fluid p-formgrid p-grid">
        <div class="p-field p-col-12">
            <span class="p-float-label">
                <InputText v-model="value" class="kn-material-input" @change="onColumnChanged" />
                <label class="kn-material-input-label">{{ $t('common.value') }}</label>
            </span>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from '../WidgetTagsDialogDescriptor.json'

export default defineComponent({
    name: 'widget-editor-selections',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['insertChanged'],
    data() {
        return {
            descriptor,
            value: ''
        }
    },
    created() {},
    methods: {
        onColumnChanged() {
            const forInsert = `<div kn-message="${this.value}"></div>`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
