<template>
  <q-card class="full-width">
    <q-card-section>
      <div class="row q-col-gutter-sm">
        <div class="col-6 q-mb-md">
          <q-input
              filled
              class="col"
              v-model.trim="v$.lov.label.$model"
              maxlength="20"
              :error="v$.lov.label.$invalid && v$.lov.label.$dirty"
              :error-message="t('common.validation.required', { fieldName: t('common.label') })"
              :label="t('common.label') + '*'"
              @update:model-value="onDataChange(v$.lov.label)"
              data-test="label-input"
              @input="$emit('touched')"
          />
          <KnValidationMessages
              :v-comp="v$.lov.label"
              :additional-translate-params="{
                          fieldName: t('common.label')
                      }"
              :specific-translate-keys="{
                          custom_unique_name: 'managers.lovsManagement.lovLabelNotUnique'
                      }"
          />

        </div>

        <div class="col-6 q-mb-md">
          <q-input
              filled
              v-model.trim="v$.lov.name.$model"
              type="text"
              :error="v$.lov.name.$invalid && v$.lov.name.$dirty"
              :error-message="v$.lov.name.$invalid ? t('common.validation.required', { fieldName: t('common.name') }) : ''"
              maxlength="40"
              :label="t('common.name') + '*'"
              @update:model-value="onDataChange(v$.lov.name)"
              @input="$emit('touched')"
          />
          <KnValidationMessages
              :v-comp="v$.lov.name"
              :additional-translate-params="{
                          fieldName: t('common.name')
                      }"
              :specific-translate-keys="{
                          custom_unique_name: 'managers.lovsManagement.lovNameNotUnique'
                      }"
          />
        </div>

        <div class="col-12">
          <q-select
              filled
              v-model="v$.lov.itypeCd.$model"
              :options="listOfInputTypes"
              option-label="VALUE_NM"
              option-value="VALUE_CD"
              :label="t('managers.lovsManagement.lovType') + '*'"
              :error="v$.lov.itypeCd.$invalid && v$.lov.itypeCd.$dirty"
              @update:model-value="typeChanged"
              @input="$emit('touched')"
              emit-value
              map-options
          />
          <KnValidationMessages
              :v-comp="v$.lov.itypeCd"
              :additional-translate-params="{
                          fieldName: t('managers.lovsManagement.lovType')
                      }"
          />
        </div>

        <div class="col-12 q-mb-md">
          <q-input
              filled
              v-model.trim="lov.description"
              type="text"
              maxlength="160"
              :label="t('managers.lovsManagement.description')"
              @update:model-value="$emit('touched')"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { iLov } from '../../LovsManagement'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import lovsManagementDetailCardValidation from './LovsManagementDetailCardValidation.json'
import useValidate from '@vuelidate/core'

export default defineComponent({
  name: 'lovs-management-detail-card',
  components: { KnValidationMessages },
  props: {
    selectedLov: { type: Object },
    lovs: { type: Array, required: true },
    listOfInputTypes: { type: Array }
  },
  emits: ['touched', 'typeChanged', 'dataChanged', 'save', 'cancel'],
  setup() {
    const { t } = useI18n()
    return { t }
  },
  data() {
    return {
      lovsManagementDetailCardValidation,
      lov: {} as iLov,
      v$: useValidate() as any
    }
  },
  validations() {
    const customValidators: ICustomValidatorMap = {
      'custom-unique-label': (value: string) => {
        return this.fieldNotUnique(value, 'label')
      },
      'custom-unique-name': (value: string) => {
        return this.fieldNotUnique(value, 'name')
      }
    }

    return {
      lov: createValidations('lov', lovsManagementDetailCardValidation.validations.lov, customValidators)
    }
  },
  watch: {
    selectedLov() {
      this.loadLov()
    }
  },
  created() {
    this.loadLov()
  },
  methods: {
    loadLov() {
      this.lov = this.selectedLov as iLov
    },
    fieldNotUnique(value: string, field: string) {
      const index = this.lovs.findIndex((lov: any) => lov[field] === value && lov.id != this.lov.id)
      return index === -1
    },
    typeChanged() {
      this.$emit('touched')
      this.$emit('typeChanged')
    },
    onDataChange(v$Comp) {
      v$Comp.$touch()
      this.$emit('dataChanged')
    }
  }
})
</script>