<template>
    <!-- The edit dialog (spec D7 = E2, 8.2): the WorkspaceDialog shell and form grid, labels inside the fields. -->
    <WorkspaceDialog :model-value="modelValue" :title="title" name="domain" size="md" :persistent="!readOnly" @update:model-value="emit('update:modelValue', $event)" @show="reset">
        <div class="kn-ws-dialog-form">
            <q-select
                v-if="isNew"
                v-model="form.domain"
                outlined
                dense
                hide-bottom-space
                emit-value
                map-options
                use-input
                input-debounce="0"
                class="kn-ws-dialog-form__full"
                :label="$t('managers.domainsManagement.domain') + ' *'"
                :options="domainOptions"
                :rules="[(value) => !!value || requiredMessage('managers.domainsManagement.domain')]"
                data-mgr-field="domain"
                @filter="filterDomains"
            />
            <q-input v-else :model-value="`${row?.domainName} · ${row?.domainCode}`" outlined dense hide-bottom-space readonly class="kn-ws-dialog-form__full" :label="$t('managers.domainsManagement.domain')" data-mgr-field="domain">
                <template #prepend><q-icon name="sym_o_lock" size="18px" /></template>
                <template #append>
                    <q-icon name="info" color="grey" size="xs">
                        <q-tooltip>{{ $t('managers.domainsManagement.keyLocked') }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>

            <template v-if="isNew && form.domain === NEW_DOMAIN">
                <q-input v-model="form.domainCode" outlined dense hide-bottom-space class="kn-mgr-dialog__mono" :label="$t('managers.domainsManagement.domainCode') + ' *'" :maxlength="LIMITS.domainCode" :rules="[domainCodeRule]" data-mgr-field="domainCode" />
                <q-input v-model="form.domainName" outlined dense hide-bottom-space :label="$t('managers.domainsManagement.domainName') + ' *'" :maxlength="LIMITS.domainName" :rules="[domainNameRule]" data-mgr-field="domainName" />
            </template>

            <q-input v-model="form.valueCd" outlined dense hide-bottom-space class="kn-mgr-dialog__mono" :label="$t('common.code') + (isNew ? ' *' : '')" :readonly="!isNew" :autofocus="isNew && !!form.domain" :maxlength="LIMITS.valueCd" :rules="[codeRule]" data-mgr-field="valueCd">
                <template v-if="!isNew" #prepend><q-icon name="sym_o_lock" size="18px" /></template>
                <template v-if="!isNew" #append>
                    <q-icon name="info" color="grey" size="xs">
                        <q-tooltip>{{ $t('managers.domainsManagement.keyLocked') }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>
            <q-input v-model="form.valueName" outlined dense hide-bottom-space :label="$t('common.name') + (readOnly ? '' : ' *')" :readonly="readOnly" :autofocus="!isNew && !readOnly" :maxlength="LIMITS.valueName" :rules="[nameRule]" data-mgr-field="valueName">
                <template v-if="nameHint" #append>
                    <q-icon name="info" color="grey" size="xs">
                        <q-tooltip>{{ nameHint }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>
            <q-input v-model="form.valueDescription" outlined dense hide-bottom-space type="textarea" autogrow class="kn-ws-dialog-form__full" :label="$t('common.description') + (readOnly ? '' : ' *')" :readonly="readOnly" :maxlength="LIMITS.valueDescription" :rules="[descriptionRule]" data-mgr-field="valueDescription">
                <template v-if="descriptionHint" #append>
                    <q-icon name="info" color="grey" size="xs">
                        <q-tooltip>{{ descriptionHint }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>
        </div>

        <template #actions>
            <div class="row items-center no-wrap kn-mgr-dialog__note">
                <q-icon :name="readOnly ? 'sym_o_visibility' : 'sym_o_public'" size="16px" />
                <span>{{ readOnly ? $t('managers.domainsManagement.readOnly') : $t('managers.configurationManagement.appliesToEveryTenant') }}</span>
            </div>
            <q-btn v-if="readOnly" v-close-popup flat no-caps :label="$t('managers.domainsManagement.close')" />
            <template v-else>
                <q-btn v-close-popup flat no-caps :label="$t('common.cancel')" />
                <q-btn unelevated no-caps color="primary" :label="isNew ? $t('common.create') : $t('common.save')" :disable="!valid" :loading="saving" data-mgr-save @click="save" />
            </template>
        </template>
    </WorkspaceDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import WorkspaceDialog from '@/modules/workspace/common/WorkspaceDialog.vue'
import { checkText, normalize, toRuleMessage } from '../managerListHelpers'
import { iDomain } from './DomainsManagement'
import { displayName, isI18nKey, LIMITS, NEW_DOMAIN, nameKind } from './domainsManagementHelpers'

const API = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/domains'

const props = defineProps<{ modelValue: boolean; row: iDomain | null; values: iDomain[]; labels: Map<string, string>; presetDomain?: string; readOnly?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()
const { t } = useI18n()
const appStore = mainStore()

const form = reactive({ domain: '' as string | null, domainCode: '', domainName: '', valueCd: '', valueName: '', valueDescription: '' })
const saving = ref(false)
const domainFilter = ref('')

const isNew = computed(() => !props.row)
const title = computed(() => {
    if (!props.row) return t('managers.domainsManagement.newValue')
    return nameKind(props.row) === 'missing' ? props.row.valueName : displayName(props.row)
})

function reset() {
    const row = props.row
    form.domain = row ? row.domainCode : props.presetDomain && props.labels.has(props.presetDomain) ? props.presetDomain : null
    form.domainCode = ''
    form.domainName = ''
    form.valueCd = row?.valueCd ?? ''
    form.valueName = row?.valueName ?? ''
    form.valueDescription = row?.valueDescription ?? ''
    domainFilter.value = ''
}

// ---------- Domain select: the domains of the data, "+ New domain…" last ----------

const domainOptions = computed(() => {
    const term = normalize(domainFilter.value)
    const options = [...props.labels.entries()]
        .map(([code, name]) => ({ value: code, label: `${name} · ${code}` }))
        .filter((option) => !term || normalize(option.label).includes(term))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
    return [...options, { value: NEW_DOMAIN, label: t('managers.domainsManagement.newDomain') }]
})
function filterDomains(value: string, done: (fn: () => void) => void) {
    done(() => (domainFilter.value = value))
}

// ---------- hints: the translation of an i18n key, under its field ----------

// shown while the field still holds the saved text
function translationHint(current: string, stored: string | undefined, translation: string | undefined) {
    if (!props.row || current !== stored) return undefined
    if (translation && translation !== stored) return t('managers.domainsManagement.shownAs', { text: translation })
    return isI18nKey(stored) ? t('managers.domainsManagement.noTranslationYet') : undefined
}
const nameHint = computed(() => translationHint(form.valueName, props.row?.valueName, props.row?.translatedValueName))
const descriptionHint = computed(() => translationHint(form.valueDescription, props.row?.valueDescription, props.row?.translatedValueDescription))

// ---------- rules ----------

const message = (result: ReturnType<typeof checkText>, fieldKey: string) => toRuleMessage(result, t, fieldKey)
const requiredMessage = (fieldKey: string) => t('common.validation.required', { fieldName: t(fieldKey) })

// the domain code the value goes into
const targetDomain = computed(() => (form.domain === NEW_DOMAIN ? form.domainCode.trim() : (form.domain ?? '')))

const codeRule = (value: string) => {
    if (!isNew.value) return true
    const result = message(checkText(value, { required: true, max: LIMITS.valueCd, pattern: true }), 'common.code')
    if (result !== true) return result
    const code = value.trim().toLowerCase()
    return props.values.some((row) => row.domainCode === targetDomain.value && row.valueCd.toLowerCase() === code) ? t('managers.domainsManagement.codeExists') : true
}
const nameRule = (value: string) => message(checkText(value, { required: true, max: LIMITS.valueName, pattern: true }), 'common.name')
const descriptionRule = (value: string) => message(checkText(value, { required: true, max: LIMITS.valueDescription, pattern: true }), 'common.description')
const domainCodeRule = (value: string) => message(checkText(value, { required: true, max: LIMITS.domainCode, pattern: true }), 'managers.domainsManagement.domainCode')
const domainNameRule = (value: string) => message(checkText(value, { required: true, max: LIMITS.domainName, pattern: true }), 'managers.domainsManagement.domainName')

const valid = computed(() => {
    const checks = [codeRule(form.valueCd), nameRule(form.valueName), descriptionRule(form.valueDescription)]
    if (isNew.value) {
        if (!form.domain) return false
        if (form.domain === NEW_DOMAIN) checks.push(domainCodeRule(form.domainCode), domainNameRule(form.domainName))
    }
    return checks.every((result) => result === true)
})

// ---------- save: like the old dialog, the loaded object with the edited fields ----------

async function save() {
    if (!valid.value || props.readOnly) return
    const domainCode = targetDomain.value
    const domainName = form.domain === NEW_DOMAIN ? form.domainName.trim() : (props.row?.domainName ?? props.labels.get(domainCode) ?? domainCode)
    const body = {
        ...(props.row ?? {}),
        valueCd: form.valueCd.trim(),
        valueName: form.valueName.trim(),
        valueDescription: form.valueDescription.trim(),
        domainCode,
        domainName
    }
    saving.value = true
    try {
        if (props.row?.valueId) await axios.put(`${API}/${props.row.valueId}`, body)
        else await axios.post(API, body)
        appStore.setInfo({ title: isNew.value ? 'common.toast.createTitle' : 'common.toast.updateTitle', msg: 'common.toast.success' })
        emit('update:modelValue', false)
        emit('saved')
    } catch {
        // the axios interceptor shows the error; the dialog stays open
    } finally {
        saving.value = false
    }
}
</script>
