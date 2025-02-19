<template>
    <div v-if="dialogSettings" class="p-m-3">
        <WidgetEditorStyleToolbar class="p-my-3" :options="descriptor.toolbarStyleOptions" :prop-model="dialogSettings.style" :disabled="dialogSettingsDisabled" @change="onStyleToolbarChange"> </WidgetEditorStyleToolbar>

        <Message class="kn-width-full p-d-flex p-jc-center p-m-0 p-mx-2" severity="info" :closable="false">
            {{ $t('dashboard.widgetEditor.map.dialogHint') }}
        </Message>

        <div v-for="(dialogProperty, index) in dialogSettings.layers" :key="index" class="dynamic-form-item p-grid p-col-12 p-ai-center p-m-0 p-pt-0">
            <div v-show="dropzoneTopVisible[index]" class="p-col-12 form-list-item-dropzone-active" @drop.stop="onDropComplete($event, 'before', index)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
            <div
                class="p-col-12 form-list-item-dropzone"
                :class="{ 'form-list-item-dropzone-active': dropzoneTopVisible[index] }"
                @drop.stop="onDropComplete($event, 'before', index)"
                @dragover.prevent
                @dragenter.prevent="displayDropzone('top', index)"
                @dragleave.prevent="hideDropzone('top', index)"
            ></div>

            <div class="p-d-flex kn-flex p-ai-center" :draggable="true" @dragstart.stop="onDragStart($event, index)">
                <i class="pi pi-th-large kn-cursor-pointer"></i>
                <div class="kn-flex p-mx-2 p-d-flex p-flex-row" style="gap: 0.5em">
                    <span class="p-float-label kn-flex">
                        <Dropdown v-model="dialogProperty.name" :disabled="dialogSettingsDisabled" class="kn-material-input kn-width-full" :options="widgetModel.layers" option-value="layerId" option-label="name" show-clear @change="onLayerChange(dialogProperty)"> </Dropdown>
                        <label class="kn-material-input-label">{{ $t('common.layer') }}</label>
                    </span>
                    <span class="p-float-label kn-flex">
                        <MultiSelect v-model="dialogProperty.columns" :disabled="dialogSettingsDisabled" class="kn-material-input kn-width-full" :options="getColumnOptionsFromLayer(dialogProperty)" option-label="alias" option-value="name"> </MultiSelect>
                        <label class="kn-material-input-label"> {{ $t('common.columns') }}</label>
                    </span>
                </div>
                <div class="p-d-flex p-flex-row p-jc-center p-ai-center">
                    <i v-if="index === 0" class="pi pi-plus-circle kn-cursor-pointer" data-test="new-button" @click="addDialog()"></i>
                    <i v-if="index !== 0" class="pi pi-trash kn-cursor-pointer" data-test="delete-button" @click="removeDialog(index)"></i>
                </div>
            </div>

            <div
                class="p-col-12 form-list-item-dropzone"
                :class="{ 'form-list-item-dropzone-active': dropzoneBottomVisible[index] }"
                @drop.stop="onDropComplete($event, 'after', index)"
                @dragover.prevent
                @dragenter.prevent="displayDropzone('bottom', index)"
                @dragleave.prevent="hideDropzone('bottom', index)"
            ></div>
            <div v-show="dropzoneBottomVisible[index]" class="p-col-12 form-list-item-dropzone-active" @drop.stop="onDropComplete($event, 'after', index)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapDialogSettings, IMapTooltipSettingsLayer, IMapWidgetLayer, IMapWidgetLayerProperty } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { IMapDialogSettingsProperty } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import descriptor from './MapDialogSettingsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Message from 'primevue/message'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import * as mapWidgetDefaultValues from '../../../helpers/mapWidget/MapWidgetDefaultValues'
import { getPropertiesByLayerId } from '../../../../MapWidget/MapWidgetDataProxy'

export default defineComponent({
    name: 'map-dialog-settings',
    components: { Dropdown, MultiSelect, Message, WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            dialogSettings: null as IMapDialogSettings | null,
            dropzoneTopVisible: {},
            dropzoneBottomVisible: {},
            propertiesCache: new Map<string, { name: string; alias: string }[]>()
        }
    },
    computed: {
        dialogSettingsDisabled() {
            return !this.widgetModel || !this.widgetModel.settings.dialog.enabled
        }
    },
    async mounted() {
        this.loadDialogSettings()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadDialogSettings() {
            if (this.widgetModel?.settings?.dialog) this.dialogSettings = this.widgetModel.settings.dialog
        },
        async loadPropertiesForDialogSettings() {
            if (!this.dialogSettings?.layers) return
            await Promise.all(this.dialogSettings.layers.map((layer: IMapTooltipSettingsLayer) => this.loadAvailableProperties(layer)))
        },
        async loadAvailableProperties(layer: IMapTooltipSettingsLayer | null) {
            if (!layer) return

            const targetLayer = this.widgetModel.layers.find((tempLayer: IMapWidgetLayer) => tempLayer.layerId === layer.name)
            if (targetLayer?.type === 'layer') await this.loadAvailablePropertiesInTooltipSettingsForLayer(targetLayer)
        },
        addDialog() {
            this.dialogSettings?.layers.push({ name: '', columns: [] })
        },
        removeDialog(index: number) {
            if (!this.dialogSettings || !this.dialogSettings.layers) return
            if (index === 0) {
                this.dialogSettings.layers[0].name = ''
                this.dialogSettings.layers[0].columns = []
            } else {
                this.dialogSettings.layers.splice(index, 1)
            }
        },
        onDragStart(event: any, index: number) {
            event.dataTransfer.setData('text/plain', JSON.stringify(index))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropComplete(event: any, position: 'before' | 'after', index: number) {
            this.hideDropzone('bottom', index)
            this.hideDropzone('top', index)
            const eventData = JSON.parse(event.dataTransfer.getData('text/plain'))
            this.onRowsMove(eventData, index, position)
        },
        onRowsMove(sourceRowIndex: number, targetRowIndex: number, position: string) {
            if (sourceRowIndex === targetRowIndex) return
            const newIndex = sourceRowIndex > targetRowIndex && position === 'after' ? targetRowIndex + 1 : targetRowIndex
            this.dialogSettings?.layers.splice(newIndex, 0, this.dialogSettings.layers.splice(sourceRowIndex, 1)[0])
        },
        displayDropzone(position: string, index: number) {
            position === 'top' ? (this.dropzoneTopVisible[index] = true) : (this.dropzoneBottomVisible[index] = true)
        },
        hideDropzone(position: string, index: number) {
            position === 'top' ? (this.dropzoneTopVisible[index] = false) : (this.dropzoneBottomVisible[index] = false)
        },
        getColumnOptionsFromLayer(dialogProperty: IMapDialogSettingsProperty) {
            const index = this.widgetModel.layers.findIndex((layer: any) => layer.name === dialogProperty.name)
            return index !== -1 ? this.widgetModel.layers[index].columns : []
        },
        async onLayerChange(dialogProperty: IMapDialogSettingsProperty) {
            dialogProperty.columns = []
            const target = this.widgetModel.layers.find((layer: IMapWidgetLayer) => dialogProperty.name === layer.layerId)
            if (!target || target.type !== 'layer' || this.propertiesCache.has(dialogProperty.name)) return
            await this.loadAvailablePropertiesInTooltipSettingsForLayer(target)
        },
        async loadAvailablePropertiesInTooltipSettingsForLayer(targetLayer: IMapWidgetLayer) {
            this.setLoading(true)
            const properties = await getPropertiesByLayerId(targetLayer.id)
            const formattedProperties = this.getPropertiesFormattedForDropdownOptions(properties)
            this.propertiesCache.set(targetLayer.layerId, formattedProperties)
            this.setLoading(false)
        },
        getPropertiesFormattedForDropdownOptions(properties: IMapWidgetLayerProperty[]) {
            return properties.map((property: IMapWidgetLayerProperty) => {
                return { name: property.property, alias: property.property }
            })
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.dialogSettings) return
            const defaultDialogSettings = mapWidgetDefaultValues.getDefaultDialogSettings()
            this.dialogSettings.style['font-family'] = model['font-family'] ?? defaultDialogSettings.style['font-family']
            this.dialogSettings.style['font-style'] = model['font-style'] ?? defaultDialogSettings.style['font-style']
            this.dialogSettings.style['font-size'] = model['font-size'] ?? defaultDialogSettings.style['font-size']
            this.dialogSettings.style['font-weight'] = model['font-weight'] ?? defaultDialogSettings.style['font-weight']
            this.dialogSettings.style['justify-content'] = model['justify-content'] ?? defaultDialogSettings.style['justify-content']
            this.dialogSettings.style.color = model.color ?? defaultDialogSettings.style.color
            this.dialogSettings.style['background-color'] = model['justify-content'] ?? defaultDialogSettings.style['background-color']
        }
    }
})
</script>

<style lang="scss" scoped>
.form-list-item-dropzone {
    height: 20px;
    width: 100%;
    background-color: white;
}

.form-list-item-dropzone-active {
    height: 10px;
    background-color: #aec1d3;
}
</style>
