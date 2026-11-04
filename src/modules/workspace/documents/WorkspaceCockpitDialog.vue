<template>
    <q-dialog :model-value="modelValue" maximized transition-show="slide-up" transition-hide="slide-down" @update:model-value="emit('update:modelValue', $event)" @hide="emit('closed')">
        <q-card class="column no-wrap kn-ws-cockpit-card" data-ws-dialog="cockpit">
            <div class="row items-center no-wrap kn-ws-cockpit-card__bar">
                <span class="text-subtitle1">{{ $t('workspace.new.cockpit') }}</span>
                <q-badge outline color="grey-7" :label="$t('workspace.legacy')" class="q-ml-sm" />
                <q-space />
                <q-btn v-close-popup flat round dense icon="close" :aria-label="$t('workspace.close')">
                    <q-tooltip>{{ $t('workspace.close') }}</q-tooltip>
                </q-btn>
            </div>
            <q-separator />
            <iframe v-if="modelValue" class="col kn-ws-cockpit-card__frame" :src="url" :title="$t('workspace.new.cockpit')"></iframe>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import mainStore from '@/App.store'

// Ported from views/analysisView/dialogs/WorkspaceCockpitDialog.vue: the old cockpit engine in an iframe, same URL.
// The page cannot tell when the cockpit is saved: the tab reloads its list when the dialog closes.
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; closed: [] }>()
const store = mainStore()

const url = computed(() => {
    const user = (store.$state as any).user
    const locale = store.getLocale()
    const language = locale.split('_')[0]
    const country = locale.split('_')[1]
    return `${import.meta.env.VITE_HOST_URL}${import.meta.env.VITE_KNOWAGECOCKPITENGINE_CONTEXT}/api/1.0/pages/edit?NEW_SESSION=TRUE&SBI_LANGUAGE=${language}&SBI_SCRIPT=&user_id=${user.userUniqueIdentifier}&SBI_COUNTRY=${country}&SBI_ENVIRONMENT=WORKSPACE&IS_TECHNICAL_USER=true&documentMode=EDIT`
})
</script>

<style scoped lang="scss">
.kn-ws-cockpit-card {
    padding-left: var(--kn-mainmenu-offset);
}
.kn-ws-cockpit-card__bar {
    padding: 4px 8px 4px var(--kn-ws-gutter);
    border-bottom: 1px solid var(--kn-ws-line);
}
.kn-ws-cockpit-card__frame {
    width: 100%;
    border: 0;
}
</style>
