<template>
    <div v-if="driver && driver.parameterValue" class="q-pa-md">
        <q-select v-if="driver.multivalue" v-model="driver.parameterValue" :options="driver.options" option-label="description" option-value="value" multiple use-chips outlined dense hide-bottom-space options-dense :label="$t('common.value')" />
        <q-select v-else v-model="driver.parameterValue[0].value" :options="driver.options" option-label="description" option-value="value" emit-value map-options outlined dense hide-bottom-space options-dense :label="$t('common.value')" @update:model-value="onDropdownChange" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardDatasetDriver } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'driver-dialog-dropdown',
    props: { propDriver: { type: Object as PropType<IDashboardDatasetDriver | null>, required: true } },
    data() {
        return {
            driver: null as IDashboardDatasetDriver | null
        }
    },
    computed: {},
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
        },
        onDropdownChange() {
            if (!this.driver) return
            this.updateDriverDescriptionOnDropdownChange()
        },
        updateDriverDescriptionOnDropdownChange() {
            if (!this.driver || !this.driver.parameterValue[0] || !this.driver.options) return
            const index = this.driver.options.findIndex((option: { value: string; description: string }) => option.value === this.driver?.parameterValue[0].value)
            if (index !== -1) this.driver.parameterValue[0].description = this.driver.options[index].description
        }
    }
})
</script>
