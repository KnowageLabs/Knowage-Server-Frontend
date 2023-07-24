<template>
    <div>
        <img :src="getImageSource" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from './WidgetPictureExamplesDescriptor.json'

export default defineComponent({
    name: 'widget-picture-examples',
    components: {},
    props: { widgetType: { type: String, requried: true } },
    emits: [],
    data() {
        return {
            descriptor
        }
    },
    computed: {
        getImageSource() {
            return this.widgetType ? `${import.meta.env.VITE_PUBLIC_PATH}images/dashboard/themeExamples/${this.widgetType}.png` : ''
        }
    },
    created() {},
    methods: {}
})
</script>

<style lang="scss" scoped></style>
