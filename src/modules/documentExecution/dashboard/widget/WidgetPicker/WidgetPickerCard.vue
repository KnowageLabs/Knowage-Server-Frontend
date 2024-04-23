<template>
    <div id="widget-card" :title="$t(widget.description)">
        <div id="widget-card-icon-container" class="p-d-flex p-ai-center p-jc-center">
            <div class="innerIcon" :style="documentImageSource()"></div>
        </div>
        <span class="widgetTitle">{{ $t(widget.name) }}</span>
    </div>
</template>

<script lang="ts">
/**
 * ! this component renders the widget cards inside the picker dialog
 */
import { defineComponent } from 'vue'
import descriptor from './WidgetPickerDescriptor.json'

export default defineComponent({
    name: 'widget-picker-dialog',
    components: {},
    inject: [],
    props: { widget: { required: true, type: Object } },
    emits: ['closeWidgetPicker'],
    data() {
        return {
            descriptor
        }
    },
    methods: {
        documentImageSource(): any {
            const widgetImg = this.widget.type === 'highcharts' || this.widget.type === 'chartJS' ? 'chart' : this.widget.type
            return {
                'mask-image': `url(${import.meta.env.VITE_KNOWAGE_VUE_CONTEXT}${descriptor.imagePath}${widgetImg}${descriptor.imageExtension})`,
                '-webkit-mask-image': `url(${import.meta.env.VITE_KNOWAGE_VUE_CONTEXT}${descriptor.imagePath}${widgetImg}${descriptor.imageExtension})`
            }
        }
    }
})
</script>
<style lang="scss" scoped>
#widget-card {
    cursor: pointer;
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .widgetTitle {
        text-transform: capitalize;
        font-size: 1.1rem;
        height: 50px;
        text-align: center;
    }
    #widget-card-icon-container {
        background-color: var(--kn-color-secondary);
        height: 60px;
        width: 60px;
        border-radius: 50%;
        .innerIcon {
            width: 60px;
            height: 100%;
            mask-size: 80%;
            mask-repeat: no-repeat;
            mask-position: center;
            -webkit-mask-size: 80%;
            -webkit-mask-repeat: no-repeat;
            -webkit-mask-position: center;
            background-repeat: no-repeat;
            background-color: var(--kn-color-primary);
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: 0.2s ease-in;
        }
    }
    &:hover {
        border-color: var(--kn-color-primary) !important;
        #widget-card-icon-container {
            background-color: var(--kn-color-primary);
            .innerIcon {
                background-color: white;

                -webkit-mask-position: center;
            }
        }
    }
}
</style>
