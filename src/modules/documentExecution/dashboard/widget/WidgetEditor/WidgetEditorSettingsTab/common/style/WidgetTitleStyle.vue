<template>
    <div v-if="titleStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <div v-if="themeStyle" class="col-12">
                <q-toggle v-model="titleStyleModel.enabled" :label="$t('common.enabled')" @update:model-value="titleStyleChanged" />
            </div>

            <div v-if="!themeStyle" class="col-12">
                <q-input v-model="titleStyleModel.text" outlined dense :label="$t('common.text')" :disable="titleStyleDisabled" @change="titleStyleChanged(true)">
                    <template #append>
                        <q-btn v-if="hasDynamicTitleOptions" flat round dense icon="data_object" :disable="titleStyleDisabled" :title="dynamicTitleButtonTitle">
                            <q-menu auto-close>
                                <q-list dense>
                                    <q-item v-if="hasDashboardParameters" clickable @click="openTagsDialog('parameters')">
                                        <q-item-section>{{ $t('dashboard.widgetEditor.editorTags.parameters') }}</q-item-section>
                                    </q-item>
                                    <q-item v-if="hasDashboardVariables" clickable @click="openTagsDialog('variables')">
                                        <q-item-section>{{ $t('dashboard.widgetEditor.editorTags.variables') }}</q-item-section>
                                    </q-item>
                                </q-list>
                            </q-menu>
                        </q-btn>
                    </template>
                </q-input>
            </div>

            <div class="col-4">
                <q-input v-model="titleStyleModel.height" type="number" outlined dense :label="$t('common.height')" :disable="titleStyleDisabled" @change="titleStyleChanged" />
            </div>
            <div class="col-4">
                <q-input v-model="titleStyleModel.properties['padding-left']" outlined dense :label="$t('dashboard.widgetEditor.padding.paddingLeft')" :disable="titleStyleDisabled" @change="titleStyleChanged" />
            </div>
            <div class="col-4">
                <q-input v-model="titleStyleModel.properties['padding-right']" outlined dense :label="$t('dashboard.widgetEditor.padding.paddingRight')" :disable="titleStyleDisabled" @change="titleStyleChanged" />
            </div>

            <div class="col-12">
                <WidgetEditorStyleToolbar :options="toolbarStyleSettings" :prop-model="titleStyleModel.properties" :disabled="titleStyleDisabled" @change="onStyleToolbarChange" />
            </div>
        </div>
    </div>

    <WidgetTitleDynamicDialog v-if="widgetModel" :visible="dynamicDialogVisible" :mode="dynamicDialogMode" :variables="dashboardVariables" :dashboard-id="dashboardId" @close="closeDynamicDialog" @insert="onDynamicTitleInsert" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapState } from 'pinia'
import { IVariable, IWidget, IWidgetStyleToolbarModel, IWidgetTitle } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import WidgetTitleDynamicDialog from './WidgetTitleDynamicDialog.vue'
import WidgetEditorStyleToolbar from '../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'widget-title-style',
    components: { WidgetEditorStyleToolbar, WidgetTitleDynamicDialog },
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<IWidgetTitle | null>, required: true },
        toolbarStyleSettings: { type: Array, required: true },
        dashboardId: { type: String, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            titleStyleModel: null as IWidgetTitle | null,
            dynamicDialogVisible: false,
            dynamicDialogMode: 'parameters' as 'parameters' | 'variables'
        }
    },
    computed: {
        ...mapState(dashboardStore, ['dashboards']),
        dashboardDrivers() {
            return this.dashboards[this.dashboardId]?.drivers ?? []
        },
        dashboardVariables(): IVariable[] {
            return this.dashboards[this.dashboardId]?.configuration?.variables ?? []
        },
        hasDashboardParameters() {
            return this.dashboardDrivers.length > 0
        },
        hasDashboardVariables() {
            return this.dashboardVariables.length > 0
        },
        hasDynamicTitleOptions() {
            return this.hasDashboardParameters || this.hasDashboardVariables
        },
        dynamicTitleButtonTitle() {
            return `${this.$t('common.add')} ${this.$t('dashboard.widgetEditor.editorTags.parameters')} / ${this.$t('dashboard.widgetEditor.editorTags.variables')}`
        },
        titleStyleDisabled() {
            return !this.titleStyleModel || !this.titleStyleModel.enabled
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadTitleStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadTitleStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadTitleStyleModel)
        },
        loadTitleStyleModel() {
            if (this.widgetModel?.settings?.style?.title) this.titleStyleModel = this.widgetModel.settings.style.title
            else if (this.themeStyle) this.titleStyleModel = this.themeStyle
        },
        openTagsDialog(mode: 'parameters' | 'variables') {
            if ((mode === 'parameters' && !this.hasDashboardParameters) || (mode === 'variables' && !this.hasDashboardVariables)) return
            this.dynamicDialogMode = mode
            this.dynamicDialogVisible = true
        },
        closeDynamicDialog() {
            this.dynamicDialogVisible = false
        },
        onDynamicTitleInsert(value: string) {
            if (!this.titleStyleModel) return
            this.titleStyleModel.text = `${this.titleStyleModel.text ?? ''}${value}`
            this.dynamicDialogVisible = false
            this.titleStyleChanged(true)
        },
        titleStyleChanged(titleTextChanged: boolean = false) {
            if (titleTextChanged) return
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.titleStyleModel) return

            this.titleStyleModel.properties['background-color'] = model['background-color'] ?? 'rgb(137, 158, 175)'
            this.titleStyleModel.properties.color = model.color ?? 'rgb(255, 255, 255)'
            this.titleStyleModel.properties['justify-content'] = model['justify-content'] ?? 'center'
            this.titleStyleModel.properties['text-align'] = model['text-align'] ?? 'center'
            this.titleStyleModel.properties['font-size'] = model['font-size'] ?? '14px'
            this.titleStyleModel.properties['font-family'] = model['font-family'] ?? ''
            this.titleStyleModel.properties['font-style'] = model['font-style'] ?? 'normal'
            this.titleStyleModel.properties['font-weight'] = model['font-weight'] ?? ''
            this.titleStyleChanged()
        }
    }
})
</script>
