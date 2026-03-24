<template>
    <div class="parameter-card">
        <div v-if="parameter && !loading">
            <h2>{{ parameter.name }}</h2>
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                    <q-select
                        v-model="parameter.type"
                        dense
                        filled
                        :options="parameter.temporal ? triggerStrategies : triggerStrategies.slice(0, 2)"
                        option-label="label"
                        option-value="value"
                        emit-value
                        map-options
                        :label="$t('managers.scheduler.parameterValueType')"
                        @update:model-value="onParameterTypeChange"
                    />
                </div>
                <div v-if="parameter.type === 'fixed'" class="col-12 col-md-4">
                    <q-input v-if="!parameterValues.lov" v-model="parameter.value" dense filled :label="$t('common.values')" />
                    <q-select
                        v-else
                        v-model="parameter.selectedValues"
                        filled
                        multiple
                        use-chips
                        :options="parameterValues.lov"
                        option-label="description"
                        option-value="value"
                        emit-value
                        map-options
                        :label="$t('common.values')"
                        @update:model-value="formatSelectedValues"
                    />
                </div>
                <div v-else-if="parameter.type === 'loadAtRuntime'" class="col-12 col-md-4">
                    <q-select
                        v-model="parameter.value"
                        dense
                        filled
                        :options="rolesOptions"
                        option-label="role"
                        option-value="userAndRole"
                        emit-value
                        map-options
                        :label="$t('common.role')"
                    />
                </div>
                <div v-else-if="parameter.type === 'formula'" class="col-12 col-md-4">
                    <q-select
                        v-model="parameter.value"
                        dense
                        filled
                        :options="formulaOptions"
                        option-label="description"
                        option-value="name"
                        emit-value
                        map-options
                        :label="$t('managers.scheduler.selectFormula')"
                    />
                </div>
                <div class="col-12 col-md-4">
                    <q-select
                        v-model="parameter.iterative"
                        dense
                        filled
                        :options="triggerIterations"
                        option-label="label"
                        option-value="value"
                        emit-value
                        map-options
                        :label="$t('managers.scheduler.iterations')"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import axios from 'axios'

export default defineComponent({
    name: 'scheduler-document-parameter-form',
    components: {},
    props: { propParameter: { type: Object }, roles: { type: Array }, formulas: { type: Array }, documentLabel: { type: String } },
    emits: ['loading'],
    data() {
        return {
            parameter: null as any,
            triggerStrategies: [
                { value: 'fixed', label: this.$t('managers.scheduler.fixedValuesStrategy') },
                { value: 'loadAtRuntime', label: this.$t('managers.scheduler.loadAtRuntimeStrategy') },
                { value: 'formula', label: this.$t('managers.scheduler.useFormulaStrategy') }
            ],
            triggerIterations: [
                { value: true, label: this.$t('managers.scheduler.iterateOnParameterValues') },
                { value: false, label: this.$t('managers.scheduler.doNotIterateOnParameterValues') }
            ],
            parameterValues: {} as any,
            rolesOptions: [] as any[],
            formulaOptions: [],
            loading: false
        }
    },
    watch: {
        async propParameter() {
            this.loadParameter()
            await this.formatParameter()
        },
        roles() {
            this.loadRoles()
        },
        formulas() {
            this.loadFormulas()
        }
    },
    async created() {
        this.loadRoles()
        this.loadParameter()
        await this.formatParameter()
        this.loadFormulas()
    },
    methods: {
        loadParameter() {
            this.parameter = this.propParameter as any
        },
        async formatParameter() {
            if (this.parameter.type === 'fixed') {
                await this.loadParameterValues()
                if (this.parameterValues?.lov && this.parameter.value) {
                    this.parameter.selectedValues = this.parameter.value.split(';').map((el: any) => el.trim())
                }
            } else if (this.parameter.type === 'loadAtRuntime' && this.parameter.value) {
                for (let i = 0; i < this.rolesOptions.length; i++) {
                    if (this.parameter.value.endsWith(this.rolesOptions[i].role)) {
                        this.parameter.value = this.rolesOptions[i].userAndRole
                        break
                    }
                }
            }
        },
        async loadParameterValues() {
            this.loading = true
            this.$emit('loading', true)
            await axios
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documents/${this.documentLabel}/parameters/${this.parameter?.id}/values?role=${this.parameter?.role}`)
                .then((response) => (this.parameterValues = response.data))
                .catch(() => {})
            this.$emit('loading', false)
            this.loading = false
        },
        loadRoles() {
            this.rolesOptions = this.roles as any
        },
        loadFormulas() {
            this.formulaOptions = this.formulas as any
        },
        formatSelectedValues() {
            this.parameter.value = ''
            for (let i = 0; i < this.parameter.selectedValues.length; i++) {
                this.parameter.value += this.parameter.selectedValues[i]
                this.parameter.value += i === this.parameter.selectedValues.length - 1 ? ' ' : '; '
            }
        },
        async onParameterTypeChange() {
            this.parameter.value = ''
            this.parameter.selectedValues = []
            if (this.parameter.type === 'fixed') {
                await this.loadParameterValues()
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.parameter-card {
    padding: 0;
}
</style>
