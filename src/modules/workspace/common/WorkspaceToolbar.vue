<template>
    <div class="kn-ws-toolbar row items-center no-wrap">
        <q-btn-toggle v-if="scopeOptions.length" :model-value="scope" :options="translatedOptions" dense unelevated no-caps color="white" text-color="grey-8" toggle-color="grey-3" toggle-text-color="dark" class="kn-ws-scope" data-ws="scope" data-tour-id="ws-scope" :aria-label="$t('workspace.scope.label')" @update:model-value="emit('update:scope', $event)" />
        <slot name="filters" />
        <div class="row items-center no-wrap kn-ws-toolbar__end">
            <!-- q-input gives its attributes to the native input: the layout attribute sits on a wrapper -->
            <div class="kn-ws-search" data-ws="search">
                <q-input :model-value="search" outlined dense clearable debounce="250" class="kn-field-compact" :placeholder="searchPlaceholder" :aria-label="searchPlaceholder" @update:model-value="emit('update:search', ($event as string) ?? '')">
                    <template #prepend><q-icon name="search" size="18px" /></template>
                </q-input>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface WsScopeOption {
    value: string
    labelKey: string
    icon?: string
}

const props = defineProps<{ scope: string; scopeOptions: WsScopeOption[]; search: string; searchPlaceholder: string }>()
const emit = defineEmits<{ 'update:scope': [value: string]; 'update:search': [value: string] }>()
const { t } = useI18n()

const translatedOptions = computed(() => props.scopeOptions.map((option) => ({ value: option.value, label: t(option.labelKey), icon: option.icon })))
</script>
