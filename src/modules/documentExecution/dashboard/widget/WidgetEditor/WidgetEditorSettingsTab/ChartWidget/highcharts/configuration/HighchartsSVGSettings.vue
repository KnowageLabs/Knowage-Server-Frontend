<template>
    <div v-if="svgSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            {{ 'TODO' }}
            {{ svgSettings }}
        </div>
        <div class="p-col-12">
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.highcharts.svg.definition') }}</label>
            <div class="p-d-flex p-flex-row p-ai-center">
                <Textarea v-model="svgSettings.definition" class="kn-material-input kn-width-full" rows="4" :auto-resize="true" />
                <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.svg.hint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
            </div>
        </div>

        <div class="input-container p-col-12">
            <Button icon="fas fa-upload fa-1x" class="p-button-text p-button-plain p-ml-2" @click="setSVGUpload" />
            <label for="upload" class="kn-material-input-label">{{ $t('dashboard.widgetEditor.highcharts.svg.upload') }}:</label>
            <KnInputFile :change-function="setSVGForUpload" :visibility="true" :trigger-input="triggerSVGUpload" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import Textarea from 'primevue/textarea'

export default defineComponent({
    name: 'highcharts-svg-settings',
    components: { KnInputFile, Textarea },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            svgSettings: null as any,
            model: null as IWidget | null,
            triggerSVGUpload: false
        }
    },
    created() {
        this.loadSVGSettings()
    },
    methods: {
        loadSVGSettings() {
            this.model = this.widgetModel
            if (!this.model.settings?.configuration?.svgSettings) this.model.settings.configuration.svgSettings = { definition: '' }
            this.svgSettings = this.widgetModel.settings.configuration.svgSettings
        },
        setSVGUpload() {
            this.triggerSVGUpload = false
            setTimeout(() => (this.triggerSVGUpload = true), 200)
        },
        setSVGForUpload(event: any) {
            const svgToUpload = event.target.files[0]
            console.log('--------- TEEEEEEST: ', event.target.files)
            console.log('--------- SVG TO UPLOAD: ', svgToUpload)
        }
    }
})
</script>
