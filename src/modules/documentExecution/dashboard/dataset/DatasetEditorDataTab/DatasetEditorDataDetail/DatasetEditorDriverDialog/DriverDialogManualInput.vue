<!-- eslint-disable vue/valid-v-model -->
<template>
    <div v-if="driver && driver.parameterValue" class="q-pa-md">
        <q-input v-model="driver.parameterValue[0].value as string" :type="driver.type === 'NUM' ? 'number' : 'text'" :label="$t('common.value')" outlined dense hide-bottom-space autofocus data-test="driver-manual-input" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardDatasetDriver } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'driver-dialog-manual-input',
    components: {},
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
            if (this.driver && !this.driver.parameterValue[0]) {
                this.driver.parameterValue = [{ value: '', description: '' }]
            }
        }
    }
})
</script>
