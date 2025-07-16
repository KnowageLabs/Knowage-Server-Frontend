<template>
    <div class="custom-header-group-container" :style="getSummaryStyle()">
        <span v-if="!params.hideSummary" class="custom-header-group-label kn-width-full p-d-flex">
            <b v-if="isFirstColumn()" style="margin-right: 4px" class="p-mr-auto">
                {{ params.summaryRows[params.node.rowIndex] || '' }}
            </b>
            <!-- Always show value if this column has summary data and it's not a label-only column -->
            <span v-if="shouldShowValue()">
                {{ params.value ?? '' }}
            </span>
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue'
import { ITableWidgetSummaryRows } from '../../Dashboard'

export default defineComponent({
    props: {
        params: {
            required: true,
            type: Object
        }
    },
    mounted() {
        nextTick(() => {
            this.handleParentPointerEvents()
        })
    },
    methods: {
        shouldShowValue() {
            // Always show value if this column has summary data and it's not a label-only column
            if (this.isLabelOnlyColumn()) return false

            return this.params.value !== undefined && this.params.value !== null
        },
        isLabelOnlyColumn() {
            // If this is the first column but not a measure column, show only label
            if (this.isFirstColumn()) {
                const isMeasureColumn = this.params.colDef?.measure === 'MEASURE'
                return !isMeasureColumn || !this.params.value
            }
            return false
        },
        isFirstColumn() {
            const allColumns = this.params.api.getAllDisplayedColumns()
            const firstColumn = allColumns[0]
            return this.params.column?.colId === firstColumn?.colId
        },
        handleParentPointerEvents() {
            if (this.params.hideSummary) {
                const parentElement = this.$el.parentElement
                if (parentElement) parentElement.style.pointerEvents = 'none'
            }
        },
        getSummaryStyle() {
            const styleSettings = this.params.propWidget.settings.style.summary
            const styleString = Object.entries(styleSettings.properties ?? styleSettings)
                .map(([k, v]) => `${k}:${v}`)
                .join(';')
            return styleString + ';'
        }
    }
})
</script>
