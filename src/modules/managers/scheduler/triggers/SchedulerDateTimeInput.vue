<template>
    <q-input :model-value="text" outlined dense hide-bottom-space :mask="mask" :label="label" :placeholder="placeholder" :disable="disable" :error="invalid" @update:model-value="onInput" @blur="resetText">
        <template #append>
            <q-icon v-if="clearable && modelValue && !disable" name="close" class="cursor-pointer" @click.stop="emit('clear')" />
            <q-icon :name="kind === 'date' ? 'event' : 'access_time'" class="cursor-pointer" :data-test="dataTest + '-picker'">
                <q-popup-proxy v-if="!disable" transition-show="scale" transition-hide="scale">
                    <q-date v-if="kind === 'date'" :model-value="modelValue" mask="YYYY-MM-DD" :first-day-of-week="1" @update:model-value="onPicked">
                        <div class="row items-center justify-end">
                            <q-btn v-close-popup flat :label="$t('common.close')" color="primary" />
                        </div>
                    </q-date>
                    <q-time v-else :model-value="modelValue" mask="HH:mm" format24h @update:model-value="onPicked">
                        <div class="row items-center justify-end">
                            <q-btn v-close-popup flat :label="$t('common.close')" color="primary" />
                        </div>
                    </q-time>
                </q-popup-proxy>
            </q-icon>
        </template>
    </q-input>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getDateInputPattern, parseDateInput, parseTimeInput, formatDateInput } from '../schedulerHelpers'
import { getLocale } from '@/helpers/commons/localeHelper'

// modelValue is YYYY-MM-DD for a date and HH:mm for a time; the user can type it or pick it from the popup
const props = defineProps<{ modelValue: string | null; kind: 'date' | 'time'; label: string; clearable?: boolean; disable?: boolean; dataTest?: string }>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'clear'): void
}>()

const pattern = computed(() => (props.kind === 'date' ? getDateInputPattern(getLocale(true)) : 'HH:mm'))
const mask = computed(() => pattern.value.replace(/dd|MM/g, '##').replace(/yyyy/g, '####').replace(/HH|mm/g, '##'))
const placeholder = computed(() => pattern.value)

const text = ref('')
const invalid = computed(() => text.value.length === pattern.value.length && parse(text.value) === null)

watch(() => [props.modelValue, pattern.value], resetText, { immediate: true })

function parse(value: string) {
    return props.kind === 'date' ? parseDateInput(value, pattern.value) : parseTimeInput(value)
}

function resetText() {
    text.value = props.kind === 'date' ? formatDateInput(props.modelValue, pattern.value) : (props.modelValue ?? '')
}

function onInput(value: string | number | null) {
    text.value = (value ?? '') as string
    if (!text.value) {
        if (props.clearable) emit('clear')
        return
    }
    if (text.value.length !== pattern.value.length) return
    const parsed = parse(text.value)
    if (parsed && parsed !== props.modelValue) emit('update:modelValue', parsed)
}

function onPicked(value: string | null) {
    if (value) emit('update:modelValue', value)
}
</script>
