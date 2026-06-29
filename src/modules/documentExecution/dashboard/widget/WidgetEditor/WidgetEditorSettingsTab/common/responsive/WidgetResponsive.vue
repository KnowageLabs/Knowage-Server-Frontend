<template>
    <div v-if="responsiveModel" class="q-pa-sm column">
        <div v-for="(field, index) in descriptor.responsiveInputSwiitches" :key="index">
            <q-toggle v-model="responsiveModel[field]" :label="getLabel(field)" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetResponsive } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from '../../WidgetEditorSettingsTabDescriptor.json'

export default defineComponent({
    name: 'widget-responsive',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            responsiveModel: null as IWidgetResponsive | null
        }
    },
    created() {
        this.loadResponsiveModel()
    },
    methods: {
        loadResponsiveModel() {
            if (this.widgetModel.settings?.responsive) this.responsiveModel = this.widgetModel.settings.responsive
        },
        getLabel(field: string) {
            switch (field) {
                case 'fullGrid':
                    return this.$t('dashboard.widgetEditor.responsive.fullGrid')
                case 'xxs':
                    return this.$t('dashboard.widgetEditor.responsive.extraSmallDevices')
                case 'xs':
                    return this.$t('dashboard.widgetEditor.responsive.smallerDevices')
                case 'sm':
                    return this.$t('dashboard.widgetEditor.responsive.tablets')
                case 'md':
                    return this.$t('dashboard.widgetEditor.responsive.largeDevices')
                case 'lg':
                    return this.$t('dashboard.widgetEditor.responsive.extraLargeDevices')
            }
        }
    }
})
</script>
