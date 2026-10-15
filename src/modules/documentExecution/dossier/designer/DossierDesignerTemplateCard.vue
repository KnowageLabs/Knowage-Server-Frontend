<template>
    <q-card class="dossier-designer-card" data-test="dossier-template-card">
        <q-card-section class="dossier-designer-card__header row items-center no-wrap">
            <div class="kn-editor-card-label">{{ $t('documentExecution.dossier.designer.template') }}</div>
            <q-badge v-if="template.name" outline color="grey-7" class="dossier-designer-card__badge q-ml-sm" data-test="template-type">{{ $t(template.type === 'DOC_TEMPLATE' ? 'documentExecution.dossier.typeDoc' : 'documentExecution.dossier.typePpt') }}</q-badge>
            <q-space />
            <q-btn flat dense no-caps size="sm" color="primary" icon="image_search" :label="$t('documentExecution.dossier.designer.findPlaceholders')" :disable="!canScan" :loading="scanning" class="dossier-designer-card__action" data-test="scan-button" @click="emit('scan')" />
            <span v-if="showRun" class="q-ml-xs">
                <q-btn flat dense no-caps size="sm" color="accent" icon="play_arrow" :label="$t('documentExecution.dossier.designer.run')" :disable="!!runDisabledReason" class="dossier-designer-card__action" data-test="run-button" @click="emit('run')" />
                <q-tooltip v-if="runDisabledReason" :delay="500">{{ $t(runDisabledReason) }}</q-tooltip>
            </span>
        </q-card-section>
        <q-separator />
        <q-card-section class="dossier-template">
            <q-input :model-value="template.name" :label="$t('documentExecution.dossier.designerDialog.templateFile') + ' *'" readonly outlined dense stack-label hide-bottom-space :error="!!template.name && !nameValid" class="cursor-pointer" data-test="template-file" @click="emit('pickFile')">
                <template #prepend>
                    <q-icon name="description" size="18px" />
                </template>
                <template #append>
                    <q-btn flat round dense size="sm" icon="upload" class="kn-editor-action" data-test="upload-button" @click.stop="emit('pickFile')">
                        <q-tooltip :delay="500">{{ $t('documentExecution.documentDetails.info.uploadTemplate') }}</q-tooltip>
                    </q-btn>
                </template>
            </q-input>
            <q-input v-model="template.prefix" :label="$t('dashboard.widgetEditor.prefix') + ' *'" outlined dense stack-label hide-bottom-space maxlength="100" :error="prefixTouched && !prefixValid" data-test="template-prefix" @blur="prefixTouched = true">
                <template #append>
                    <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                        <q-tooltip max-width="300px">{{ $t('documentExecution.dossier.designerDialog.prefixHint') }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>
            <div class="dossier-template__toggles">
                <div class="row items-center no-wrap">
                    <q-toggle v-model="template.uploadable" dense :label="$t('documentExecution.dossier.designerDialog.uploadable')" data-test="uploadable-toggle" />
                    <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5 q-ml-xs">
                        <q-tooltip max-width="300px">{{ $t('documentExecution.dossier.designerDialog.uploadableHint') }}</q-tooltip>
                    </q-icon>
                </div>
                <div class="row items-center no-wrap">
                    <q-toggle v-model="template.downloadable" dense :label="$t('documentExecution.dossier.designerDialog.downloadable')" data-test="downloadable-toggle" />
                    <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5 q-ml-xs">
                        <q-tooltip max-width="300px">{{ $t('documentExecution.dossier.designerDialog.downloadableHint') }}</q-tooltip>
                    </q-icon>
                </div>
            </div>
        </q-card-section>
        <q-banner v-if="needsScan" dense class="dossier-template__banner q-mx-md q-mb-md" data-test="rescan-banner">
            <template #avatar>
                <q-icon name="warning" size="20px" />
            </template>
            {{ $t('documentExecution.dossier.designer.rescanNeeded') }}
        </q-banner>
    </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { iDossierTemplate } from './DossierTemplate'

defineProps<{
    template: iDossierTemplate
    nameValid: boolean
    prefixValid: boolean
    canScan: boolean
    scanning: boolean
    needsScan: boolean
    showRun: boolean
    runDisabledReason: string | null
}>()
const emit = defineEmits<{ (e: 'pickFile'): void; (e: 'scan'): void; (e: 'run'): void }>()

const prefixTouched = ref(false)
</script>

<style lang="scss" scoped>
.dossier-template {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;

    &__toggles {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    &__banner {
        background-color: var(--kn-message-warning-background-color);
        color: var(--kn-message-warning-color);
        border-radius: 4px;
    }
}

@media (max-width: 900px) {
    .dossier-template {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

        &__toggles {
            grid-column: 1 / -1;
        }
    }
}
</style>
