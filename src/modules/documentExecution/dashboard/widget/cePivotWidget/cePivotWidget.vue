<template>
    <div ref="cePivotTable" class="ce-widget-container p-d-flex p-d-row kn-flex" v-html="dataToShow.htmlTable" @click="onCellClicked"></div>
</template>

<script lang="ts">
import { IDataset, ISelection, IWidget } from '../../Dashboard'
import { defineComponent, PropType } from 'vue'
import mainStore from '../../../../../App.store'
import dashboardStore from '../../Dashboard.store'
import { getFormattedClickedValueForCrossNavigation, createPivotTableSelection } from './cePivotWidgetHelpers'
import { updateAllStoreSelections, executePivotTableWidgetCrossNavigation } from '../interactionsHelpers/InteractionHelper'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'table-widget',
    components: {},
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        editorMode: { type: Boolean, required: false },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        dataToShow: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true }
    },
    emits: ['pageChanged', 'sortingChanged', 'launchSelection'],
    setup() {
        const store = dashboardStore()
        const appStore = mainStore()
        return { store, appStore }
    },
    data() {
        return {
            activeSelections: [] as ISelection[]
        }
    },
    computed: {
        dataFields() {
            return []
        }
    },
    watch: {
        propActiveSelections() {
            this.loadActiveSelections()
        },
        dataToShow() {
            this.$nextTick(() => {
                this.addPivotStyle()
            })
        }
    },
    created() {
        this.loadActiveSelections()
        this.$nextTick(() => {
            this.addPivotStyle()
        })
    },
    methods: {
        ...mapActions(dashboardStore, ['setSelections']),

        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },

        addPivotStyle() {
            if (this.dataToShow != undefined) {
                console.log(this.propWidget.settings.style)
                const pivotRef = this.$refs.cePivotTable as any

                this.addMeasureHeaderStyles(pivotRef)
                this.addTotalStyles(pivotRef)
                this.addSubTotalStyles(pivotRef)
                this.addCrossHeaderStyles(pivotRef)
            }
        },
        addMeasureHeaderStyles(pivotRef) {
            const measureHeaderItem = pivotRef.querySelectorAll('.measures-header-text')

            if (this.propWidget.settings.style.fieldHeaders.enabled) {
                const fieldHeaderStyles = this.propWidget.settings.style.fieldHeaders.styles[0].properties
                for (const prop in fieldHeaderStyles) {
                    measureHeaderItem.forEach((item) => {
                        const parentContainer = item.parentElement.parentElement.parentElement
                        parentContainer.style[prop] = fieldHeaderStyles[prop]
                    })
                }
            }
        },
        addCrossHeaderStyles(pivotRef) {
            const crossItem = pivotRef.querySelectorAll('.crosstab-header-text')
            const emptyItem = pivotRef.querySelectorAll('.empty')

            if (this.propWidget.settings.style.crossTabHeaders.enabled) {
                const crossHeaderStyles = this.propWidget.settings.style.crossTabHeaders.properties
                for (const prop in crossHeaderStyles) {
                    crossItem.forEach((item) => {
                        const parentContainer = item
                        parentContainer.style[prop] = crossHeaderStyles[prop]
                    })
                    emptyItem.forEach((item) => {
                        const parentContainer = item
                        parentContainer.style[prop] = crossHeaderStyles[prop]
                    })
                }
            }
        },
        addTotalStyles(pivotRef) {
            const totals = pivotRef.querySelectorAll('.totals')
            const memberItem = pivotRef.querySelectorAll('.member')

            if (this.propWidget.settings.style.totals.enabled) {
                const totalStyles = this.propWidget.settings.style.totals.properties
                for (const prop in totalStyles) {
                    totals.forEach((item) => {
                        item.style[prop] = totalStyles[prop]
                    })
                    memberItem.forEach((item) => {
                        if (item.id.includes('Total')) item.style[prop] = totalStyles[prop]
                    })
                }
            }
        },
        addSubTotalStyles(pivotRef) {
            const subtotalsItem = pivotRef.querySelectorAll('.partialsum')
            const memberItem = pivotRef.querySelectorAll('.member')

            if (this.propWidget.settings.style.subTotals.enabled) {
                const subTotalStyles = this.propWidget.settings.style.subTotals.properties
                for (const prop in subTotalStyles) {
                    subtotalsItem.forEach((item) => {
                        item.style[prop] = subTotalStyles[prop]
                    })
                    memberItem.forEach((item) => {
                        if (item.id.includes('SubTotal')) item.style[prop] = subTotalStyles[prop]
                    })
                }
            }
        },
        //#region ===================== Cell Click Events  ====================================================
        onCellClicked(cellEvent: any) {
            if (this.editorMode) return
            const attributes = cellEvent.target.attributes
            const clickAttribute = attributes.getNamedItem('ng-click')
            const clickAttributeValue = clickAttribute.value
            const valuesAsString = clickAttributeValue.slice(clickAttributeValue.indexOf('(') + 1, clickAttributeValue.lastIndexOf(')')).trim()
            const extractedValues = valuesAsString.split(',').map((value: string) => value.trim().slice(1, -1))

            if (this.propWidget.settings.interactions.crossNavigation.enabled) {
                const formattedOutputParameters = getFormattedClickedValueForCrossNavigation(extractedValues, this.dataFields, this.propWidget.settings.interactions.crossNavigation)
                if (formattedOutputParameters) executePivotTableWidgetCrossNavigation(formattedOutputParameters, this.propWidget.settings.interactions.crossNavigation, this.dashboardId)
            } else if (this.propWidget.settings.interactions.selection.enabled) {
                const selections = createPivotTableSelection(extractedValues, this.propWidget, this.datasets)
                if (selections) updateAllStoreSelections(selections, this.activeSelections, this.dashboardId, this.setSelections, this.$http)
            }
        }
        //#endregion ===============================================================================================
    }
})
</script>
<style lang="scss">
.ce-widget-container {
    overflow: auto;

    &[multi-select] table > thead > tr > th:nth-child(2),
    &:not(multi-select) table > thead > tr > th:nth-child(1),
    &[multi-select] table > tbody > tr > td:nth-child(2),
    &:not(multi-select) table > tbody > tr > td:nth-child(1),
    &:not(multi-select) table > tbody > tr > td:nth-child(n + 1):nth-last-child(n + 2) {
        padding: 0 !important;
    }
    & > table {
        border-collapse: collapse;
        width: auto;
        border-bottom: 1px solid #c3d4df;
        thead,
        tbody {
            tr {
                height: 1rem;
                td {
                    border: 1px solid black;

                    &.level {
                        text-align: center;
                        font-size: 16px;
                        color: #3b678c;
                        font-weight: 600;
                        table {
                            table-layout: auto;
                            display: initial;
                        }
                        .crosstab-header-text {
                            font-family: Roboto, 'Helvetica Neue', sans-serif;
                            text-align: center;
                            font-size: 15px;
                            color: black;
                            font-weight: 600;
                        }
                        .sortIcon {
                            line-height: 33px;
                            padding: 0 !important;
                        }
                    }
                    &.member {
                        text-align: center;
                        font-size: 0.8rem;
                        color: #3b678c;
                        font-weight: 600;
                        .crosstab-header-text {
                            font-family: Roboto, 'Helvetica Neue', sans-serif;
                            text-align: center;
                            font-size: 15px;
                            font-weight: 600;
                            font-style: normal !important;
                        }
                    }
                    &.data {
                        text-align: center;
                    }
                    &.partialsum {
                        text-align: center;
                        color: black;
                    }
                    &.totals {
                        text-align: center;
                        color: black;
                    }
                    &.sortIcon {
                        border-top: none;
                    }
                }
            }
        }
    }
}
</style>
