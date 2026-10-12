<template>
    <div v-if="driver" class="q-pa-md">
        <q-option-group v-if="!driver.multivalue && driver.parameterValue" v-model="driver.parameterValue[0].value" :options="groupOptions" type="radio" @update:model-value="setRadioButtonValue" />
        <q-option-group v-if="driver.multivalue && driver.parameterValue" v-model="checkedValues" :options="groupOptions" type="checkbox" @update:model-value="setCheckboxValue" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardDatasetDriver } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'driver-dialog-list',
    props: { propDriver: { type: Object as PropType<IDashboardDatasetDriver | null>, required: true } },
    data() {
        return {
            driver: null as IDashboardDatasetDriver | null,
            checkedValues: [] as string[]
        }
    },
    computed: {
        groupOptions(): { label: string; value: string }[] {
            return (this.driver?.options ?? []).map((option: { value: string; description: string }) => ({ label: option.description, value: option.value }))
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
        loadDriver() {
            this.driver = this.propDriver
            if (this.driver?.multivalue) {
                this.checkedValues = this.driver.parameterValue.map((parameterValue: { value: string | number | Date; description: string }) => parameterValue.value as string)
            }
        },
        setRadioButtonValue() {
            if (!this.driver || !this.driver.options) return
            this.driver.parameterValue[0].description = this.getDescriptionForTheValue(this.driver?.parameterValue[0].value as string) as string
        },
        setCheckboxValue() {
            if (!this.driver) return
            this.driver.parameterValue = []
            this.checkedValues.forEach((checkedValue: string) => {
                this.driver?.parameterValue.push({ value: checkedValue, description: this.getDescriptionForTheValue(checkedValue) as string })
            })
        },
        getDescriptionForTheValue(value: string) {
            if (!this.driver || !this.driver.options) return
            const index = this.driver.options.findIndex((option: { value: string; description: string }) => option.value === value)
            return index !== -1 ? this.driver.options[index].description : ''
        }
    }
})
</script>
