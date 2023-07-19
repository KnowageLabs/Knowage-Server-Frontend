<template>
    <div v-if="selectedTheme" class="kn-overflow">
        <div class="p-field p-mt-2 p-col-12">
            <span class="p-float-label">
                <InputText v-model="selectedTheme.themeName" class="kn-material-input" />
                <label class="kn-material-input-label">{{ $t('common.name') }}</label>
            </span>
            <!-- {{ selectedTheme }} -->
        </div>

        <div class="q-pa-md q-gutter-sm">
            <q-tree :nodes="simple" node-key="key">
                <template #body-generic="prop">
                    <div style="color: black">
                        <!-- {{ prop.node }} -->
                        <WidgetTitleStyle v-if="prop.node.key === 'titleEditor'" :widget-model="test" :toolbar-style-settings="descriptor.defaultToolbarStyleOptions" class="p-p-0" />
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

export default defineComponent({
    name: 'dashboard-theme-management-editor',
    components: { WidgetTitleStyle },
    props: { selectedThemeProp: { required: true, type: Object as any } },
    data() {
        return {
            descriptor,
            test: descriptor.widgetModelMock as any,
            selectedTheme: null as any | null,
            simple: [
                {
                    key: 'chart',
                    label: this.$t('common.chart'),
                    children: [
                        {
                            key: 'title',
                            label: this.$t('dashboard.widgetEditor.titles.title'),
                            children: [
                                {
                                    widgetType: 'chart',
                                    key: 'titleEditor',
                                    body: 'generic'
                                }
                            ]
                        },
                        {
                            key: 'background',
                            label: this.$t('dashboard.widgetEditor.background'),
                            children: [
                                {
                                    widgetType: 'chart',
                                    key: 'backgroundEditor',
                                    body: 'generic'
                                }
                            ]
                        },
                        {
                            key: 'borders',
                            label: this.$t('dashboard.widgetEditor.borders.title'),
                            children: [
                                {
                                    widgetType: 'chart',
                                    key: 'bordersEditor',
                                    body: 'generic'
                                }
                            ]
                        },
                        {
                            key: 'padding',
                            label: this.$t('dashboard.widgetEditor.padding.title'),
                            children: [
                                {
                                    widgetType: 'chart',
                                    key: 'paddingEditor',
                                    body: 'generic'
                                }
                            ]
                        },
                        {
                            key: 'shadows',
                            label: this.$t('dashboard.widgetEditor.shadows.title'),
                            children: [
                                {
                                    widgetType: 'chart',
                                    key: 'shadowsEditor',
                                    body: 'generic'
                                }
                            ]
                        }
                    ]
                },
                {
                    key: 1,
                    label: this.$t('common.table.table'),
                    children: [{ label: 'Prompt attention' }, { label: 'Professional waiter' }]
                },
                {
                    key: 3,
                    label: 'HTML',
                    children: [{ label: 'Happy atmosphere' }, { label: 'Good table presentation' }, { label: 'Pleasing decor' }]
                }
            ]
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
        }
    }
})
</script>
