<template>
    <div class="custom-header-group-container" :style="getSummaryStyle()">
        <span v-if="shouldShowSummaryContent()" class="custom-header-group-label">
            <!-- Show label if this column should display labels -->
            <b v-if="shouldShowLabel()" style="margin-right: 4px">
                {{ params.summaryRows[params.node.rowIndex] || '' }}
            </b>
            <!-- Show value only if this column should display values and it's not a label-only column -->
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
        shouldShowSummaryContent() {
            const summaryRowSettings = this.params.propWidget.settings.configuration.summaryRows as ITableWidgetSummaryRows
            const pinnedOnlyEnabled = summaryRowSettings.style.pinnedOnly
            const hasPinnedColumns = this.gridHasPinnedColumns()
            const isCurrentColumnPinned = this.isColumnPinned()

            // Case 3: No pinned columns + pinnedOnly = ON → show nothing
            if (pinnedOnlyEnabled && !hasPinnedColumns) return false

            // Case 4: Has pinned columns + pinnedOnly = ON → show only for pinned columns
            if (pinnedOnlyEnabled && hasPinnedColumns) return isCurrentColumnPinned

            // Cases 1 & 2: pinnedOnly = OFF → show for all columns
            return true
        },

        shouldShowLabel() {
            // Always show labels only in the first column (when content is visible)
            return this.isFirstColumn()
        },

        shouldShowValue() {
            // Show value if this column has summary data and it's not a label-only column
            if (this.isLabelOnlyColumn()) return false
            return this.params.value !== undefined && this.params.value !== null
        },

        isFirstColumn() {
            const allColumns = this.params.api.getAllDisplayedColumns()
            const firstColumn = allColumns[0]
            return this.params.column?.colId === firstColumn?.colId
        },

        isColumnPinned() {
            return this.params.column?.pinned === 'left' || this.params.column?.pinned === 'right'
        },

        gridHasPinnedColumns() {
            const allColumns = this.params.api.getAllDisplayedColumns()
            return allColumns.some((col) => col.getPinned() === 'left' || col.getPinned() === 'right')
        },

        isLabelOnlyColumn() {
            // If this is the first column but not a measure column, show only label
            if (this.isFirstColumn()) {
                const isMeasureColumn = this.params.colDef?.measure === 'MEASURE'
                return !isMeasureColumn || !this.params.value
            }
            return false
        },
        handleParentPointerEvents() {
            if (this.params.hideSummary || !this.shouldShowSummaryContent()) {
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
