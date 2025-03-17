<template>
    <q-expansion-item dense v-model="expanded" icon="settings" :label="$t('managers.dataSourceManagement.form.advancedOptions.title')" class="q-mt-sm bg-grey-2">
        <div class="row q-col-gutter-sm q-px-sm q-pt-sm">
            <q-input
                class="col"
                v-model.trim="v$.jdbcPoolConfiguration.maxTotal.$model"
                dense
                filled
                :error="v$.jdbcPoolConfiguration.maxTotal.$invalid && v$.jdbcPoolConfiguration.maxTotal.$dirty"
                :label="$t('managers.dataSourceManagement.form.advancedOptions.maxTotal') + '*'"
                type="number"
                :disable="readOnly"
                max-length="20"
                @update:model-value="onFieldChange('maxTotal', $event)"
            >
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.maxTotalInfo') }}
                </q-tooltip>
            </q-input>
            <q-input
                class="col"
                v-model.trim="v$.jdbcPoolConfiguration.maxWait.$model"
                :disable="readOnly"
                dense
                filled
                :error="v$.jdbcPoolConfiguration.maxWait.$invalid && v$.jdbcPoolConfiguration.maxWait.$dirty"
                :label="$t('managers.dataSourceManagement.form.advancedOptions.maxWait') + '*'"
                type="number"
                max-length="20"
                @update:model-value="onFieldChange('maxWait', $event)"
            >
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.maxWaitInfo') }}
                </q-tooltip>
            </q-input>
            <q-input class="col" v-model.trim="jdbcPoolConfiguration.maxIdle" :disable="readOnly" dense filled :label="$t('managers.dataSourceManagement.form.advancedOptions.maxIdle')" type="number" max-length="20" @update:model-value="onFieldChange('maxIdle', $event)">
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.maxIdleInfo') }}
                </q-tooltip>
            </q-input>
            <q-input
                class="col"
                v-model.trim="v$.jdbcPoolConfiguration.abandonedTimeout.$model"
                :error="v$.jdbcPoolConfiguration.abandonedTimeout.$invalid && v$.jdbcPoolConfiguration.abandonedTimeout.$dirty"
                :disable="readOnly"
                dense
                filled
                :label="$t('managers.dataSourceManagement.form.advancedOptions.abandonedTimeout') + '*'"
                type="number"
                max-length="20"
                @update:model-value="onFieldChange('abandonedTimeout', $event)"
            >
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.abandonedTimeoutInfo') }}
                </q-tooltip>
            </q-input>
            <q-input
                class="col"
                v-model.trim="v$.jdbcPoolConfiguration.timeBetweenEvictionRuns.$model"
                :error="v$.jdbcPoolConfiguration.timeBetweenEvictionRuns.$invalid && v$.jdbcPoolConfiguration.timeBetweenEvictionRuns.$dirty"
                :disable="readOnly"
                dense
                filled
                :label="$t('managers.dataSourceManagement.form.advancedOptions.timeBetweenEvictionRuns') + '*'"
                type="number"
                max-length="30"
                @update:model-value="onFieldChange('timeBetweenEvictionRuns', $event)"
            >
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.timeBetweenEvictionRunsInfo') }}
                </q-tooltip>
            </q-input>
            <q-input
                class="col"
                v-model.trim="v$.jdbcPoolConfiguration.minEvictableIdleTimeMillis.$model"
                :error="v$.jdbcPoolConfiguration.timeBetweenEvictionRuns.$invalid && v$.jdbcPoolConfiguration.minEvictableIdleTimeMillis.$dirty"
                :disable="readOnly"
                dense
                filled
                :label="$t('managers.dataSourceManagement.form.advancedOptions.minEvictableIdleTimeMillis') + '*'"
                type="number"
                max-length="30"
                @update:model-value="onFieldChange('minEvictableIdleTimeMillis', $event)"
            >
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.minEvictableIdleTimeMillisInfo') }}
                </q-tooltip>
            </q-input>
        </div>
        <div class="row q-col-gutter-sm q-px-sm q-pb-sm">
            <q-input class="col-9" v-model.trim="jdbcPoolConfiguration.validationQuery" :disable="readOnly" dense filled :label="$t('managers.dataSourceManagement.form.advancedOptions.validationQuery')" max-length="200" @update:model-value="onFieldChange('validationQueryTimeout', $event)"></q-input>
            <q-input
                class="col-3"
                v-model.trim="jdbcPoolConfiguration.validationQuery"
                :disable="readOnly"
                dense
                filled
                :label="$t('managers.dataSourceManagement.form.advancedOptions.validationQueryTimeout')"
                type="number"
                max-length="30"
                @update:model-value="onFieldChange('validationQueryTimeout', $event)"
            >
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.validationQueryTimeoutInfo') }}
                </q-tooltip>
            </q-input>
        </div>
        <div class="row q-col-gutter-sm q-px-sm q-pb-sm">
            <q-checkbox v-model="jdbcPoolConfiguration.removeAbandonedOnBorrow" size="sm" :disable="readOnly" :label="$t('managers.dataSourceManagement.form.advancedOptions.removeAbandonedOnBorrow')" @update:model-value="onFieldChange('removeAbandonedOnBorrow', $event)">
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.removeAbandonedOnBorrowInfo') }}
                </q-tooltip>
            </q-checkbox>
            <q-checkbox v-model="jdbcPoolConfiguration.removeAbandonedOnMaintenance" size="sm" :disable="readOnly" :label="$t('managers.dataSourceManagement.form.advancedOptions.removeAbandonedOnMaintenance')" @update:model-value="onFieldChange('removeAbandonedOnMaintenance', $event)">
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.removeAbandonedOnMaintenanceInfo') }}
                </q-tooltip>
            </q-checkbox>
            <q-checkbox v-model="jdbcPoolConfiguration.logAbandoned" size="sm" :disable="readOnly" :label="$t('managers.dataSourceManagement.form.advancedOptions.logAbandoned')" @update:model-value="onFieldChange('logAbandoned', $event)">
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.logAbandonedInfo') }}
                </q-tooltip>
            </q-checkbox>
            <q-checkbox v-model="jdbcPoolConfiguration.testOnReturn" size="sm" :disable="readOnly" :label="$t('managers.dataSourceManagement.form.advancedOptions.testOnReturn')" @update:model-value="onFieldChange('testOnReturn', $event)">
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.testOnReturnInfo') }}
                </q-tooltip>
            </q-checkbox>
            <q-checkbox v-model="jdbcPoolConfiguration.testWhileIdle" size="sm" :disable="readOnly" :label="$t('managers.dataSourceManagement.form.advancedOptions.testWhileIdle')" @update:model-value="onFieldChange('testWhileIdle', $event)">
                <q-tooltip :delay="500">
                    {{ $t('managers.dataSourceManagement.form.advancedOptions.testWhileIdleInfo') }}
                </q-tooltip>
            </q-checkbox>
        </div>
    </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import dataSourceDetailValidationDescriptor from '../DataSourceTabView/DataSourceDetailValidationDescriptor.json'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'

export default defineComponent({
    name: 'detail-tab',
    components: {
        KnValidationMessages
    },
    props: {
        advancedOptions: {
            type: Object,
            requried: false
        },
        isReadOnly: Boolean
    },
    emits: ['fieldChanged'],
    data() {
        return {
            v$: useValidate() as any,
            dataSourceDetailValidationDescriptor,
            jdbcPoolConfiguration: {} as any,
            readOnly: false,
            expanded: false
        }
    },
    validations() {
        return {
            jdbcPoolConfiguration: createValidations('jdbcPoolConfiguration', dataSourceDetailValidationDescriptor.validations.jdbcPoolConfiguration)
        }
    },
    watch: {
        advancedOptions() {
            this.v$.$reset()
            this.setAdvancedOptions()
        },
        isReadOnly() {
            this.readOnly = this.isReadOnly
        }
    },
    async created() {
        if (this.advancedOptions) {
            this.setAdvancedOptions()
        }
        this.readOnly = this.isReadOnly
    },
    methods: {
        onFieldChange(fieldName: string, value: any) {
            this.$emit('fieldChanged', { fieldName, value })
        },
        setAdvancedOptions() {
            this.jdbcPoolConfiguration = { ...this.advancedOptions } as any
            if (typeof this.jdbcPoolConfiguration.removeAbandonedOnBorrow === 'undefined') this.jdbcPoolConfiguration.removeAbandonedOnBorrow = true
            if (typeof this.jdbcPoolConfiguration.removeAbandonedOnMaintenance === 'undefined') this.jdbcPoolConfiguration.removeAbandonedOnMaintenance = true
            if (typeof this.jdbcPoolConfiguration.logAbandoned === 'undefined') this.jdbcPoolConfiguration.logAbandoned = true
            if (typeof this.jdbcPoolConfiguration.testOnReturn === 'undefined') this.jdbcPoolConfiguration.testOnReturn = true
            if (typeof this.jdbcPoolConfiguration.testWhileIdle === 'undefined') this.jdbcPoolConfiguration.testWhileIdle = true
            if (typeof this.jdbcPoolConfiguration.maxTotal === 'undefined') this.jdbcPoolConfiguration.maxTotal = 100
            if (typeof this.jdbcPoolConfiguration.maxWait === 'undefined') this.jdbcPoolConfiguration.maxWait = 10
            if (typeof this.jdbcPoolConfiguration.maxIdle === 'undefined') this.jdbcPoolConfiguration.maxIdle = 30
            if (typeof this.jdbcPoolConfiguration.abandonedTimeout === 'undefined') this.jdbcPoolConfiguration.abandonedTimeout = 300
            if (typeof this.jdbcPoolConfiguration.timeBetweenEvictionRuns === 'undefined') this.jdbcPoolConfiguration.timeBetweenEvictionRuns = 300
            if (typeof this.jdbcPoolConfiguration.minEvictableIdleTimeMillis === 'undefined') this.jdbcPoolConfiguration.minEvictableIdleTimeMillis = 300
        }
    }
})
</script>
