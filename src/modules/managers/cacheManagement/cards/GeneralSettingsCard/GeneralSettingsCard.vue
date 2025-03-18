<template>
    <Card class="p-m-2">
        <template #header>
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>{{ $t('managers.cacheManagement.generalSettings') }}</q-toolbar-title>

                <q-btn flat round dense icon="save" data-test="save-button" @click="save">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="backspace" data-test="reset-button" @click="discardChanges">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.clear') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
        </template>
        <template #content>
            <q-expansion-item default-opened dense icon="fas fa-database" :label="$t('common.data')" class="q-mt-sm bg-grey-2">
                <q-btn-toggle
                    v-model="settings.scheduledModality"
                    class="q-ma-sm"
                    toggle-color="primary"
                    :options="[
                        { label: $t('common.update'), value: true },
                        { label: $t('common.delete'), value: false }
                    ]"
                />
                <div class="row q-col-gutter-sm q-px-sm q-pt-sm">
                    <q-select
                        class="col-6"
                        filled
                        map-options
                        options-dense
                        v-model="settings.schedulingFullClean"
                        :options="generalSettingsCardDescriptor.schedulingTypes"
                        :option-label="(item) => $t(item.label)"
                        option-value="value"
                        :label="settings.scheduledModality ? $t('managers.cacheManagement.frequencyOfUpdatingDaemon') : $t('managers.cacheManagement.frequencyOfCleaningDaemon')"
                    />
                    <q-select class="col-6" filled emit-value map-options options-dense v-model="datasource" :options="datasourceOptions" option-label="label" option-value="value" :label="$t('managers.cacheManagement.targetDatasource')" />
                    <q-input filled class="col-4 col-lg-3" v-model.trim="settings.prefixForCacheTablesName" :label="$t('managers.cacheManagement.prefixForCacheTablesName')" data-test="prefix-input" />
                    <q-input filled class="col-4 col-lg-3" type="number" v-model.trim="settings.limitForClean" :min="0" :maxlength="100" suffix="%" :label="$t('managers.cacheManagement.maximumPercentOfCacheCleaningQuota')" data-test="clean-limit-input" />
                    <q-input
                        filled
                        class="col-4 col-lg-3"
                        type="number"
                        v-model.trim="settings.spaceAvailable"
                        :min="0"
                        :suffix="formatCacheDimension(settings.spaceAvailable)"
                        :label="$t('managers.cacheManagement.totalBytesAvailableForCache')"
                        data-test="space-available-input"
                        @update:model-value="(value) => onInputNumberChange('spaceAvailable', value)"
                    />
                    <q-input
                        filled
                        class="col-4 col-lg-3"
                        type="number"
                        v-model.trim="settings.cacheLimitForStore"
                        :min="0"
                        :maxlength="100"
                        suffix="%"
                        :label="$t('managers.cacheManagement.cacheDimensionSingleDataset')"
                        data-test="cache-limit-input"
                        @update:model-value="(value) => onInputNumberChange('cacheLimitForStore', value)"
                    />
                </div>
            </q-expansion-item>

            <q-expansion-item dense icon="timer" :label="$t('managers.scheduler.timing')" class="q-mt-sm bg-grey-2">
                <div class="row q-col-gutter-sm q-px-sm q-pt-sm">
                    <q-input dense class="col-4" v-model.trim="settings.lastAccessTtl" type="number" filled :label="$t('managers.cacheManagement.ttlForCachedDataset')" @update:model-value="(value) => onInputNumberChange('lastAccessTtl', value)"></q-input>
                    <q-input dense class="col-4" v-model.trim="settings.createAndPersistTimeout" type="number" filled :label="$t('managers.cacheManagement.timeToCreateTempTable')" @update:model-value="(value) => onInputNumberChange('createAndPersistTimeout', value)"></q-input>
                    <q-input dense class="col-4" v-model.trim="settings.sqldbCacheTimeout" type="number" filled :label="$t('managers.cacheManagement.timeToLock')" @update:model-value="(value) => onInputNumberChange('sqldbCacheTimeout', value)"></q-input>
                    <q-input dense class="col-4" v-model.trim="settings.hazelcastTimeout" type="number" filled :label="$t('managers.cacheManagement.hazelcastTimeToLock')" @update:model-value="(value) => onInputNumberChange('hazelcastTimeout', value)"></q-input>
                    <q-input dense class="col-4" v-model.trim="settings.hazelcastLeaseTime" type="number" filled :label="$t('managers.cacheManagement.hazelcastTimeToReleaseLock')" @update:model-value="(value) => onInputNumberChange('hazelcastLeaseTime', value)"></q-input>
                </div>
            </q-expansion-item>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iSettings } from '../../CacheManagement'
import generalSettingsCardDescriptor from './GeneralSettingsCardDescriptor.json'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'general-settings-card',
    props: {
        item: {
            type: Object,
            required: true
        },
        datasources: {
            type: Array,
            required: true
        },
        selectedDatasource: {
            value: [Object, null],
            required: true
        }
    },
    emits: ['inserted'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            generalSettingsCardDescriptor,
            settings: {} as iSettings,
            datasource: {},
            datasourceOptions: []
        }
    },
    watch: {
        item() {
            this.loadSettings()
        },
        datasources() {
            this.loadDatasources()
        },
        selectedDatasource() {
            this.loadDatasource()
        }
    },
    created() {
        this.loadSettings()
        this.loadDatasources()
        this.loadDatasource()
    },
    methods: {
        loadSettings() {
            this.settings = { ...this.item } as iSettings
            if (typeof this.settings.scheduledModality === 'undefined') this.settings.scheduledModality = false
        },
        loadDatasources() {
            this.datasourceOptions = this.datasources as []
        },
        loadDatasource() {
            this.datasource = { ...(this.selectedDatasource as Object) }
        },
        async save() {
            await this.saveDatasource()
            await this.saveConfigurationOptions()

            this.store.setInfo({
                title: this.$t('common.toast.success'),
                msg: this.$t('common.toast.updateTitle')
            })
            this.$emit('inserted')
        },
        async saveConfigurationOptions() {
            const configurations = [
                { label: 'SPAGOBI.CACHE.NAMEPREFIX', value: this.settings.prefixForCacheTablesName },
                { label: 'SPAGOBI.CACHE.SPACE_AVAILABLE', value: this.settings.spaceAvailable * 1048576 },
                { label: 'SPAGOBI.CACHE.LIMIT_FOR_CLEAN', value: this.settings.limitForClean },
                { label: 'SPAGOBI.CACHE.SCHEDULING_FULL_CLEAN', value: this.settings.schedulingFullClean.value, id: this.settings.schedulingFullClean.value },
                { label: 'SPAGOBI.CACHE.LIMIT_FOR_STORE', value: this.settings.cacheLimitForStore },
                { label: 'SPAGOBI.CACHE.DS_LAST_ACCESS_TTL', value: this.settings.lastAccessTtl },
                { label: 'SPAGOBI.CACHE.CREATE_AND_PERSIST_TABLE.TIMEOUT', value: this.settings.createAndPersistTimeout },
                { label: 'SPAGOBI.WORKMANAGER.SQLDBCACHE.TIMEOUT', value: this.settings.sqldbCacheTimeout },
                { label: 'SPAGOBI.CACHE.HAZELCAST.TIMEOUT', value: this.settings.hazelcastTimeout },
                { label: 'SPAGOBI.CACHE.HAZELCAST.LEASETIME', value: this.settings.hazelcastLeaseTime },
                { label: 'SPAGOBI.CACHE.REFRESH', value: this.settings.scheduledModality }
            ]

            await this.$http
                .put(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/conf', { configurations: configurations })
                .then()
                .catch((error) => {
                    console.log(error)
                })
        },
        async saveDatasource() {
            await this.$http.put(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/datasources', { ...this.datasource, writeDefault: true })
        },
        onInputNumberChange(field: string, value: number) {
            this.settings[field] = value
        },
        discardChanges() {
            this.loadSettings()
            this.loadDatasource()
        },
        formatCacheDimension(size: number) {
            if (isNaN(size)) return 0
            if (size < 1024) return size.toFixed(2) + ' MB'
            size /= 1024
            if (size < 1024) return '~' + size.toFixed(2) + ' GB'
            size /= 1024
            return '~' + size.toFixed(2) + ' TB'
        }
    }
})
</script>

<style lang="scss" scoped>
::v-deep(.p-toolbar-group-right) {
    height: 100%;
}

#prefix-input-container {
    margin-top: 1.2rem;
    margin-bottom: 2.2rem;
}

.small-label {
    font-size: 0.9rem;
}

#spaceAvailable-hint {
    font-size: 0.6rem;
}
</style>
