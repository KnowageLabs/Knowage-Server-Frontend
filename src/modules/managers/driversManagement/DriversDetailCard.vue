<template>
  <q-card>
    <q-card-section class="q-ma-lg">
      <form class="row q-col-gutter-md">
        <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <q-input
              filled
              type="text"
              v-model="v$.driver.label.$model"
              :error="v$.driver.label.$invalid && v$.driver.label.$dirty"
              :error-message="
              v$.driver.label.$invalid && v$.driver.label.$dirty ?
              $t('common.validation.required', { fieldName: $t('common.label') }) : ''
            "
              maxlength="20"
              @blur="v$.driver.label.$touch()"
              @update:model-value="setDirty"
              :label="$t('common.label') + '*'"
              autofocus/>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <q-input
              filled
              type="text"
              v-model="v$.driver.name.$model"
              :error="v$.driver.name.$invalid && v$.driver.name.$dirty"
              :error-message="
              v$.driver.name.$invalid && v$.driver.name.$dirty ?
              $t('common.validation.required', { fieldName: $t('common.name') }) : ''
            "
              maxlength="40"
              @blur="v$.driver.name.$touch()"
              @update:model-value="setDirty"
              :label="$t('common.name') + '*'"
              autofocus/>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <q-select
              filled
              v-model="v$.driver.type.$model"
              :options="types"
              option-value="VALUE_CD"
              option-label="VALUE_NM"
              emit-value
              map-options
              :error="v$.driver.type.$invalid && v$.driver.type.$dirty"
              :error-message="
              v$.driver.type.$invalid && v$.driver.type.$dirty ?
              $t('common.validation.required', { fieldName: $t('common.type') }) : ''
            "
              @blur="v$.driver.type.$touch()"
              @update:model-value="setDirty"
              :label="$t('common.type') + '*'"
              autocomplete=""/>
        </div>
        <div class="col-lg-8 col-md-8 col-sm-8 col-xs-12">
          <q-input
              filled
              rows="2"
              type="textarea"
              v-model="driver.description"
              maxlength="160"
              @update:model-value="setDirty"
              :label="$t('common.description') + '*'"
              autofocus/>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <q-select
              filled
              v-model="selectedOptions"
              :options="driversManagemenDetailtDescriptor.options"
              option-label="name"
              option-value="label"
              emit-value
              map-options
              multiple
              @update:model-value="changeType"
              :label="$t('managers.driversManagement.options') + '*'"
              autocomplete=""/>
        </div>
      </form>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import {createValidations} from '@/helpers/commons/validationHelper'
import driversManagemenDetailtDescriptor from './DriversManagementDetailDescriptor.json'
import driversManagemenValidationtDescriptor from './DriversManagementValidationDescriptor.json'
import useValidate from '@vuelidate/core'
import {QCard, QCardSection, QInput, QSelect} from 'quasar'

export default defineComponent({
  name: 'detail-card',
  components: { QCard, QCardSection, QInput, QSelect },
  props: {
    selectedDriver: {
      type: Object,
      required: false
    },
    types: {
      type: Array,
      required: false
    }
  },
  data() {
    return {
      driver: {} as any,
      driversManagemenDetailtDescriptor,
      driversManagemenValidationtDescriptor,
      selectedOptions: [] as string[],
      v$: useValidate() as any
    }
  },
  validations() {
    return {
      driver: createValidations('driver', driversManagemenValidationtDescriptor.validations.driver)
    }
  },
  watch: {
    selectedDriver() {
      this.driver = this.selectedDriver as any
      this.handleTypes()
    }
  },
  mounted() {
    if (this.driver) {
      this.driver = this.selectedDriver as any
      this.handleTypes()
    }
  },
  methods: {
    handleTypes() {
      this.selectedOptions = []
      if (this.driver.functional) {
        this.selectedOptions.push('functional')
      }
      if (this.driver.temporal) {
        this.selectedOptions.push('temporal')
      }
    },
    changeType() {
      this.selectedOptions.includes('temporal') ? (this.driver.temporal = true) : (this.driver.temporal = false)
      this.selectedOptions.includes('functional') ? (this.driver.functional = true) : (this.driver.functional = false)
      this.setDirty()
    },
    setDirty() {
      this.$emit('touched')
    }
  }
})
</script>