<template>
    <div class="custom-header-group-container" :style="getHeaderGroupStyle()">
        <div class="custom-header-group-label" :style="getHeaderMultiline()">{{ params.displayName }}</div>
    </div>
</template>

<script lang="ts">
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
    methods: {
        getHeaderGroupStyle() {
            const modelGroups = this.params.propWidget.settings.style.columnGroups
            let columnGroupStyleString = null as any

            if (modelGroups.enabled) {
                columnGroupStyleString = Object.entries(modelGroups.styles[0].properties)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(';')

                modelGroups.styles.forEach((group) => {
                    if (group.target.includes(this.params.colId)) {
                        columnGroupStyleString = Object.entries(group.properties)
                            .map(([k, v]) => `${k}:${v}`)
                            .join(';')
                    }
                })
            }

            return columnGroupStyleString
        },
        getHeaderMultiline() {
            const headerConfig = this.params.propWidget.settings.configuration.headers
            if (headerConfig.enabled && headerConfig.enabledMultiline) {
                return ';white-space:normal;word-break:break-word;'
            }
            return ''
        }
    }
})
</script>
