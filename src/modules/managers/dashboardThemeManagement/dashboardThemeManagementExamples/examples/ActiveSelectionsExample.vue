<template>
    <div class="widget-container" :style="getWidgetContainerStyle()">
        <div v-if="titleEnabled" class="p-d-flex p-ai-center" style="border-radius: 0px" :style="getWidgetTitleStyle()">
            {{ selectedThemeProp.config[widgetType].style.title.text }}
        </div>
        <div class="p-d-flex p-flex-row p-flex-wrap" :style="getWidgetPadding()">
            <ActiveSelectionsChips v-for="(activeSelection, index) of activeSelections" :key="index" :active-selection="activeSelection" :show-dataset="true" :show-column="true" :style="getChipsStyle()" :editor-mode="true" />
        </div>
    </div>
    <div class="widget-container" :style="getWidgetContainerStyle()">
        <div v-if="titleEnabled" class="p-d-flex p-ai-center" style="border-radius: 0px" :style="getWidgetTitleStyle()">
            {{ selectedThemeProp.config[widgetType].style.title.text }}
        </div>
        <div class="p-d-flex p-flex-row p-flex-wrap" :style="getWidgetPadding()">
            <ActiveSelectionsList :active-selections="activeSelections" :prop-widget="propWidgetMock" :show-dataset="true" :show-column="true" :editor-mode="true" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ISelection, IWidgetTitle } from '@/modules/documentExecution/dashboard/Dashboard'
import ActiveSelectionsChips from '@/modules/documentExecution/dashboard/widget/ActiveSelectionsWidget/ActiveSelectionsWidgetChips.vue'
import ActiveSelectionsList from '@/modules/documentExecution/dashboard/widget/ActiveSelectionsWidget/ActiveSelectionsWidgetList.vue'

export default defineComponent({
    name: 'active-selections-example',
    components: { ActiveSelectionsChips, ActiveSelectionsList },
    props: { widgetType: { type: String, requried: true, default: 'table' }, selectedThemeProp: { type: Object as any, required: true } },
    emits: ['close'],
    data() {
        return {
            activeSelections: [
                { datasetId: 1, datasetLabel: 'TEST_02', columnName: 'QUARTER', value: ['Q2'], aggregated: false, timestamp: 1689937296670 },
                { datasetId: 1, datasetLabel: 'TEST_02', columnName: 'QUARTER', value: ['Q4'], aggregated: false, timestamp: 1689937296671 },
                { datasetId: 2, datasetLabel: 'TEST_04', columnName: 'PRODUCT_FAMILY', value: ['FOOD', 'CAR'], aggregated: false, timestamp: 16899372966702 }
            ] as ISelection[],
            propWidgetMock: { settings: { style: {} } } as any
        }
    },
    computed: {
        titleEnabled() {
            const widgetTitle = this.selectedThemeProp.config[this.widgetType].style.title as IWidgetTitle
            if (widgetTitle) return widgetTitle.enabled
            else return false
        }
    },
    created() {
        this.propWidgetMock.settings.style = this.selectedThemeProp.config[this.widgetType].style
    },
    methods: {
        getWidgetStyleByType(styleSettings: any) {
            if (styleSettings?.enabled) {
                const styleString = Object.entries(styleSettings.properties ?? styleSettings)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(';')
                return styleString + ';'
            } else return ''
        },
        getWidgetTitleStyle() {
            const widgetTitle = this.selectedThemeProp.config[this.widgetType].style.title
            const styleString = this.getWidgetStyleByType(widgetTitle)
            return styleString + `height: ${widgetTitle.height ?? 25}px;`
        },
        getWidgetContainerStyle() {
            const widgetBorders = this.selectedThemeProp.config[this.widgetType].style.borders
            const widgetShadows = this.selectedThemeProp.config[this.widgetType].style.shadows
            const widgetBackground = this.selectedThemeProp.config[this.widgetType].style.background

            const styleString = this.getWidgetStyleByType(widgetBorders) + this.getWidgetStyleByType(widgetShadows) + this.getWidgetStyleByType(widgetBackground)
            return styleString
        },
        getWidgetPadding() {
            const widgetPadding = this.selectedThemeProp.config[this.widgetType].style.padding
            const styleString = this.getWidgetStyleByType(widgetPadding)
            return styleString
        },
        getChipsStyle() {
            const height = this.selectedThemeProp.config[this.widgetType].style.chips.height
            const styleSettings = this.selectedThemeProp.config[this.widgetType].style.chips
            const styleString = Object.entries(styleSettings.properties ?? styleSettings)
                .map(([k, v]) => `${k}:${v}`)
                .join(';')

            return styleString + ';' + `height: ${height != 0 ? height : 25}px`
        }
    }
})
</script>

<style lang="scss" scoped>
.active-selections-container {
    height: 40px;
}
.active-selections-chip {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    padding: 2px 8px;
    background-color: #ccc;
    margin-right: 4px;
    margin-bottom: 4px;
    line-height: 30px;
    border-radius: 50px;
    outline: none;
    height: 25px;
}
</style>
