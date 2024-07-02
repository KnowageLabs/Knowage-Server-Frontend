<template>
    <div v-if="selectedTheme" class="kn-overflow dashboard-scrollbar kn-flex">
        <div class="p-field p-mt-2 p-col-12">
            <span class="p-float-label">
                <InputText v-model="selectedTheme.themeName" class="kn-material-input" />
                <label class="kn-material-input-label">{{ $t('common.name') }}</label>
            </span>
        </div>

        <div class="q-pa-md q-gutter-sm p-pl-0">
            <q-tree v-if="!treeLoading" :nodes="widgetTree" node-key="key">
                <template #default-header="prop">
                    <div class="row items-center kn-width-full">
                        <div>{{ prop.node.label }}</div>
                        <Button v-if="prop.node.isParent" icon="fas fa-magnifying-glass" class="p-button-text p-button-rounded p-button-plain p-ml-auto" :title="$t('managers.dashboardThemeManager.scrollToWidget')" @click.stop="scrollToExample(prop.node.key)" />
                    </div>
                </template>
                <template #body-generic="prop" @click="scrollToExample">
                    <div style="color: black">
                        <WidgetTitleStyle v-if="prop.node.key.includes('title-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.title" :toolbar-style-settings="descriptor.defaultToolbarStyleOptions" class="no-padding" />
                        <WidgetBordersStyle v-else-if="prop.node.key.includes('borders-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.borders" class="no-padding" />
                        <WidgetPaddingStyle v-else-if="prop.node.key.includes('padding-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.padding" class="no-padding" />
                        <WidgetShadowsStyle v-else-if="prop.node.key.includes('shadows-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.shadows" class="no-padding" />
                        <WidgetBackgroundColorStyle v-else-if="prop.node.key.includes('background-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.background" class="no-padding" />
                        <TableWidgetHeaders v-else-if="prop.node.key.includes('headers-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.headers" class="no-padding" />
                        <TableWidgetColumnStyle v-else-if="prop.node.key.includes('columns-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.columns" class="no-padding" />
                        <TableWidgetColumnStyle v-else-if="prop.node.key.includes('columnGroups-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.columnGroups" :mode="'columnGroups'" class="no-padding" />
                        <WidgetRowsStyle v-else-if="prop.node.key.includes('rows-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.rows" class="no-padding" />
                        <TableWidgetSummaryStyle v-else-if="prop.node.key.includes('summary-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.summary" class="no-padding" />
                        <TableWidgetPaginator v-else-if="prop.node.key.includes('paginator-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.paginator" class="no-padding" />
                        <SelectorWidgetLabelStyle v-else-if="prop.node.key.includes('label-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.label" class="no-padding" />
                        <SelectionsWidgetChipsStyle v-else-if="prop.node.key.includes('chips-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.chips" class="no-padding" />
                        <PivotTableTotalsStyle
                            v-else-if="prop.node.key.includes('totals-editor')"
                            :widget-model="null"
                            :theme-style="selectedTheme.config[prop.node.widgetType].style.totals"
                            :toolbar-style-settings="pivotDescriptor.columnHeadersToolbarStyleOptions"
                            :total-type="'totals'"
                            class="no-padding"
                        />
                        <PivotTableTotalsStyle
                            v-else-if="prop.node.key.includes('subTotals-editor')"
                            :widget-model="null"
                            :theme-style="selectedTheme.config[prop.node.widgetType].style.subTotals"
                            :toolbar-style-settings="pivotDescriptor.columnHeadersToolbarStyleOptions"
                            :total-type="'subTotals'"
                            class="no-padding"
                        />
                        <PivotTableTotalsStyle
                            v-else-if="prop.node.key.includes('crossTabHeaders-editor')"
                            :widget-model="null"
                            :theme-style="selectedTheme.config[prop.node.widgetType].style.crossTabHeaders"
                            :toolbar-style-settings="pivotDescriptor.columnHeadersToolbarStyleOptions"
                            :total-type="'crossTabHeaders'"
                            class="no-padding"
                        />
                        <PivotTableFieldsStyle v-else-if="prop.node.key.includes('fields-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.fields" :field-type="'fields'" class="no-padding" />
                        <PivotTableFieldsStyle v-else-if="prop.node.key.includes('fieldHeaders-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.fieldHeaders" :field-type="'fieldHeaders'" class="no-padding" />
                    </div>
                </template>
            </q-tree>
        </div>
        <ProgressSpinner v-if="treeLoading" class="kn-progress-spinner" style="position: relative; background-color: #a7a7a74d" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IDashboardTheme, IDashboardThemeConfig } from './DashboardThememanagement'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import ProgressSpinner from 'primevue/progressspinner'
import descriptor from './DashboardThemeManagementEditorDescriptor.json'
import pivotDescriptor from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/PivotTableWidget/PivotTableSettingsDescriptor.json'
import WidgetTitleStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetTitleStyle.vue'
import WidgetBordersStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetBordersStyle.vue'
import WidgetPaddingStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetPaddingStyle.vue'
import WidgetShadowsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetShadowsStyle.vue'
import WidgetBackgroundColorStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetBackgroundColorStyle.vue'
import TableWidgetHeaders from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/TableWidget/style/TableWidgetHeaders.vue'
import TableWidgetColumnStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/TableWidget/style/TableWidgetColumnStyle.vue'
import WidgetRowsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetRowsStyle.vue'
import TableWidgetSummaryStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/TableWidget/style/TableWidgetSummaryStyle.vue'
import TableWidgetPaginator from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/TableWidget/style/TableWidgetPaginator.vue'
import SelectorWidgetLabelStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetLabelStyle.vue'
import SelectionsWidgetChipsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectionsWidget/style/SelectionsWidgetChipsStyle.vue'
import PivotTableTotalsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/PivotTableWidget/style/PivotTableTotalsStyle.vue'
import PivotTableFieldsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/PivotTableWidget/style/PivotTableFieldsStyle.vue'

export default defineComponent({
    name: 'dashboard-theme-management-editor',
    components: {
        ProgressSpinner,
        WidgetTitleStyle,
        WidgetBordersStyle,
        WidgetPaddingStyle,
        WidgetShadowsStyle,
        WidgetBackgroundColorStyle,
        TableWidgetHeaders,
        TableWidgetColumnStyle,
        WidgetRowsStyle,
        TableWidgetSummaryStyle,
        TableWidgetPaginator,
        SelectorWidgetLabelStyle,
        SelectionsWidgetChipsStyle,
        PivotTableTotalsStyle,
        PivotTableFieldsStyle
    },
    props: { selectedThemeProp: { type: Object as any, required: true } },
    data() {
        return {
            descriptor,
            pivotDescriptor,
            test: descriptor.widgetModelMock as any,
            selectedTheme: {} as IDashboardTheme,
            widgetTree: [] as any,
            treeLoading: false
        }
    },
    computed: {},
    watch: {
        selectedThemeProp() {
            this.loadSelectedTheme()
        }
    },
    created() {
        this.loadSelectedTheme()
    },
    methods: {
        loadSelectedTheme() {
            this.selectedTheme = this.selectedThemeProp
            this.buildWidgetTree()
        },
        containsSubstring(str) {
            return str.includes('title-editor')
        },
        async buildWidgetTree() {
            this.treeLoading = true
            const themeConfig = this.selectedTheme.config as IDashboardThemeConfig
            this.widgetTree = [] as any

            for (const widgetType in themeConfig) {
                this.widgetTree.push({
                    isParent: true,
                    key: `${widgetType}`,
                    label: this.$t(`managers.dashboardThemeManager.widgetNames.${widgetType}`),
                    children: this.buildChildren(themeConfig, widgetType)
                })
            }

            function sleep(ms) {
                return new Promise((resolve) => setTimeout(resolve, ms))
            }
            await sleep(250)

            this.treeLoading = false
        },
        buildChildren(themeConfig, widgetType) {
            const childrenArray = [] as any

            for (const styleType in themeConfig[widgetType].style) {
                childrenArray.push({
                    key: `${widgetType}-${styleType}`,
                    label: this.$t(`managers.dashboardThemeManager.styleTypes.${styleType}`),
                    children: [
                        {
                            key: `${widgetType}-${styleType}-editor`,
                            widgetType: widgetType,
                            body: 'generic'
                        }
                    ]
                })
            }

            return childrenArray
        },
        scrollToExample(event: any) {
            emitter.emit('scrollToExample', event)
        }
    }
})
</script>
<style lang="scss">
.q-tree__node.relative-position.q-tree__node--child {
    padding-left: 0;
}
.no-padding {
    padding: 0 !important;
}
</style>
