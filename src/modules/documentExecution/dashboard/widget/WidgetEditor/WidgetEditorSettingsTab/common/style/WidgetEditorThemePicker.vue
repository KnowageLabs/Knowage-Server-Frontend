<template>
    <div v-if="widget?.settings?.style" class="q-pb-sm q-mx-sm">
        <q-card>
            <q-select class="q-mx-md" v-model="widget.settings.style.themeId" :options="themes" :label="$t('dashboard.widgetEditor.widgetTheme')" option-label="themeName" option-value="id" emit-value map-options clearable borderless dense @update:model-value="onThemeSelected" />
        </q-card>
    </div>
</template>
2

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { mapActions, mapState } from 'pinia'
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
            isApplyingTheme: false
        }
    },
    computed: {
        ...mapState(dashboardStore, { themes: 'allThemes' })
    },
    watch: {
        styleChangedFlag() {
            if (this.isApplyingTheme) return
            if (this.widget) this.widget.settings.style.themeId = null
        }
    },
    created() {
        this.loadWidgetStyle()
    },
    methods: {
        ...mapActions(dashboardStore, ['getAllThemes']),
        loadWidgetStyle() {
            this.widget = this.widgetModel
            if (this.widget?.settings.style?.themeName) delete this.widget.settings.style.themeName
            if (this.widget.settings.style.themeId) this.onThemeSelected(this.widget.settings.style.themeId)
        },
        onThemeSelected(value: number | null) {
            if (this.isApplyingTheme) return
            const selectedTheme = this.themes.find((theme: IDashboardTheme) => theme.id === value)
            if (!selectedTheme || !this.widget) return
            this.isApplyingTheme = true
            const widgetTypeForThemes = this.getWidgetTypeForThemes()
            applyStylesToWidget(this.widget, selectedTheme, selectedTheme.config[widgetTypeForThemes])
            emitter.emit('themeSelected')
            this.$emit('themeSelected', selectedTheme.themeName)
            this.$nextTick(() => {
                this.isApplyingTheme = false
            })
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
