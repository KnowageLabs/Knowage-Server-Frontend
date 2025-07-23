<template>
    <div id="widget-card" :disable="widget.enterpriseOnly && !isEnterprise">
        <div id="widget-card-icon-container" class="row items-center justify-center relative-position">
            <q-badge v-if="widget.enterpriseOnly && !isEnterprise" color="accent" floating class="z-top">
                EE
                <q-tooltip :delay="500">{{ $t('dashboard.widgets.eeOnly') }}</q-tooltip>
            </q-badge>
            <div class="innerIcon" :style="documentImageSource()">
                <q-tooltip :delay="500">{{ $t(widget.description) }}</q-tooltip>
            </div>
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
import { mapState } from 'pinia'
import appStore from '@/App.store'

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
    computed: {
        ...mapState(appStore, {
            isEnterprise: 'isEnterprise'
        })
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
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .widgetTitle {
        text-transform: capitalize;
        font-size: 1.1rem;
        height: 50px;
        text-align: center;
    }
    &[disable='true'] {
        #widget-card-icon-container {
            cursor: default;
            background-color: color-mix(in srgb, var(--kn-color-secondary), transparent 60%) !important;
            .innerIcon {
                background-color: color-mix(in srgb, var(--kn-color-primary), transparent 60%) !important;
            }
            &:hover {
                background-color: color-mix(in srgb, var(--kn-color-secondary), transparent 60%) !important;
                .innerIcon {
                    background-color: color-mix(in srgb, var(--kn-color-primary), transparent 60%) !important;
                }
            }
        }
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
    .z-top {
        z-index: 90;
    }
}
</style>
