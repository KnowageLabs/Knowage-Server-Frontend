<template>
    <div v-if="widgetModel.settings.advancedSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        {{ advancedSettingsModel }}
        <Message class="p-col-11 p-m-auto" severity="info" :closable="false">{{ $t('dashboard.widgetEditor.highcharts.advancedSettingsHint') }}</Message>
        <div v-for="(property, index) in advancedSettingsModel" :key="index" class="dynamic-form-item p-grid p-col-12 p-ai-center">
            <div class="p-col-12 p-md-6 p-d-flex p-flex-column kn-flex">
                <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.property') }}</label>
                <InputText v-model="property.propertyPath" class="kn-material-input p-inputtext-sm" />
            </div>
            <div class="p-col-11 p-md-5 p-d-flex p-flex-column kn-flex">
                <label class="kn-material-input-label p-mr-2">{{ $t('common.value') }}</label>
                <InputText v-model="property.propertyValue" class="kn-material-input p-inputtext-sm" />
            </div>
            <div class="p-col-1 p-d-flex p-flex-column p-jc-center p-ai-center p-pl-2">
                <i :class="[index === 0 ? 'pi pi-plus-circle' : 'pi pi-trash']" class="kn-cursor-pointer p-ml-2 p-mt-4" @click="index === 0 ? addPropertySetting() : removePropertySetting(index)"></i>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import Message from 'primevue/message'

export default defineComponent({
    name: 'highcharts-advanced-settings',
    components: { Message },
    props: { propWidgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            widgetModel: null as IWidget | null,
            advancedSettingsModel: [] as { propertyPath: string; propertyValue: string }[]
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.widgetModel = this.propWidgetModel
            if (this.widgetModel.settings && !this.widgetModel.settings.advancedSettings) this.widgetModel.settings.advancedSettings = [{ propertyPath: '', propertyValue: '' }]
            this.advancedSettingsModel = this.widgetModel.settings.advancedSettings
        },
        addPropertySetting() {
            this.advancedSettingsModel.push({ propertyPath: '', propertyValue: '' })
        },
        removePropertySetting(index: number) {
            this.advancedSettingsModel.splice(index, 1)
        }
    }
})
</script>
