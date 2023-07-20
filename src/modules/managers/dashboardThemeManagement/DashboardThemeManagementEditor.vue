<template>
    <div v-if="selectedTheme" class="kn-overflow dashboard-scrollbar">
        <div class="p-field p-mt-2 p-col-12">
            <span class="p-float-label">
                <InputText v-model="selectedTheme.themeName" class="kn-material-input" />
                <label class="kn-material-input-label">{{ $t('common.name') }}</label>
            </span>
        </div>

        <div class="q-pa-md q-gutter-sm p-pl-0">
            <q-tree :nodes="widgetTree" node-key="key">
                <template #body-generic="prop">
                    <div style="color: black">
                        <!-- {{ prop.node }} -->
                        <!-- <br /> -->

                        <!-- {{ selectedTheme.config[prop.node.widgetType].style.summary }} -->
                        <!-- Zakomentarisi ovo iznad ako ti smeta -->
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
                    </div>
                </template>
            </q-tree>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IDashboardTheme, IDashboardThemeConfig } from './DashboardThememanagement'
import descriptor from './DashboardThemeManagementEditorDescriptor.json'
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

export default defineComponent({
    name: 'dashboard-theme-management-editor',
    components: { WidgetTitleStyle, WidgetBordersStyle, WidgetPaddingStyle, WidgetShadowsStyle, WidgetBackgroundColorStyle, TableWidgetHeaders, TableWidgetColumnStyle, WidgetRowsStyle, TableWidgetSummaryStyle, TableWidgetPaginator },
    props: { selectedThemeProp: { type: Object as any, required: true } },
    data() {
        return {
            descriptor,
            test: descriptor.widgetModelMock as any,
            selectedTheme: {} as IDashboardTheme,
            widgetTree: [] as any
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
            this.widgetTree = this.buildWidgetTree()
        },
        containsSubstring(str) {
            return str.includes('title-editor')
        },
        buildWidgetTree() {
            const themeConfig = this.selectedTheme.config as IDashboardThemeConfig
            const widgetTree = [] as any

            for (const widgetType in themeConfig) {
                widgetTree.push({
                    key: `${widgetType}`,
                    label: this.$t(`managers.dashboardThemeManager.widgetNames.${widgetType}`),
                    children: this.buildChildren(themeConfig, widgetType)
                })
            }

            console.log(widgetTree)
            return widgetTree
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
                            body: 'generic' //TODO: Create method that takes whole key into account, and changes body depending on widget type. Only GENERIC is present so far.
                        }
                    ]
                })
            }

            return childrenArray
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
