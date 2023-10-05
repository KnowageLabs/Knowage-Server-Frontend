<template>
    <div v-if="widget?.settings?.style" class="p-grid p-p-4">
        {{ widget.settings.style }}
        <div class="p-col-12 p-d-flex p-flex-column p-pb-2">
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.widgetTheme') }}</label>
            <Dropdown v-model="widget.settings.style.themeName" class="kn-material-input kn-full-width" :options="themes" option-label="themeName" option-value="themeName" @change="onThemeSelected"> </Dropdown>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { mapActions } from 'pinia'
import { applyStylesToWidget } from '@/modules/documentExecution/dashboard/generalSettings/themes/ThemesHelper'
import Dropdown from 'primevue/dropdown'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export default defineComponent({
    name: 'widget-editor-theme-picker',
    components: { Dropdown },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, styleChangedFlag: { type: Boolean, required: true } },
    emits: ['themeSelected'],
    data() {
        return {
            widget: null as IWidget | null,
            themes: [] as IDashboardTheme[]
        }
    },
    computed: {},
    watch: {
        styleChangedFlag() {
            if (this.widget) this.widget.settings.style.themeName = null
        }
    },
    created() {
        this.loadThemes()
        this.loadWidgetStyle()
    },
    methods: {
        ...mapActions(dashboardStore, ['getAllThemes']),
        loadThemes() {
            this.themes = this.getAllThemes()
        },
        loadWidgetStyle() {
            this.widget = this.widgetModel
        },
        onThemeSelected(event: { value: string }) {
            const selectedTheme = this.themes.find((theme: IDashboardTheme) => theme.themeName === event.value)
            if (!selectedTheme || !this.widget) return
            const widgetTypeForThemes = this.getWidgetTypeForThemes()
            applyStylesToWidget(this.widget.settings.style, selectedTheme.themeName, selectedTheme.config[widgetTypeForThemes])
            emitter.emit('themeSelected')
            this.$emit('themeSelected', selectedTheme.themeName)
        },
        getWidgetTypeForThemes() {
            if (!this.widget) return ''
            switch (this.widget.type) {
                case 'highcharts':
                case 'chartJS':
                case 'vega':
                    return 'chart'
                case 'customchart':
                    return 'customChart'
                case 'static-pivot-table':
                case 'ce-pivot-table':
                    return 'pivot'
                case 'selection':
                    return 'activeSelections'
                default:
                    return this.widget.type
            }
        }
    }
})
</script>

<style lang="scss" scoped></style>
