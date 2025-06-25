<template>
    <q-card v-if="mode.useID" class="col-12">
        <q-card-section>
            <form class="row q-col-gutter-sm">
                <q-input class="col-6" filled v-model.trim="v$.mode.label.$model" :error="v$.mode.label.$invalid && v$.mode.label.$dirty" :error-message="v$.mode.label.$invalid && v$.mode.label.$dirty ? $t('validation.required', { fieldName: $t('common.label') }) : null" @blur="v$.mode.label.$touch()" @update:model-value="modeChanged" :label="$t('common.label') + '*'" maxlength="20" autofocus />
                <q-input class="col-6" filled v-model.trim="v$.mode.name.$model" :error="v$.mode.name.$invalid && v$.mode.name.$dirty" :error-message="v$.mode.name.$invalid && v$.mode.name.$dirty ? $t('validation.required', { fieldName: $t('common.name') }) : null" @blur="v$.mode.name.$touch()" @update:model-value="modeChanged" :label="$t('common.name') + '*'" maxlength="40" autofocus />
                <q-input class="col-12" type="textarea" rows="2" filled v-model.trim="mode.description" @update:model-value="modeChanged" :label="$t('common.description')" maxlength="160" autofocus />
                <q-select
                    class="col-4"
                    filled
                    v-model="v$.mode.valueSelection.$model"
                    :options="availableTypes"
                    option-label="name"
                    option-value="valueSelection"
                    emit-value
                    map-options
                    :error="v$.mode.valueSelection.$invalid && v$.mode.valueSelection.$dirty"
                    :error-message="v$.mode.valueSelection.$invalid && v$.mode.valueSelection.$dirty ? $t('validation.required', { fieldName: $t('common.type') }) : null"
                    @blur="v$.mode.valueSelection.$touch()"
                    @update:model-value="setType"
                    :label="$t('common.type') + '*'"
                    autocomplete=""
                />
                <template v-if="mode.valueSelection === 'lov'">
                    <q-input class="col-4" filled v-model="mode.typeLov.name" :error="v$.mode.typeLov.$invalid && v$.mode.typeLov.$dirty" :error-message="v$.mode.typeLov.$invalid && v$.mode.typeLov.$dirty ? $t('common.validation.required', { fieldName: $t('managers.driversManagement.useModes.lov') }) : null" :label="$t('managers.driversManagement.useModes.lov') + '*'" autofocus>
                        <template v-slot:append>
                            <q-icon name="search" class="cursor-pointer" @click="showLovsDialog('type')" />
                        </template>
                    </q-input>
                    <q-select
                        class="col-4"
                        filled
                        v-model="v$.mode.selectionType.$model"
                        :options="selectionTypes"
                        option-label="VALUE_NM"
                        option-value="VALUE_CD"
                        emit-value
                        map-options
                        :error="v$.mode.selectionType.$invalid && v$.mode.selectionType.$dirty"
                        :error-message="v$.mode.selectionType.$invalid && v$.mode.selectionType.$dirty ? $t('common.validation.required', { fieldName: $t('managers.driversManagement.useModes.modality') }) : null"
                        @blur="v$.mode.selectionType.$touch()"
                        @update:model-value="modeChanged"
                        :label="$t('managers.driversManagement.useModes.modality') + '*'"
                        autocomplete=""
                    />
                </template>

                <q-select class="col-4" filled v-model="selectedDefault" :options="defaults" option-label="name" option-value="label" emit-value map-options @update:model-value="setDefault" :label="$t('managers.driversManagement.useModes.defaultValue') + '*'" autocomplete="" />

                <q-input v-if="selectedDefault === 'lov'" class="col-4" filled v-model="mode.defLov.name" :error="v$.mode.defLov.$invalid && v$.mode.defLov.$dirty" :error-message="v$.mode.defLov.$invalid && v$.mode.defLov.$dirty ? $t('common.validation.required', { fieldName: $t('managers.driversManagement.useModes.lov') }) : null" :label="$t('managers.driversManagement.useModes.lov') + '*'" autofocus>
                    <template v-slot:append>
                        <q-icon name="search" class="cursor-pointer" @click="showLovsDialog('default')" />
                    </template>
                </q-input>

                <q-select
                    v-if="selectedDefault === 'pickUp'"
                    class="col-4"
                    filled
                    v-model="v$.mode.defaultFormula.$model"
                    :options="useModeDescriptor.defaultFormula"
                    option-label="name"
                    option-value="f_value"
                    emit-value
                    map-options
                    :error="v$.mode.defaultFormula.$invalid && v$.mode.defaultFormula.$dirty"
                    :error-message="v$.mode.defaultFormula.$invalid && v$.mode.defaultFormula.$dirty ? $t('common.validation.required', { fieldName: $t('managers.driversManagement.useModes.selectDefaultFormula') }) : null"
                    @blur="v$.mode.defaultFormula.$touch()"
                    @update:model-value="modeChanged"
                    :label="$t('managers.driversManagement.useModes.selectDefaultFormula') + '*'"
                    autocomplete=""
                />

                <q-select v-if="isDate" class="col-4" filled v-model="selectedMax" :options="useModeDescriptor.maxValues" option-label="name" option-value="label" emit-value map-options @update:model-value="setMax" :label="$t('managers.driversManagement.useModes.maxValue') + '*'" autocomplete="" />
                <q-input v-if="selectedMax === 'lov'" class="col-4" filled v-model="mode.maxLov.name" :error="v$.mode.maxLov.$invalid && v$.mode.maxLov.$dirty" :error-message="v$.mode.maxLov.$invalid && v$.mode.maxLov.$dirty ? $t('common.validation.required', { fieldName: $t('managers.driversManagement.useModes.lov') }) : null" disable :label="$t('managers.driversManagement.useModes.lov') + '*'" autofocus>
                    <template v-slot:append>
                        <q-icon name="search" class="cursor-pointer" @click="showLovsDialog('max')" />
                    </template>
                </q-input>
            </form>
            <LovsDialog :dialog-visible="dialogVisiable" :lovs="lovs" :selected-lov-prop="lov" @close="dialogVisiable = false" @apply="applyLov"></LovsDialog>
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import useModeDescriptor from './UseModesDescriptor.json'
import useModeValidationtDescriptor from './UseModeValidationDescriptor.json'
import LovsDialog from './DriversManagementLovsDialog.vue'

export default defineComponent({
    name: 'detail-card',
    components: { LovsDialog },
    props: {
        selectedMode: {
            type: Object,
            required: false
        },
        selectionTypes: {
            type: Array,
            required: true
        },
        layers: {
            type: Array,
            required: true
        },
        lovs: {
            type: Array,
            required: true
        },
        isDate: {
            type: Boolean,
            required: true
        },
        showMapDriver: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            mode: {} as any,
            useModeDescriptor,
            selectedType: null,
            selectedDefault: null as any,
            selectedMax: null as any,
            lov: null as any,
            lovType: null as any,
            dialogVisiable: false,
            v$: useValidate() as any,
            useModeValidationtDescriptor
        }
    },
    validations() {
        const customValidators: ICustomValidatorMap = {
            required_type_for_lov: () => {
                return this.mode.valueSelection != 'lov' || this.mode.selectionType != null
            },
            required_lovId_for_lov: () => {
                return this.mode.valueSelection != 'lov' || this.mode.typeLov.name != null
            },
            required_for_pick_up: () => {
                return this.selectedDefault != 'pickUp' || (this.mode.defaultFormula != '' && this.mode.defaultFormula != null)
            },
            required_lov_for_default: () => {
                return this.selectedDefault != 'lov' || this.mode.defLov.name != null
            },
            required_lov_for_max: () => {
                return this.selectedMax != 'lov' || this.mode.maxLov.name != null
            }
        }
        return {
            mode: createValidations('mode', useModeValidationtDescriptor.validations.mode, customValidators)
        }
    },
    computed: {
        defaults(): any {
            return this.useModeDescriptor.defaultValues
        },
        availableTypes(): any {
            return this.useModeDescriptor.types
        }
    },
    watch: {
        selectedMode() {
            this.v$.$reset()
            this.mode = this.selectedMode as any
            this.handleDropdowns()
            this.v$.$touch()
            setTimeout(() => {
                this.modeChanged()
            }, 500)

            this.handleLovs()
        }
    },
    mounted() {
        if (this.selectedMode) {
            this.mode = this.selectedMode as any
            this.handleDropdowns()
        }
        this.v$.$touch()
        this.handleLovs()
        setTimeout(() => {
            this.modeChanged()
        }, 500)
    },
    methods: {
        showLovsDialog(lovType: string) {
            this.dialogVisiable = true
            switch (lovType) {
                case 'type':
                    this.lov = this.mode.typeLov
                    this.lovType = 'type'
                    break
                case 'default':
                    this.lov = this.mode.defLov
                    this.lovType = 'default'
                    break
                case 'max':
                    this.lov = this.mode.maxLov
                    this.lovType = 'max'
                    break
            }
        },
        handleDropdowns() {
            if (this.mode.defaultFormula == null) {
                this.selectedDefault = 'none'
            } else {
                this.selectedDefault = 'pickUp'
            }
            if (this.mode.idLovForDefault != null) {
                this.selectedDefault = 'lov'
            }

            if (this.mode.idLovForMax != null) {
                this.selectedMax = 'lov'
            } else {
                this.selectedMax = 'none'
            }
        },
        setType() {
            this.selectedDefault = 'none'
            switch (this.mode.valueSelection) {
                case 'lov':
                    this.mode.manualInput = 0
                    this.mode.selectedLayer = null
                    this.mode.selectedLayerProp = null
                    break
                case 'man_in':
                    this.mode.idLov = null
                    this.mode.typeLov = { name: null }
                    this.mode.selectionType = null
                    this.mode.selectedLayer = null
                    this.mode.selectedLayerProp = null
                    break
            }
            this.modeChanged()
        },
        setDefault() {
            switch (this.selectedDefault) {
                case 'none':
                    this.mode.defaultFormula = null
                    this.mode.idLovForDefault = null
                    this.mode.defLov = { name: null }
                    break
                case 'lov':
                    this.mode.defaultFormula = null
                    break
                case 'pickUp':
                    this.mode.idLovForDefault = null
                    this.mode.defLov = { name: null }
                    break
            }
            this.modeChanged()
        },
        setMax() {
            if (this.selectedMax == 'none') {
                this.mode.idLovForMax = null
                this.mode.maxLov = { name: null }
            }
            this.modeChanged()
        },
        setDirty() {
            this.$emit('touched')
        },
        modeChanged() {
            this.mode.numberOfErrors = this.v$.$errors.length
            this.mode.edited = true
        },
        applyLov(lov: any) {
            this.dialogVisiable = false
            switch (this.lovType) {
                case 'type':
                    this.mode.typeLov = lov
                    this.mode.idLov = lov.id
                    break
                case 'default':
                    this.mode.defLov = lov
                    this.mode.idLovForDefault = lov.id
                    break
                case 'max':
                    this.mode.maxLov = lov
                    this.mode.idLovForMax = lov.id
                    break
            }
            this.modeChanged()
        },
        handleLovs() {
            if (this.mode.idLov) {
                this.mode.typeLov = this.lovs?.filter((lov: any) => lov.id == this.mode.idLov)[0]
            } else this.mode.typeLov = { name: null }
            if (this.mode.idLovForDefault) {
                this.mode.defLov = this.lovs?.filter((lov: any) => lov.id == this.mode.idLovForDefault)[0]
            } else this.mode.defLov = { name: null }
            if (this.mode.idLovForMax) {
                this.mode.maxLov = this.lovs?.filter((lov: any) => lov.id == this.mode.idLovForMax)[0]
            } else this.mode.maxLov = { name: null }
        }
    }
})
</script>

<style lang="scss">
.cursor-pointer {
    cursor: pointer;
}
</style>
