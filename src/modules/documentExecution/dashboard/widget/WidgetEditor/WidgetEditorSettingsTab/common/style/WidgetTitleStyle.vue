<template>
    <div v-if="titleStyleModel" class="p-ai-center kn-flex p-p-4">
        <span v-if="themeManagerMode" class="p-d-flex p-flex-row p-ai-center p-mb-2"> {{ $t('common.enabled') }} <q-toggle v-model="titleStyleModel.enabled" color="black" /> </span>

        <form class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12 p-lg-8">
                <span class="p-float-label">
                    <InputText v-model="(titleStyleModel as IWidgetTitle).text" class="kn-material-input p-inputtext-sm kn-flex" :disabled="titleStyleDisabled" @change="titleStyleChanged" />
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.text') }}</label>
                </span>
            </div>
            <div class="p-field p-col-12 p-lg-4">
                <span class="p-float-label">
                    <InputNumber v-model="titleStyleModel.height" class="kn-material-input p-inputtext-sm" :disabled="titleStyleDisabled" @blur="titleStyleChanged" />
                    <label class="kn-material-input-label">{{ $t('common.height') }}</label>
                </span>
            </div>
        </form>

        <WidgetEditorStyleToolbar :options="toolbarStyleSettings" :prop-model="titleStyleModel.properties" :disabled="titleStyleDisabled" @change="onStyleToolbarChange"> </WidgetEditorStyleToolbar>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel, IWidgetTitle } from '@/modules/documentExecution/Dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import InputNumber from 'primevue/inputnumber'
import WidgetEditorStyleToolbar from '../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'widget-title-style',
    components: { InputNumber, WidgetEditorStyleToolbar },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        toolbarStyleSettings: { type: Array, required: true },
        themeManagerMode: { default: false, type: Boolean }
    },
    data() {
        return {
            titleStyleModel: null as IWidgetTitle | null,
            widgetType: '' as string
        }
    },
    computed: {
        titleStyleDisabled() {
            return !this.titleStyleModel || !this.titleStyleModel.enabled
        }
    },
    created() {
        this.loadTitleStyleModel()
    },
    methods: {
        loadTitleStyleModel() {
            if (!this.widgetModel) return
            this.widgetType = this.widgetModel.type
            if (this.widgetModel.settings?.style?.title) this.titleStyleModel = this.widgetModel.settings.style.title
        },
        titleStyleChanged() {
            switch (this.widgetType) {
                case 'table':
                    emitter.emit('refreshTable', this.widgetModel.id)
                    break
                case 'selector':
                    emitter.emit('refreshSelector', this.widgetModel.id)
                    break
                case 'selection':
                    emitter.emit('refreshSelection', this.widgetModel.id)
            }
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.titleStyleModel) return
            this.titleStyleModel.properties = {
                'background-color': model['background-color'] ?? 'rgb(137, 158, 175)',
                color: model.color ?? 'rgb(255, 255, 255)',
                'justify-content': model['justify-content'] ?? 'center',
                'font-size': model['font-size'] ?? '14px',
                'font-family': model['font-family'] ?? '',
                'font-style': model['font-style'] ?? 'normal',
                'font-weight': model['font-weight'] ?? ''
            }
            this.titleStyleChanged()
        }
    }
})
</script>

<style lang="scss" scoped>
#height-input-container {
    max-width: 200px;
}
</style>
