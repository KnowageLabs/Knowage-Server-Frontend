<template>
    <Card id="basic-info-card">
        <template #content>
            <div class="row q-gutter-sm">
                <q-input filled class="col" v-model="v$.layer.label.$model" :error="v$.layer.label.$invalid && v$.layer.label.$dirty" :disable="locked" :error-message="$t('common.validation.required', { fieldName: $t('common.label') })" max-length="100" :label="$t('common.label') + '*'" data-test="description-input" @update:model-value="$emit('touched')" />
                <q-input filled class="col" v-model="v$.layer.name.$model" :error="v$.layer.name.$invalid && v$.layer.name.$dirty" :error-message="$t('common.validation.required', { fieldName: $t('common.name') })" max-length="100" :label="$t('common.name') + '*'" @update:model-value="$emit('touched')" />
            </div>
            <div class="row">
                <q-input filled rows="2" class="col" type="textarea" v-model="layer.descr" max-length="100" :label="$t('common.description')" data-test="description-input" @update:model-value="$emit('touched')" />
            </div>
            <div class="row q-gutter-sm q-mt-sm">
                <q-select class="col" emit-value map-options filled v-model="layer.category_id" :options="allCategories" option-label="VALUE_NM" option-value="VALUE_ID" :label="$t('common.category')" @update:model-value="onTypeChange" />
                <q-select class="col" filled v-model="layer.roles" multiple :options="allRoles" :label="$t('common.roles')" option-label="name" use-chips />
            </div>
        </template>
    </Card>

    <Card id="layer-type-card" class="p-mt-3">
        <template #content>
            <form class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-12">
                    <div class="row">
                        <q-select filled class="col" v-model="layer.type" :options="descriptor.layerTypes" emit-value map-options option-value="value" :option-label="(option) => (option.label ? $t(option.label) : '')" :label="$t('common.type')" :disable="layer.layerId != undefined" :error="!layer.type" @change="$emit('touched')">
                            <template #hint>
                                <span v-if="!layer.type">{{ $t('common.required') }}</span>
                            </template>
                        </q-select>
                    </div>
                </div>
                <div v-if="['wkt', 'geojson', 'topojson', 'File'].includes(layer.type)" class="p-field p-col-12 p-d-flex">
                    <div class="kn-flex">
                        <span class="p-float-label">
                            <InputText id="fileName" v-model="layer.pathFile" class="kn-material-input" :disabled="true" />
                            <label for="fileName" class="kn-material-input-label">{{ $t('managers.layersManagement.fileLocation') }}</label>
                        </span>
                    </div>
                    <Button icon="fas fa-upload" class="p-button-text p-button-plain p-ml-2" @click="setUploadType" />
                    <KnInputFile v-if="!uploading" :change-function="uploadLayerFile" accept=".json" :trigger-input="triggerUpload" />
                </div>
                <div v-if="layer.type == 'WFS' || layer.type == 'WMS' || layer.type == 'TMS'" class="p-field p-col-12">
                    <span class="p-float-label">
                        <InputText
                            id="label"
                            v-model="v$.layer.layerURL.$model"
                            class="kn-material-input"
                            type="text"
                            max-length="100"
                            :class="{
                                'p-invalid': v$.layer.layerURL.$invalid && v$.layer.layerURL.$dirty
                            }"
                            @blur="v$.layer.layerURL.$touch()"
                            @change="$emit('touched')"
                        />
                        <label for="label" class="kn-material-input-label">{{ $t('managers.layersManagement.layerURL') }} *</label>
                    </span>
                    <KnValidationMessages class="p-mt-1" :v-comp="v$.layer.layerURL" :additional-translate-params="{ fieldName: $t('managers.layersManagement.layerURL') }" />
                </div>
                <div v-if="layer.type == 'Google' || layer.type == 'WMS' || layer.type == 'TMS'" :class="{ 'p-lg-6': layer.type == 'WMS', 'p-lg-12': layer.type != 'WMS' }" class="p-field p-col-12 p-lg-6">
                    <span class="p-float-label">
                        <InputText id="label" v-model="layer.layerOptions" class="kn-material-input" type="text" max-length="100" @change="$emit('touched')" />
                        <label for="label" class="kn-material-input-label">{{ $t('managers.layersManagement.layerOptions') }}</label>
                    </span>
                </div>
                <div v-if="layer.type == 'WMS'" class="p-field p-col-12 p-lg-6">
                    <span class="p-float-label">
                        <InputText id="label" v-model="layer.layerParams" class="kn-material-input" type="text" max-length="100" @change="$emit('touched')" />
                        <label for="label" class="kn-material-input-label">{{ $t('managers.layersManagement.layerParams') }}</label>
                    </span>
                </div>
            </form>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import descriptor from './LayersManagementLayerTabDescriptor.json'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import KnInputFile from '@/components/UI/KnInputFile.vue'

export default defineComponent({
    components: { KnValidationMessages, KnInputFile },
    props: { selectedLayer: { type: Object, required: true }, allRoles: { type: Array, required: true }, allCategories: { type: Array, required: true } },
    emits: ['touched'],
    data() {
        return {
            v$: useValidate() as any,
            descriptor,
            layer: {} as any,
            triggerUpload: false,
            uploading: false,
            locked: false
        }
    },
    async updated() {
        this.layer = this.selectedLayer
        this.locked = this.selectedLayer.label ? true : false
        if (this.layer.type === 'File') this.layer.type = 'geojson'
    },
    validations() {
        const urlRequried = (value) => {
            const types = ['WFS', 'WMS', 'TMS']
            return !types.includes(this.layer.type) || value
        }
        const customValidators: ICustomValidatorMap = { 'url-required': urlRequried }
        const validationObject = { layer: createValidations('layer', this.descriptor.validations.layer as any, customValidators) }
        return validationObject
    },
    methods: {
        setUploadType() {
            this.triggerUpload = false
            setTimeout(() => (this.triggerUpload = true), 200)
        },
        uploadLayerFile(event) {
            this.uploading = true
            const uploadedFile = event.target.files[0]
            this.layer.layerFile = { file: uploadedFile, fileName: uploadedFile.name }
            this.triggerUpload = false
            setTimeout(() => (this.uploading = false), 200)
        }
    }
})
</script>
