<template>
    <div class="custom-header-group-container" :style="getSummaryStyle()">
        <span v-if="!params.hideSummary && showPinnedOnly()" class="custom-header-group-label">
            <b style="margin-right: 4px">{{ params.value ? params.summaryRows[params.rowIndex] : '' }} </b>
            {{ params.value ?? '' }}
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ITableWidgetSummaryRows } from '../../Dashboard'

export default defineComponent({
    props: {
        params: {
            required: true,
            type: Object
        }
    },
    mounted() {
        this.showPinnedOnly()
    },
    methods: {
        showPinnedOnly() {
            const summaryRowSettings = this.params.propWidget.settings.configuration.summaryRows as ITableWidgetSummaryRows
            if (summaryRowSettings.style.pinnedOnly) {
                if (this.params.pinned) return true
                else return false
            } else return true
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
