<template>
    <div v-if="flexStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <q-select v-model="flexStyleModel.justifyContent" :options="justifyContentOptions" :label="$t('dashboard.widgetEditor.selectorWidget.flex.justifyContent')" dense outlined emit-value map-options clearable @update:model-value="flexStyleChanged" />
            </div>
            <div class="col-6">
                <q-select v-model="flexStyleModel.alignItems" :options="alignItemsOptions" :label="$t('dashboard.widgetEditor.selectorWidget.flex.alignItems')" dense outlined emit-value map-options clearable @update:model-value="flexStyleChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorWidgetFlexStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-flex-style',
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<ISelectorWidgetFlexStyle | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            flexStyleModel: null as ISelectorWidgetFlexStyle | null,
            justifyContentOptions: [
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.flexStart'), value: 'flex-start' },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.center'), value: 'center' },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.flexEnd'), value: 'flex-end' },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.spaceBetween'), value: 'space-between' },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.spaceAround'), value: 'space-around' },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.spaceEvenly'), value: 'space-evenly' }
            ],
            alignItemsOptions: [
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.flexStart'), value: 'flex-start' },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.center'), value: 'center' },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.flexEnd'), value: 'flex-end' },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.flex.stretch'), value: 'stretch' }
            ]
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadFlexStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadFlexStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadFlexStyleModel)
        },
        loadFlexStyleModel() {
            if (this.widgetModel?.settings?.style?.flex) {
                this.flexStyleModel = this.widgetModel.settings.style.flex
            } else if (this.themeStyle) {
                this.flexStyleModel = this.themeStyle
            }
        },
        flexStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        }
    }
})
</script>
