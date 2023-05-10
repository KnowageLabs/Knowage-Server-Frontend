<template>
    <div v-if="paginatorStyleModel" class="p-grid p-ai-center kn-flex p-p-4">
        <div class="p-col-12 p-py-4">
            <WidgetEditorStyleToolbar :options="descriptor.paginatorStyleSettings" :prop-model="paginatorStyleModel" @change="onStyleToolbarChange"> </WidgetEditorStyleToolbar>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ITableWidgetPaginatorStyle, IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/Dashboard/Dashboard'
import descriptor from './TableWidgetStyleDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'table-widget-paginator',
    components: { WidgetEditorStyleToolbar },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true }
    },
    data() {
        return {
            descriptor,
            paginatorStyleModel: null as ITableWidgetPaginatorStyle | null
        }
    },
    created() {
        this.loadPaginatorStyleModel()
    },
    methods: {
        loadPaginatorStyleModel() {
            if (!this.widgetModel) return
            if (this.widgetModel.settings?.style?.paginator) this.paginatorStyleModel = this.widgetModel.settings.style.paginator
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.paginatorStyleModel) return
            this.paginatorStyleModel = {
                'background-color': model['background-color'] ?? '',
                color: model.color ?? '',
                'justify-content': model['justify-content'] ?? ''
            }
        }
    }
})
</script>
