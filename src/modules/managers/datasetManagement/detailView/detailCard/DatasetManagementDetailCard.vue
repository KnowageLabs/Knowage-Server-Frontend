<template>
  <q-card class="q-ma-md">
    <q-card-section>
      <form class="row q-col-gutter-md">
        <div class="col-6">
          <q-input
              v-model="v$.dataset.label.$model"
              label-slot
              filled
              maxlength="50"
              :error="v$.dataset.label.$invalid && v$.dataset.label.$dirty"
              :error-message="v$.dataset.label.$errors[0]?.$message"
              data-test="label-input"
              @blur="v$.dataset.label.$touch()"
              @update:model-value="$emit('touched')"
          >
            <template #label>
              <span>{{ $t('common.label') }} *</span>
            </template>
          </q-input>
        </div>
        <div class="col-6">
          <q-input
              v-model="v$.dataset.name.$model"
              label-slot
              filled
              maxlength="50"
              :error="v$.dataset.name.$invalid && v$.dataset.name.$dirty"
              :error-message="v$.dataset.name.$errors[0]?.$message"
              data-test="name-input"
              @blur="v$.dataset.name.$touch()"
              @update:model-value="$emit('touched')"
          >
            <template #label>
              <span>{{ $t('common.name') }} *</span>
            </template>
          </q-input>
        </div>
        <div class="col-12">
          <q-input
              v-model="v$.dataset.description.$model"
              label-slot
              filled
              maxlength="160"
              :error="v$.dataset.description.$invalid && v$.dataset.description.$dirty"
              :error-message="v$.dataset.description.$errors[0]?.$message"
              data-test="description-input"
              @blur="v$.dataset.description.$touch()"
              @update:model-value="$emit('touched')"
          >
            <template #label>
              <span>{{ $t('common.description') }}</span>
            </template>
          </q-input>
        </div>
        <div class="col-6">
          <q-select
              v-model="v$.dataset.scopeId.$model"
              :options="scopeTypes"
              option-label="VALUE_CD"
              option-value="VALUE_ID"
              label-slot
              filled
              map-options
              emit-value
              :error="v$.dataset.scopeId.$invalid && v$.dataset.scopeId.$dirty"
              :error-message="v$.dataset.scopeId.$errors[0]?.$message"
              data-test="scope-input"
              @focus="v$.dataset.scopeId.$touch()"
              @update:model-value="updateCdFromId(this.scopeTypes, 'scopeCd', $event), $emit('touched')"
          >
            <template #label>
              <span>{{ $t('managers.datasetManagement.scope') }} *</span>
            </template>
          </q-select>
        </div>
        <div class="col-6">
          <q-select
              v-model="v$.dataset.catTypeId.$model"
              :options="categoryTypes"
              option-label="VALUE_CD"
              option-value="VALUE_ID"
              label-slot
              filled
              map-options
              emit-value
              clearable
              :disable-clear="dataset.scopeCd !== 'USER'"
              :error="v$.dataset.catTypeId.$invalid && v$.dataset.catTypeId.$dirty"
              :error-message="v$.dataset.catTypeId.$errors[0]?.$message"
              data-test="category-input"
              @focus="v$.dataset.catTypeId.$touch()"
              @update:model-value="updateCdFromId(this.categoryTypes, 'catTypeVn', $event), $emit('touched')"
          >
            <template #label>
              <span>{{ $t('common.category') }} {{ dataset.scopeCd !== 'USER' ? '*' : '' }}</span>
            </template>
          </q-select>
        </div>
        <div class="col-12">
          <q-select
              v-model="dataset.tags"
              :options="filteredTagsNames"
              option-label="name"
              label-slot
              filled
              multiple
              use-input
              use-chips
              input-debounce="250"
              @filter="searchTag"
              @keyup.enter="createTagChip"
              data-test="search-input"
          >
            <template #label>
              <span>{{ $t('common.tags') }}</span>
            </template>
          </q-select>
          <div class="text-caption">{{ $t('managers.widgetGallery.tags.availableCharacters') }}</div>
        </div>
      </form>
    </q-card-section>
  </q-card>

  <q-card class="q-ma-md">
    <q-toolbar class="bg-grey-3">
      <q-toolbar-title>{{ $t('managers.datasetManagement.oldVersions') }}</q-toolbar-title>
      <q-btn
          flat
          round
          dense
          icon="fas fa-eraser"
          :disable="noDatasetVersions"
          @click="deleteConfirm('deleteAll')"
      />
    </q-toolbar>
    <q-card-section>
      <q-linear-progress v-if="loading" indeterminate class="q-mb-md" data-test="versions-loading" />
      <q-table
          v-if="!loading"
          :rows="selectedDatasetVersions"
          :columns="[
                    { name: 'userIn', label: $t('managers.datasetManagement.creationUser'), field: 'userIn', sortable: true },
                    { name: 'type', label: $t('importExport.gallery.column.type'), field: 'type', sortable: true },
                    { name: 'dateIn', label: $t('managers.mondrianSchemasManagement.headers.creationDate'), field: 'dateIn', sortable: true, format: (val) => formatDate(val) }
                ]"
          dense
          row-key="versNum"
          virtual-scroll
          :virtual-scroll-item-size="48"
          virtual-scroll-slice-size="10"
      >
        <template #no-data>
          {{ $t('managers.datasetManagement.noVersions') }}
        </template>
        <template #body-cell-dateIn="props">
          {{ formatDate(props.row.dateIn) }}
        </template>
        <template #body-cell-actions="props">
          <q-btn v-if="props.row.versNum !== 0" flat round size="sm" icon="fas fa-retweet" @click="restoreVersionConfirm(props.row)" />
          <q-btn v-if="props.row.versNum !== 0" flat round size="sm" icon="pi pi-trash" @click="deleteConfirm('deleteOne', props.row)" />
        </template>
        <template #item="props">
          <q-tr :props="props">
            <q-td key="userIn" :props="props">{{ props.row.userIn }}</q-td>
            <q-td key="type" :props="props">{{ props.row.type }}</q-td>
            <q-td key="dateIn" :props="props">{{ formatDate(props.row.dateIn) }}</q-td>
            <q-td auto-width>
              <q-btn v-if="props.row.versNum !== 0" flat round dense icon="fas fa-retweet" @click.stop="restoreVersionConfirm(props.row)" />
              <q-btn v-if="props.row.versNum !== 0" flat round dense icon="pi pi-trash" @click.stop="deleteConfirm('deleteOne', props.row)" />
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import detailTabDescriptor from './DatasetManagementDetailCardDescriptor.json'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import mainStore from '../../../../../App.store'

export default defineComponent({
  props: {
    scopeTypes: { type: Array as any, required: true },
    categoryTypes: { type: Array as any, required: true },
    selectedDataset: { type: Object as any },
    selectedDatasetVersions: { type: Array as any },
    availableTags: { type: Array as any },
    loading: { type: Boolean }
  },
  emits: ['touched', 'reloadVersions', 'loadingOlderVersion', 'olderVersionLoaded'],
  setup() {
    const store = mainStore()
    return { store }
  },
  data() {
    return {
      detailTabDescriptor,
      loadingVersion: false,
      v$: useValidate() as any,
      dataset: {} as any,
      datasetVersions: [] as any,
      availableTagsNames: [] as any,
      selectedTagsNames: [] as any,
      filteredTagsNames: null as any
    }
  },
  computed: {
    noDatasetVersions(): any {
      if (this.selectedDatasetVersions.length > 0) {
        return false
      }
      return true
    }
  },
  watch: {
    selectedDataset() {
      this.dataset = this.selectedDataset
      this.v$.dataset.label.$touch()
      this.v$.dataset.name.$touch()
    }
  },
  created() {
    this.dataset = this.selectedDataset
  },
  validations() {
    const catTypeRequired = (value) => {
      return this.dataset.scopeCd == 'USER' || value
    }
    const customValidators: ICustomValidatorMap = { 'cat-type-required': catTypeRequired }
    const validationObject = { dataset: createValidations('dataset', detailTabDescriptor.validations.dataset, customValidators) }
    return validationObject
  },
  methods: {
    deleteConfirm(deletetype, event) {
      let msgDesc = ''
      deletetype === 'deleteOne' ? (msgDesc = 'managers.datasetManagement.deleteOneVersionMsg') : (msgDesc = 'managers.datasetManagement.deleteAllVersionsMsg')
      this.$q.dialog({
        title: this.$t('common.uppercaseDelete'),
        message: this.$t(msgDesc),
        cancel: true,
        persistent: true
      }).onOk(() => {
        deletetype === 'deleteOne' ? this.deleteSelectedVersion(event) : this.deleteAllVersions()
      })
    },
    async deleteSelectedVersion(event) {
      return this.$http
          .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/${event.dsId}/version/${event.versNum}`)
          .then(() => {
            this.store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
            this.$emit('reloadVersions')
          })
          .catch((error) => this.store.setError({ title: this.$t('common.error.generic'), msg: error.message }))
    },
    async deleteAllVersions() {
      return this.$http
          .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/${this.selectedDataset.id}/allversions/`)
          .then(() => {
            this.store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('managers.datasetManagement.deleteAllVersionsSuccess') })
            this.$emit('reloadVersions')
          })
          .catch((error) => this.store.setError({ title: this.$t('common.error.generic'), msg: error.message }))
    },
    restoreVersionConfirm(event) {
      this.$q.dialog({
        title: this.$t('managers.datasetManagement.restoreTitle'),
        message: this.$t('managers.datasetManagement.restoreMsg'),
        cancel: true,
        persistent: true
      }).onOk(() => this.restoreVersion(event))
    },
    async restoreVersion(dsToRestore) {
      this.$emit('loadingOlderVersion')
      await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/${this.dataset.id}/restore?versionId=${dsToRestore.versNum}`).then((response: AxiosResponse<any>) => {
        this.dataset.dsTypeCd.toLowerCase() == 'file' ? this.refactorFileDatasetConfig(response.data[0]) : ''
        this.$emit('olderVersionLoaded', response.data[0])
      })
      this.loadingVersion = false
    },
    refactorFileDatasetConfig(item) {
      this.dataset.fileType = item != undefined ? item.fileType : ''
      this.dataset.fileName = item != undefined ? item.fileName : ''
      this.dataset.csvEncoding = item != undefined ? item.csvEncoding : 'UTF-8'
      this.dataset.csvDelimiter = item != undefined ? item.csvDelimiter : ','
      this.dataset.csvQuote = item != undefined ? item.csvQuote : '"'
      this.dataset.dateFormat = item != undefined && item.dateFormat != undefined ? item.dateFormat : 'dd/MM/yyyy'
      this.dataset.timestampFormat = item != undefined && item.timestampFormat != undefined ? item.timestampFormat : 'dd/MM/yyyy HH:mm:ss'

      if (item != undefined) {
        if (item.limitRows != null && item.limitRows != '') {
          this.dataset.limitRows = Number(item.limitRows)
        } else {
          this.dataset.limitRows = item.limitRows
        }
      } else {
        this.dataset.limitRows = null
      }

      if (item != undefined) {
        this.dataset.catTypeVn = item.catTypeVn
        this.dataset.catTypeId = Number(item.catTypeId)
        this.dataset.xslSheetNumber = Number(1)
        this.dataset.skipRows = Number(item.skipRows)
        this.dataset.limitRows = Number(null)
      } else {
        this.dataset.catTypeVn = ''
        this.dataset.catTypeId = null
        this.dataset.xslSheetNumber = null
        this.dataset.skipRows = null
        this.dataset.limitRows = null
      }

      this.dataset.id = item != undefined ? item.id : ''
      this.dataset.label = item != undefined ? item.label : ''
      this.dataset.name = item != undefined ? item.name : ''
      this.dataset.description = item != undefined ? item.description : ''
      this.dataset.meta = item != undefined ? item.meta : []

      this.dataset.fileUploaded = false
    },
    searchTag(val, update) {
      if (val === '') {
        update(() => {
          this.filteredTagsNames = [...this.availableTags]
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.filteredTagsNames = this.availableTags.filter(tag =>
            tag.name.toLowerCase().startsWith(needle)
        )
      })
    },
    createTagChip(event) {
      const value = event.target.value
      if (value) {
        const tempWord = this.availableTags.find((el) => el.name == value)
        if (!tempWord) {
          this.dataset.tags.push(value)
          this.buildTagObject()
          event.target.value = ''
        }
      }
    },
    buildTagObject() {
      this.dataset.tags = this.dataset.tags.map((tag) => {
        if (typeof tag !== 'string') {
          return tag
        } else {
          return { name: tag }
        }
      })
    },
    formatDate(date) {
      return formatDateWithLocale(date, { dateStyle: 'short', timeStyle: 'short' })
    },
    updateCdFromId(optionsArray, fieldToUpdate, updatedField) {
      const selectedField = optionsArray.find((option) => option.VALUE_ID === updatedField)
      if (selectedField) this.dataset[fieldToUpdate] = selectedField.VALUE_CD
    }
  }
})
</script>