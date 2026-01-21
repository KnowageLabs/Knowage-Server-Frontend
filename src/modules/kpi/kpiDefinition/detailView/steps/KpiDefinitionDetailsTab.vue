<template>
    <q-card>
        <q-card-section class="q-pa-md">
            <div class="row q-col-gutter-md">
                <q-input v-model.trim="v$.selectedKpi.name.$model" class="col-4" :label="$t('common.name') + ' *'" dense maxlength="25" :error="v$.selectedKpi.name.$invalid && v$.selectedKpi.name.$dirty" @blur="v$.selectedKpi.name.$touch()">
                    <template v-slot:error>
                        <KnValidationMessages :v-comp="v$.selectedKpi.name" :additional-translate-params="{ fieldName: $t('common.name') }" />
                    </template>
                </q-input>

                <q-input v-model.trim="selectedKpi.author" class="col-4" :label="$t('common.author')" dense disable />

                <q-select v-model="v$.selectedKpi.category.$model" class="col-4" :label="$t('managers.configurationManagement.headers.category') + ' *'" :options="filteredCategories" option-label="valueName" dense use-input input-debounce="250" :error="v$.selectedKpi.category.$invalid && v$.selectedKpi.category.$dirty" @filter="filterCategories" @blur="v$.selectedKpi.category.$touch()">
                    <template v-slot:error>
                        <KnValidationMessages :v-comp="v$.selectedKpi.category" :additional-translate-params="{ fieldName: $t('managers.configurationManagement.headers.category') }" />
                    </template>
                </q-select>

                <q-checkbox v-model="selectedKpi.enableVersioning" class="q-px-sm q-py-none" :label="$t('kpi.kpiDefinition.enableVersioning')" @update:model-value="$emit('touched')" />
            </div>
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import useValidate from '@vuelidate/core'
import tabViewDescriptor from '../KpiDefinitionDetailDescriptor.json'

export default defineComponent({
    components: { KnValidationMessages },
    props: {
        propKpi: {
            type: Object as any,
            required: true
        },
        kpiCategoryList: {
            type: Array as any,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['touched'],
    data() {
        return {
            v$: useValidate() as any,
            tabViewDescriptor,
            selectedKpi: {} as any,
            filteredCategories: [] as any[]
        }
    },
    validations() {
        return {
            selectedKpi: createValidations('selectedKpi', tabViewDescriptor.validations.selectedKpi)
        }
    },
    watch: {
        propKpi: {
            handler() {
                this.selectedKpi = this.propKpi as any
            },
            immediate: true
        },
        kpiCategoryList: {
            handler() {
                this.filteredCategories = [...this.kpiCategoryList]
            },
            immediate: true
        }
    },
    methods: {
        filterCategories(val: string, update: Function) {
            update(() => {
                if (val === '') {
                    this.filteredCategories = [...this.kpiCategoryList]
                } else {
                    const needle = val.toLowerCase()
                    this.filteredCategories = this.kpiCategoryList.filter((category: any) => category.valueName?.toLowerCase().includes(needle) || category.valueCd?.toLowerCase().includes(needle))
                }
            })
        }
    }
})
</script>
