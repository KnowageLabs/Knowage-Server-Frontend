<template>
    <div class="kn-ws-wizard-step">
        <div class="kn-ws-dialog-section-title">{{ $t('workspace.wizard.details') }}</div>
        <div class="kn-ws-dialog-form">
            <q-input v-model="dataset.name" outlined dense autofocus hide-bottom-space maxlength="50" class="kn-ws-dialog-form__full" :label="$t('common.name') + ' *'" :rules="[(v) => !!v?.trim() || $t('common.validation.required', { fieldName: $t('common.name') })]" lazy-rules data-ws-wizard-name />
            <q-input v-model="dataset.description" outlined dense type="textarea" rows="2" hide-bottom-space maxlength="50" class="kn-ws-dialog-form__full" :label="$t('common.description')" />
        </div>

        <div class="kn-ws-dialog-section-title">{{ $t('workspace.wizard.persistence') }}</div>
        <div class="kn-ws-wizard-persist">
            <q-toggle v-model="dataset.persist" :label="$t('workspace.wizard.persistLabel')" />
            <q-input v-if="dataset.persist" v-model="dataset.tableName" outlined dense hide-bottom-space maxlength="50" :label="$t('managers.datasetManagement.persistTableName') + ' *'" :rules="[(v) => !!v || $t('common.validation.required', { fieldName: $t('managers.datasetManagement.persistTableName') }), (v) => !v || alphanumericNoSpaces.test(v) || $t('common.validation.regex')]" lazy-rules />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { alphanumericNoSpaces } from '@/helpers/commons/regexHelper'

// Ported from views/dataView/datasetWizard/WorkspaceDatasetWizardStepFour.vue: name, description, persist and table name.
const props = defineProps<{ selectedDataset: any }>()
const dataset = computed(() => props.selectedDataset)
</script>
