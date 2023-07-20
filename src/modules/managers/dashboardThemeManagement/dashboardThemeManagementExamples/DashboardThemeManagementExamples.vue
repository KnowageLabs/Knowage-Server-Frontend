<template>
    <div class="p-p-2 p-d-flex" style="min-height: 415px">
        <WidgetRenderer :widget="tableModel" :widget-data="tableWidgetMock.tableDataMock" :widget-initial-data="tableWidgetMock.tableDataMock" :datasets="[]" :dashboard-id="'table'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IDashboardTheme } from '../DashboardThememanagement'
import tableWidgetMock from './mocks/TableWidgetMock.json'
import WidgetRenderer from '@/modules/documentExecution/dashboard/widget/WidgetRenderer.vue'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'dashboard-theme-management-editor',
    components: { WidgetRenderer },
    props: { selectedThemeProp: { type: Object as any, required: true } },
    data() {
        return {
            tableWidgetMock,
            selectedTheme: {} as IDashboardTheme,
            tableModel: {} as any
        }
    },
    computed: {},
    watch: {
        selectedThemeProp() {
            this.loadSelectedTheme()
            this.loadWidgetModels()
        }
    },
    created() {
        this.loadSelectedTheme()
        this.loadWidgetModels()
    },
    methods: {
        loadSelectedTheme() {
            this.selectedTheme = this.selectedThemeProp as IDashboardTheme
        },
        loadWidgetModels() {
            this.tableModel = deepcopy(this.tableWidgetMock.tableModelMock)
            this.tableModel.settings.style = this.selectedTheme.config.table.style
        }
    }
})
</script>
<style lang="scss"></style>
