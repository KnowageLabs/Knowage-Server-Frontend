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
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from './TableWidgetStyleDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'table-widget-paginator',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ITableWidgetPaginatorStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            paginatorStyleModel: null as ITableWidgetPaginatorStyle | null
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadPaginatorStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadPaginatorStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadPaginatorStyleModel)
        },
        loadPaginatorStyleModel() {
            if (this.widgetModel?.settings?.style?.paginator) this.paginatorStyleModel = this.widgetModel.settings.style.paginator
            else if (this.themeStyle) this.paginatorStyleModel = this.themeStyle
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.paginatorStyleModel) return
            this.paginatorStyleModel['background-color'] = model['background-color'] ?? ''
            this.paginatorStyleModel.color = model.color ?? ''
            this.paginatorStyleModel['justify-content'] = model['justify-content'] ?? ''
            this.paginatorStyleChanged()
        },
        paginatorStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        }
    }
})
</script>
