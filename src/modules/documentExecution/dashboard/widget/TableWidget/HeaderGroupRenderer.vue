<template>
    <div class="custom-header-group-container" :style="getHeaderGroupStyle()" style="width: 100%">
        <div class="custom-header-group-label p-mx-1" :style="getHeaderMultiline()" style="width: 100%">{{ params.displayName }}</div>
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
            let groupProperties = null as any

            if (modelGroups.enabled) {
                groupProperties = modelGroups.styles[0].properties
                columnGroupStyleString = Object.entries(groupProperties)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(';')

                modelGroups.styles.forEach((group) => {
                    if (group.target.includes(this.params.colId)) {
                        groupProperties = group.properties
                        columnGroupStyleString = Object.entries(groupProperties)
                            .map(([k, v]) => `${k}:${v}`)
                            .join(';')
                    }
                })

                const textAlign = this.getTextAlignFromJustifyContent(groupProperties)
                if (textAlign) columnGroupStyleString += `;text-align:${textAlign};`
            }

            return columnGroupStyleString
        },
        getTextAlignFromJustifyContent(properties) {
            if (!properties) return null
            const justifyContent = properties['justify-content']
            if (!justifyContent) return null

            if (justifyContent === 'flex-start') return 'left'
            if (justifyContent === 'flex-end') return 'right'
            return 'center'
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
