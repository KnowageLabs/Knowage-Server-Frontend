<template>
    <div v-if="imageSettings" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <q-input v-model="imageSettings.style.height" outlined dense :label="$t('common.height')" @update:model-value="imageSettingsChanged" />
            </div>
            <div class="col-6">
                <q-input v-model="imageSettings.style.width" outlined dense :label="$t('common.width')" @update:model-value="imageSettingsChanged" />
            </div>
            <div class="col-6">
                <q-select v-model="imageSettings.style['background-position-x']" outlined dense emit-value map-options :options="translatedHorizontalOptions" :label="$t('common.horizontalAlign')" @update:model-value="imageSettingsChanged" />
            </div>
            <div class="col-6">
                <q-select v-model="imageSettings.style['background-position-y']" outlined dense emit-value map-options :options="translatedVerticalOptions" :label="$t('common.verticalAlign')" @update:model-value="imageSettingsChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IImageWidgetImageSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardImageWidget'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../ImageWidgetSettingsDescriptor.json'

export default defineComponent({
    name: 'image-widget-image-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            imageSettings: null as IImageWidgetImageSettings | null
        }
    },
    computed: {
        translatedHorizontalOptions() {
            return descriptor.horizontalAlignmentOptions.map((o) => ({ label: this.$t(o.label), value: o.value }))
        },
        translatedVerticalOptions() {
            return descriptor.verticalAlignmentOptions.map((o) => ({ label: this.$t(o.label), value: o.value }))
        }
    },
    created() {
        this.loadImageSettings()
    },
    methods: {
        loadImageSettings() {
            if (this.widgetModel.settings.configuration?.image) this.imageSettings = this.widgetModel.settings.configuration.image
        },
        imageSettingsChanged() {
            emitter.emit('refreshImageWidget', this.widgetModel.id)
        }
    }
})
</script>
