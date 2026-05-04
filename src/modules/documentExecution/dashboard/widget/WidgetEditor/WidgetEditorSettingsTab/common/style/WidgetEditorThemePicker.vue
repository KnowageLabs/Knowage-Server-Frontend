<template>
    <div v-if="widget?.settings?.style" class="q-pb-md kn-width-full">
        <q-select v-model="widget.settings.style.themeId" :options="themes" :label="$t('dashboard.widgetEditor.widgetTheme')" option-label="themeName" option-value="id" emit-value map-options clearable outlined dense @update:model-value="onThemeSelected" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { mapActions } from 'pinia'
import { applyStylesToWidget } from '@/modules/documentExecution/dashboard/generalSettings/themes/ThemesHelper'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export default defineComponent({
    name: 'widget-editor-theme-picker',
    components: {},
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
            if (this.widget) this.widget.settings.style.themeId = null
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
            if (this.widget?.settings.style?.themeName) delete this.widget.settings.style.themeName
            if (this.widget.settings.style.themeId) this.onThemeSelected(this.widget.settings.style.themeId)
        },
        onThemeSelected(value: number | null) {
            const selectedTheme = this.themes.find((theme: IDashboardTheme) => theme.id === value)
            if (!selectedTheme || !this.widget) return
            const widgetTypeForThemes = this.getWidgetTypeForThemes()
            applyStylesToWidget(this.widget, selectedTheme, selectedTheme.config[widgetTypeForThemes])
            emitter.emit('themeSelected')
            this.$emit('themeSelected', selectedTheme.themeName)
        },
        getWidgetTypeForThemes() {
            if (!this.widget) return ''
            switch (this.widget.type) {
                case 'highcharts':
                case 'chartJS':
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
