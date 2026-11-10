<template>
    <!-- The edit dialog (spec D7 = E2, 7.2): the WorkspaceDialog shell and form grid, labels inside the fields. -->
    <WorkspaceDialog :model-value="modelValue" :title="title" name="configuration" size="md" persistent @update:model-value="emit('update:modelValue', $event)" @show="reset">
        <div class="kn-ws-dialog-form">
            <q-input v-model="form.label" outlined dense hide-bottom-space class="kn-ws-dialog-form__full kn-mgr-dialog__mono" :label="$t('managers.configurationManagement.headers.label') + ' *'" :readonly="!isNew" :autofocus="isNew" :maxlength="LIMITS.label" :rules="[labelRule]" data-mgr-field="label">
                <template v-if="!isNew" #prepend><q-icon name="sym_o_lock" size="18px" /></template>
                <template v-if="!isNew" #append>
                    <q-icon name="info" color="grey" size="xs">
                        <q-tooltip>{{ $t('managers.configurationManagement.labelLocked') }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>
            <q-input v-model="form.name" outlined dense hide-bottom-space :label="$t('common.name') + ' *'" :autofocus="!isNew" :maxlength="LIMITS.name" :rules="[nameRule]" data-mgr-field="name" />
            <q-select
                v-model="form.category"
                outlined
                dense
                hide-bottom-space
                use-input
                hide-selected
                fill-input
                input-debounce="0"
                new-value-mode="add-unique"
                :label="$t('common.category') + ' *'"
                :options="categoryOptions"
                :rules="[categoryRule]"
                data-mgr-field="category"
                @filter="filterCategories"
                @input-value="onCategoryInput"
            >
                <template v-if="isNew" #append>
                    <q-icon name="info" color="grey" size="xs">
                        <q-tooltip>{{ $t('managers.configurationManagement.newCategoryHint') }}</q-tooltip>
                    </q-icon>
                </template>
            </q-select>

            <q-input v-if="kind === 'password'" v-model="form.valueCheck" outlined dense hide-bottom-space class="kn-ws-dialog-form__full kn-mgr-dialog__mono" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" :label="$t('common.value')" :maxlength="LIMITS.value" data-mgr-field="value">
                <template #append>
                    <q-btn flat round dense size="sm" :icon="showPassword ? 'sym_o_visibility_off' : 'sym_o_visibility'" :aria-label="$t(showPassword ? 'managers.configurationManagement.hidePassword' : 'managers.configurationManagement.showPassword')" @click="showPassword = !showPassword" />
                </template>
            </q-input>
            <div v-else-if="kind === 'boolean'" class="kn-ws-dialog-form__full row items-center no-wrap kn-mgr-value-switch" data-mgr-field="value">
                <div class="col column">
                    <span class="kn-mgr-switch-row__caption">{{ $t('common.value') }}</span>
                    <span class="kn-mgr__mono">{{ form.valueCheck }}</span>
                </div>
                <q-toggle :model-value="booleanOn" color="primary" @update:model-value="form.valueCheck = booleanText($event, row?.valueCheck)" />
            </div>
            <q-input v-else v-model="form.valueCheck" outlined dense hide-bottom-space class="kn-ws-dialog-form__full kn-mgr-dialog__mono" :type="kind === 'long' ? 'textarea' : 'text'" :autogrow="kind === 'long'" :label="$t('common.value')" :maxlength="LIMITS.value" :rules="[valueRule]" data-mgr-field="value" />

            <q-input v-model="form.description" outlined dense hide-bottom-space type="textarea" autogrow class="kn-ws-dialog-form__full" :label="$t('common.description')" :maxlength="LIMITS.description" :rules="[descriptionRule]" data-mgr-field="description" />

            <div class="kn-ws-dialog-form__full">
                <q-toggle v-model="form.active" color="primary" :label="$t('common.active')" data-mgr-field="active" />
            </div>
        </div>

        <template #actions>
            <div class="row items-center no-wrap kn-mgr-dialog__note">
                <q-icon name="sym_o_public" size="16px" />
                <span>{{ $t('managers.configurationManagement.appliesToEveryTenant') }}</span>
            </div>
            <q-btn v-close-popup flat no-caps :label="$t('common.cancel')" />
            <q-btn unelevated no-caps color="primary" :label="isNew ? $t('common.create') : $t('common.save')" :disable="!valid" :loading="saving" data-mgr-save @click="save" />
        </template>
    </WorkspaceDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import WorkspaceDialog from '@/modules/workspace/common/WorkspaceDialog.vue'
import { iConfiguration } from './ConfigurationManagement'
import { checkText, toRuleMessage } from '../managerListHelpers'
import { booleanText, LIMITS, valueKind } from './configurationManagementHelpers'

const API = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs'

const props = defineProps<{ modelValue: boolean; row: iConfiguration | null; categories: string[]; labels: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()
const { t } = useI18n()
const appStore = mainStore()

const form = reactive({ label: '', name: '', category: '' as string | null, valueCheck: '' as string | null, active: true, description: '' })
const saving = ref(false)
const showPassword = ref(false)
const categoryOptions = ref<string[]>([])

const isNew = computed(() => !props.row)
const title = computed(() => (props.row ? props.row.name || props.row.label : t('managers.configurationManagement.newSetting')))
// the field type is fixed when the dialog opens, so typing never swaps the field
const kind = ref(valueKind({ label: '', valueCheck: '' }, true))
const booleanOn = computed(() => /^true$/i.test((form.valueCheck ?? '').trim()))

function reset() {
    const row = props.row
    form.label = row?.label ?? ''
    form.name = row?.name ?? ''
    form.category = row?.category || null
    form.valueCheck = row?.valueCheck ?? ''
    form.active = row ? row.active !== false : true
    form.description = row?.description ?? ''
    showPassword.value = false
    kind.value = valueKind({ label: form.label, valueCheck: form.valueCheck }, !row)
    categoryOptions.value = props.categories
}

// ---------- category select: the categories of the data, or a new one typed and confirmed with Enter ----------

function filterCategories(value: string, done: (fn: () => void) => void) {
    const term = value.trim().toLowerCase()
    done(() => (categoryOptions.value = term ? props.categories.filter((category) => category.toLowerCase().includes(term)) : props.categories))
}
// fill-input: the typed text is the value until the user picks or adds one
function onCategoryInput(value: string) {
    if (!value) form.category = null
}

// ---------- rules ----------

const message = (result: ReturnType<typeof checkText>, fieldKey: string) => toRuleMessage(result, t, fieldKey)

const labelRule = (value: string) => {
    if (!isNew.value) return true
    const result = message(checkText(value, { required: true, max: LIMITS.label, pattern: true }), 'managers.configurationManagement.headers.label')
    if (result !== true) return result
    return props.labels.some((label) => label.toLowerCase() === value.trim().toLowerCase()) ? t('managers.configurationManagement.labelExists') : true
}
const nameRule = (value: string) => message(checkText(value, { required: true, max: LIMITS.name, pattern: true }), 'common.name')
const categoryRule = (value: string | null) => message(checkText(value, { required: true, max: LIMITS.category }), 'common.category')
const valueRule = (value: string | null) => message(checkText(value, { max: LIMITS.value }), 'common.value')
const descriptionRule = (value: string) => message(checkText(value, { max: LIMITS.description, pattern: true }), 'common.description')

const valid = computed(() => [labelRule(form.label), nameRule(form.name), categoryRule(form.category), kind.value === 'boolean' ? true : valueRule(form.valueCheck), descriptionRule(form.description)].every((result) => result === true))

// ---------- save: the loaded object with the edited fields (POST without id, PUT with id) ----------

async function save() {
    if (!valid.value) return
    const body: iConfiguration = {
        ...(props.row ?? { id: null, valueTypeId: null }),
        label: form.label.trim(),
        name: form.name.trim(),
        category: (form.category ?? '').trim(),
        valueCheck: form.valueCheck ?? '',
        active: form.active,
        description: form.description
    } as iConfiguration
    saving.value = true
    try {
        if (props.row?.id) await axios.put(`${API}/${props.row.id}`, body)
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
