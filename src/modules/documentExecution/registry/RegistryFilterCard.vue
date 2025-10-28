<template>
    <div v-if="filter.static && filter.visible">
        <InputText v-model="filter.filterValue" class="kn-material-input p-mx-2" disabled />
    </div>
    <div v-else-if="!filter.static" class="p-mx-2">
        <span v-if="filter.presentation === 'MANUAL'" class="p-float-label">
            <InputText
                v-model="v$.filter.filterValue.$model"
                class="kn-material-input"
                :class="{
                    'p-invalid': v$.filter.filterValue.$invalid
                }"
                @input="filterChanged"
            />
            <label class="kn-material-input-label"> {{ filter.title }}</label>
        </span>
        <span v-else-if="filter.presentation === 'COMBO'" class="p-field p-float-label p-fluid kn-flex p-ml-2">
            <Dropdown v-model="v$.filter.filterValue.$model" class="kn-material-input" :options="options" option-value="value" option-label="label" :filter="true" @change="filterChanged" @before-show="loadFilterOptions">
                <template #option="slotProps">
                    <div class="flex align-items-center">
                        <div :title="slotProps.option.column_1">{{ slotProps.option.label }}</div>
                    </div>
                </template>
            </Dropdown>
            <label class="kn-material-input-label">{{ filter.title }}</label>
        </span>
        <KnValidationMessages :v-comp="v$.filter.filterValue"></KnValidationMessages>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import Dropdown from 'primevue/dropdown'
import useValidate from '@vuelidate/core'
import { createValidations } from '@/helpers/commons/validationHelper'
import validationDescriptor from './RegistryFilterCardValidationDescriptor.json'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'

export default defineComponent({
    name: 'registry-filter-card',
    components: { Dropdown, KnValidationMessages },
    props: { propFilter: { type: Object }, filterOptions: { type: Array }, entity: { type: Object as PropType<string | null> }, clearTrigger: { type: Boolean }, id: { type: String }, allFilters: { type: Array as PropType<any[]> } },
    emits: ['changed', 'valid'],
    data() {
        return {
            filter: {} as any,
            options: [] as any,
            v$: useValidate() as any
        }
    },
    validations() {
        return {
            filter: createValidations('filter', validationDescriptor.validations.configuration)
        }
    },
    watch: {
        propFilter: {
            handler(newVal) {
                this.loadFilter()
            },
            deep: true
        },
        'propFilter.filterValue'(newVal) {
            if (this.filter.filterValue !== newVal) {
                this.filter.filterValue = newVal
                if (!newVal) this.options = []
            }
        },
        clearTrigger() {
            this.filter.filterValue = ''
            this.options = []
        }
    },
    async created() {
        this.loadFilter()
    },
    methods: {
        loadFilter() {
            this.filter = { ...this.propFilter }
        },
        async loadFilterOptions() {
            const subEntity = this.filter.column.subEntity ? '::' + this.filter.column.subEntity + '(' + this.filter.column.foreignKey + ')' : ''

            const entityId = this.entity + subEntity + ':' + this.filter.field
            const entityOrder = this.entity + subEntity + ':' + (this.filter.column.orderBy ?? this.filter.field)

            const postData = new URLSearchParams({ ENTITY_ID: entityId, QUERY_TYPE: 'standard', ORDER_ENTITY: entityOrder, ORDER_TYPE: 'asc', QUERY_ROOT_ENTITY: 'true' })

            if (this.filter.column?.dependences && this.allFilters) {
                const parentFilter = this.allFilters.find((f: any) => f.field === this.filter.column.dependences)
                if (parentFilter && parentFilter.filterValue) {
                    const dependenceValue = parentFilter.filterValue
                    postData.append('DEPENDENCES', this.entity + subEntity + ':' + this.filter.column.dependences + '=' + dependenceValue)
                }
            }

            await this.$http.post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=GET_FILTER_VALUES_ACTION&SBI_EXECUTION_ID=${this.id}`, postData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(
                (response: AxiosResponse<any>) =>
                    (this.options = response.data.rows.map((row: any) => {
                        return { value: row.column_1, label: row.column_1 === 0 ? '0' : row.column_1 }
                    }))
            )
        },
        filterChanged() {
            this.$emit('changed', this.filter.filterValue)
            this.$emit('valid', !this.v$.filter.filterValue.$invalid)
        }
    }
})
</script>
<style lang="scss">
li[role='option'] {
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
