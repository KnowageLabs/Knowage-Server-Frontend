<template>
    <div class="widget-container" :style="getWidgetContainerStyle()">
        <div v-if="titleEnabled" class="p-d-flex p-ai-center" style="border-radius: 0px" :style="getWidgetTitleStyle()">
            {{ selectedThemeProp.config[widgetType].style.title.text }}
        </div>
        <div class="widget-container-renderer" :style="getWidgetPadding()">
            <img :src="getImageSource" style="width: 100%; max-height: 220px" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from './WidgetPictureExamplesDescriptor.json'
import { IWidgetTitle } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-picture-examples',
    components: {},
    props: { widgetType: { type: String, requried: true, default: 'table' }, selectedThemeProp: { type: Object as any, required: true } },
    emits: [],
    data() {
        return {
            descriptor
        }
    },
    computed: {
        getImageSource() {
            return this.widgetType ? `${import.meta.env.VITE_PUBLIC_PATH}images/dashboard/themeExamples/${this.widgetType}.png` : ''
        },
        titleEnabled() {
            const widgetTitle = this.selectedThemeProp.config[this.widgetType].style.title as IWidgetTitle
            if (widgetTitle) return widgetTitle.enabled
            else return false
        }
    },
    created() {},
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
        }
    }
})
</script>

<style lang="scss" scoped></style>
