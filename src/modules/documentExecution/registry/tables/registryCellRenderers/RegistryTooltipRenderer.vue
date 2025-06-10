<template>
    <div class="custom-tooltip-container">
        <span id="custom-tooltip-suffix">{{ getTooltip() }}</span>
    </div>
</template>

<script lang="ts">
import { formatDateWithLocale, localeDate, luxonFormatDate, primeVueDate } from '@/helpers/commons/localeHelper'
import { setInputDataType } from '@/helpers/commons/tableHelpers'
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        params: {
            required: true,
            type: Object
        }
    },
    data() {
        return {}
    },
    computed: {
        getCurrentLocaleDefaultDateFormat() {
            return (column) => (column.isEditable ? column.format || primeVueDate() : localeDate())
        }
    },
    methods: {
        getTooltip() {
            switch (this.getCellType(this.params.colDef)) {
                case 'temporal':
                    return this.getDateTooltip()
                default:
                    return this.params.value
            }
        },
        getDateTooltip() {
            if (!this.params.value) return ''

            try {
                if (this.params.colDef.columnInfo?.type === 'timestamp') {
                    return formatDateWithLocale(this.params.value, { dateStyle: 'short', timeStyle: 'medium' }, true)
                } else {
                    return this.getFormattedDate(this.params.value, 'yyyy-MM-dd', this.getCurrentLocaleDefaultDateFormat(this.params.colDef))
                }
            } catch (error) {
                return this.params.value || ''
            }
        },

        getFormattedDate(date: any, format: any, incomingFormat?: string) {
            return luxonFormatDate(date, format, incomingFormat)
        },
        getCellType(colDef) {
            if (colDef.editorType == 'TEXT' && colDef.columnInfo.type === 'boolean') return 'checkbox'
            if (colDef.editorType !== 'COMBO' && colDef.columnInfo?.type !== 'date' && colDef.columnInfo?.type !== 'timestamp' && setInputDataType(colDef.columnInfo?.type) === 'text') return 'text'
            if (colDef.editorType !== 'COMBO' && colDef.columnInfo?.type !== 'date' && colDef.columnInfo?.type !== 'timestamp' && setInputDataType(colDef.columnInfo?.type) === 'number') return 'number'
            if (colDef.editorType === 'COMBO') return 'dropdown'
            if (colDef.columnInfo?.type === 'date' || colDef.columnInfo?.type === 'timestamp') return 'temporal'
        }
    }
})
</script>
<style lang="scss">
.custom-tooltip-container {
    border: 1px solid cornflowerblue;
    overflow: hidden;
    background-color: white;
}

.custom-tooltip-container span {
    margin: 5px;
    white-space: nowrap;
}

.custom-tooltip-container span:nth-of-type(2) {
    font-weight: bold;
}
</style>
