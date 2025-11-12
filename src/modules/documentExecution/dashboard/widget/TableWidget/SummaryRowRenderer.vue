<template>
    <div class="custom-header-group-container" :style="getStyle()" style="height: 100%">
        <span v-if="!params.hideSummary" class="custom-header-group-label kn-width-full p-d-flex" :style="getStyle()">
            <b v-if="isFirstColumn()" style="margin-right: 4px" class="p-mr-auto">
                {{ params.summaryRows[params.node.rowIndex] || '\u200B' }}
            </b>
            <!-- Always show value if this column has summary data and it's not a label-only column -->
            <span v-if="shouldShowValue()">
                {{ getFormattedValue() || '\u200B' }}
            </span>
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue'
import { formatNumberWithLocale } from '@/helpers/commons/localeHelper'

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
        getStyle() {
            const summaryStyle = this.params.propWidget.settings.style.summary

            if (summaryStyle.enabled) return this.getSummaryStyle()
            else return this.getColumnStyle()
        },
        getSummaryStyle() {
            const styleSettings = this.params.propWidget.settings.style.summary
            const styleString = Object.entries(styleSettings.properties ?? styleSettings)
                .map(([k, v]) => `${k}:${v}`)
                .join(';')
            return styleString + ';'
        },

        getColumnStyle() {
            const columnStyles = this.params.propWidget.settings.style.columns

            if (columnStyles.enabled) {
                let columnStyle = null as any

                const allColumnStyle = columnStyles.styles.filter((style) => style.target === 'all')[0].properties
                if (allColumnStyle) columnStyle = allColumnStyle

                const cellColumnStyle = columnStyles.styles.filter((style) => Array.isArray(style.target) && style.target.includes(this.params.colId))[0]
                if (cellColumnStyle) columnStyle = cellColumnStyle.properties

                return columnStyle
            } else return null
        },
        getFormattedValue() {
            const value = this.params.value
            if (value === undefined || value === null) return '\u200B'

            const numValue = typeof value === 'number' ? value : parseFloat(value)
            if (!isNaN(numValue)) return formatNumberWithLocale(numValue)

            return value
        }
    }
})
</script>
