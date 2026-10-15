<template>
    <div class="dossier-detail" data-test="placeholder-detail">
        <q-card class="dossier-designer-card">
            <q-card-section class="dossier-designer-card__header row items-center no-wrap">
                <div class="kn-editor-card-label col ellipsis">{{ placeholder.imageName }}</div>
            </q-card-section>
            <q-separator />
            <q-card-section class="column q-gutter-y-sm">
                <q-banner v-if="!placeholder.label" dense class="dossier-detail__info" data-test="link-hint">
                    <template #avatar>
                        <q-icon name="info" size="20px" />
                    </template>
                    {{ $t('documentExecution.dossier.designerDialog.linkToDocumentHint') }}<template v-if="mode === 'details'">{{ $t('documentExecution.dossier.designerDialog.linkToDocumentDriverPart') }}</template>
                </q-banner>
                <q-input :model-value="placeholder.label ?? ''" :label="$t(placeholder.viewId ? 'common.view' : 'common.document')" readonly outlined dense stack-label hide-bottom-space class="cursor-pointer" data-test="linked-document" @click="emit('link')">
                    <template #append>
                        <q-btn flat round dense size="sm" icon="add_link" class="kn-editor-action" data-test="link-button" @click.stop="emit('link')">
                            <q-tooltip :delay="500">{{ $t('managers.crossNavigationManagement.selectDocument') }}</q-tooltip>
                        </q-btn>
                        <q-btn v-if="placeholder.label" flat round dense size="sm" icon="link_off" class="kn-editor-action" data-test="reset-button" @click.stop="emit('reset')">
                            <q-tooltip :delay="500">{{ $t('documentExecution.dossier.designerDialog.resetPlaceholder') }}</q-tooltip>
                        </q-btn>
                    </template>
                </q-input>
            </q-card-section>
        </q-card>

        <template v-if="placeholder.label">
            <q-card v-if="sheetCount > 1" class="dossier-designer-card" data-test="sheet-card">
                <q-card-section class="dossier-designer-card__header row items-center no-wrap">
                    <div class="kn-editor-card-label">{{ $t('documentExecution.dossier.designerDialog.defineSheet') }}</div>
                </q-card-section>
                <q-separator />
                <q-card-section>
                    <q-select :model-value="placeholder.sheetNumber ?? 1" :options="sheetOptions" :label="$t('documentExecution.dossier.designerDialog.sheetNumber')" emit-value map-options outlined dense stack-label hide-bottom-space options-dense @update:model-value="placeholder.sheetNumber = $event" />
                </q-card-section>
            </q-card>

            <q-card class="dossier-designer-card" data-test="image-settings-card">
                <q-card-section class="dossier-designer-card__header row items-center no-wrap">
                    <div class="kn-editor-card-label">{{ $t('documentExecution.dossier.designer.imageSettings') }}</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="dossier-detail__sizes">
                    <q-input v-model.number="placeholder.sheetWidth" type="number" :label="$t('documentExecution.dossier.designerDialog.sheetWidth')" outlined dense stack-label hide-bottom-space min="1" />
                    <q-input v-model.number="placeholder.sheetHeight" type="number" :label="$t('documentExecution.dossier.designerDialog.sheetHeight')" outlined dense stack-label hide-bottom-space min="1" />
                    <q-input v-model.number="placeholder.deviceScaleFactor" type="number" :label="$t('documentExecution.dossier.designerDialog.deviceScaleFactor')" outlined dense stack-label hide-bottom-space min="0" max="3" step="0.5" />
                </q-card-section>
            </q-card>

            <q-card v-if="mode === 'details' && placeholder.parameters?.length" class="dossier-designer-card" data-test="drivers-card">
                <div class="dossier-grid">
                    <div class="dossier-grid__row dossier-grid__row--header kn-editor-card-label">
                        <div class="row items-center no-wrap">
                            {{ $t('documentExecution.documentDetails.drivers.title') }}
                            <q-icon name="info" size="14px" class="kn-editor-card-hint q-ml-xs">
                                <q-tooltip :delay="300" max-width="360px"><span v-html="$t('documentExecution.dossier.designerDialog.driversHelp.hint')"></span></q-tooltip>
                            </q-icon>
                        </div>
                        <div>{{ $t('documentExecution.dossier.designerDialog.driverLinkType') }}</div>
                        <div>{{ $t('common.value') }}</div>
                    </div>
                    <div v-for="driver in placeholder.parameters" :key="getDossierDriverParameterUrlName(driver)" class="dossier-grid__row" data-test="driver-row">
                        <q-input :model-value="driver.label ?? getDossierDriverParameterUrlName(driver)" readonly outlined dense hide-bottom-space class="kn-field-compact">
                            <q-tooltip :delay="500">{{ $t('documentExecution.dossier.designerDialog.documentDriver', { driver: getDossierDriverParameterUrlName(driver) }) }}</q-tooltip>
                        </q-input>
                        <q-select :model-value="getDossierDriverLinkType(driver) ?? null" :options="driverTypeOptions" emit-value map-options outlined dense hide-bottom-space options-dense :error="!getDossierDriverLinkType(driver)" class="kn-field-compact" data-test="driver-type" @update:model-value="driver.type = $event" />
                        <q-input v-if="getDossierDriverLinkType(driver) === 'static'" v-model="driver.value" outlined dense hide-bottom-space class="kn-field-compact" data-test="driver-static-value" />
                        <q-select
                            v-else-if="getDossierDriverLinkType(driver) === 'dynamic'"
                            :model-value="getDossierDynamicDriverUrlName(driver) ?? null"
                            :options="dossierDrivers"
                            option-label="label"
                            option-value="parameterUrlName"
                            emit-value
                            map-options
                            outlined
                            dense
                            hide-bottom-space
                            options-dense
                            :placeholder="$t('documentExecution.dossier.designerDialog.dossierDriverName')"
                            class="kn-field-compact"
                            data-test="driver-dynamic-value"
                            @update:model-value="driver.dossierUrlName = $event"
                        />
                        <div v-else></div>
                    </div>
                </div>
            </q-card>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { iPlaceholder } from './DossierTemplate'
import { getDossierDriverLinkType, getDossierDriverParameterUrlName, getDossierDynamicDriverUrlName } from './DossierDesignerDriversHelper'
import descriptor from './DossierDesignerDescriptor.json'

const props = defineProps<{ placeholder: iPlaceholder; mode: 'details' | 'workspace'; sheetCount: number; dossierDrivers: any[] }>()
const emit = defineEmits<{ (e: 'link'): void; (e: 'reset'): void }>()
const { t } = useI18n()

const driverTypeOptions = computed(() => descriptor.driverTypes.map((type) => ({ value: type.code, label: t(type.label) })))
const sheetOptions = computed(() => Array.from({ length: props.sheetCount }, (_, index) => ({ label: `${index + 1}`, value: index + 1 })))
</script>

<style lang="scss" scoped>
.dossier-detail {
    display: flex;
    flex-direction: column;
    gap: 16px;

    &__info {
        background-color: var(--kn-message-info-background-color);
        color: var(--kn-message-info-color);
        border-radius: 4px;
    }

    &__sizes {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
    }
}

.dossier-grid {
    &__row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 160px minmax(0, 1.5fr);
        gap: 8px;
        align-items: center;
        min-height: 44px;
        padding: 6px 12px;

        &:not(:last-child) {
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        &:not(.dossier-grid__row--header):hover {
            background-color: var(--kn-editor-row-hover-background);
        }

        &--header {
            min-height: 0;
            padding-top: 8px;
            padding-bottom: 4px;
        }

        :deep(.q-field--outlined .q-field__control) {
            background-color: var(--kn-editor-panel-background);
        }
    }
}
</style>
