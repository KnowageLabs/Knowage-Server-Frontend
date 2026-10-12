<!-- eslint-disable vue/valid-v-model -->
<template>
    <div v-if="driver && driver.parameterValue" class="q-pa-md">
        <q-input :model-value="displayValue" :label="$t('common.value')" outlined dense hide-bottom-space readonly clearable data-test="driver-date-input" @clear="setDate(null)">
            <template #append>
                <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date :model-value="dateModel" mask="YYYY-MM-DD" @update:model-value="setDate">
                            <div class="row items-center justify-end">
                                <q-btn v-close-popup flat :label="$t('common.close')" color="primary" />
                            </div>
                        </q-date>
                    </q-popup-proxy>
                </q-icon>
            </template>
        </q-input>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardDatasetDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { luxonFormatDate } from '@/helpers/commons/localeHelper'

export default defineComponent({
    name: 'driver-dialog-date-input',
    props: { propDriver: { type: Object as PropType<IDashboardDatasetDriver | null>, required: true } },
    data() {
        return {
            driver: null as IDashboardDatasetDriver | null
        }
    },
    computed: {
        currentDate(): Date | null {
            const value = this.driver?.parameterValue[0]?.value
            return value instanceof Date && !isNaN(value.getTime()) ? value : null
        },
        dateModel(): string | null {
            const date = this.currentDate
            if (!date) return null
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        },
        displayValue(): string {
            return this.currentDate ? luxonFormatDate(this.currentDate, undefined, undefined) : ''
        }
    },
    watch: {
        propDriver() {
            this.loadDriver()
        }
    },
    created() {
        this.loadDriver()
    },
    methods: {
        // The value stays a Date at local midnight, as the PrimeVue Calendar wrote it; clear writes null
        setDate(value: string | null) {
            if (!this.driver) return
            if (!value) {
                this.driver.parameterValue[0].value = null as any
                return
            }
            const [year, month, day] = value.split('-').map(Number)
            this.driver.parameterValue[0].value = new Date(year, month - 1, day)
        },
        loadDriver() {
            this.driver = this.propDriver
            if (this.driver && !this.driver.parameterValue[0]) {
                this.driver.parameterValue = [{ value: '', description: '' }]
            }

            if (this.driver && !(this.driver.parameterValue[0].value instanceof Date)) {
                this.driver.parameterValue[0].value = new Date(this.driver.parameterValue[0].value)
            }
        }
    }
})
</script>
