<template>
    <div v-if="selectedTheme" class="kn-overflow">
        <div class="p-field p-mt-2 p-col-12">
            <span class="p-float-label">
                <InputText v-model="selectedTheme.themeName" class="kn-material-input" />
                <label class="kn-material-input-label">{{ $t('common.name') }}</label>
            </span>
        </div>

        <div class="q-pa-md q-gutter-sm">
            <q-tree :nodes="widgetTree" node-key="key">
                <template #body-generic="prop">
                    <div style="color: black">
                        <!-- {{ prop.node }} -->
                        <!-- <br /> -->

                        <!-- {{ selectedTheme.config[prop.node.widgetType]}} -->
                        <!-- OVO JE LOKACIJA STILA U selectedTheme OBJEKTU! -->
                        <WidgetTitleStyle v-if="prop.node.key.includes('title-editor')" :widget-model="null" :theme-style="selectedTheme.config[prop.node.widgetType].style.title" :toolbar-style-settings="descriptor.defaultToolbarStyleOptions" style="padding: 0 !important" />
                    </div>
                </template>
            </q-tree>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from './DashboardThemeManagementEditorDescriptor.json'
import WidgetTitleStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetTitleStyle.vue'
import { IDashboardThemeConfig } from './DashboardThememanagement'

export default defineComponent({
    name: 'dashboard-theme-management-editor',
    components: { WidgetTitleStyle },
    props: { selectedThemeProp: { type: Object as any, required: true } },
    data() {
        return {
            descriptor,
            test: descriptor.widgetModelMock as any,
            selectedTheme: null as any | null,
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
</style>
