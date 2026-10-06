<template>
    <div class="theme-list column no-wrap">
        <div class="theme-list__search">
            <q-input v-model="filter" outlined dense clearable :placeholder="$t('common.search')">
                <template #append><q-icon name="search" /></template>
            </q-input>
        </div>

        <q-list class="col theme-list__items" separator>
            <q-item v-for="theme in filteredThemes" :key="theme.id ?? 'new'" clickable :active="selectedId === theme.id" active-class="theme-list__item--active" @click="emit('select', theme)">
                <q-item-section avatar>
                    <q-avatar size="36px" class="theme-list__avatar" icon="palette" />
                </q-item-section>
                <q-item-section>
                    <q-item-label class="theme-list__label ellipsis" :title="theme.themeName">{{ theme.themeName }}</q-item-label>
                    <q-item-label v-if="theme.isDefault" caption>{{ $t('managers.dashboardThemeManager.default') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn flat round dense size="sm" icon="delete" :aria-label="$t('common.delete')" @click.stop="emit('delete', theme)">
                        <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
                    </q-btn>
                </q-item-section>
            </q-item>

            <q-item v-if="!loading && filteredThemes.length === 0">
                <q-item-section class="text-grey-6">{{ $t('common.info.noDataFound') }}</q-item-section>
            </q-item>
        </q-list>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IDashboardTheme } from './DashboardThememanagement'

const props = defineProps<{
    themes: IDashboardTheme[]
    selectedId: string | number | null
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'select', theme: IDashboardTheme): void
    (e: 'delete', theme: IDashboardTheme): void
}>()

const filter = ref<string | null>('')

const filteredThemes = computed(() => {
    const term = (filter.value ?? '').trim().toLowerCase()
    if (!term) return props.themes
    return props.themes.filter((theme) => theme.themeName?.toLowerCase().includes(term))
})
</script>

<style scoped lang="scss">
.theme-list {
    height: 100%;
    min-height: 0;
}

.theme-list__search {
    padding: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.theme-list__items {
    overflow-y: auto;
    min-height: 0;
}

.theme-list__item--active {
    background: var(--kn-list-item-selected-background-color, rgba(0, 0, 0, 0.06));
    color: inherit;
}

.theme-list__avatar {
    color: #ffffff;
    border-radius: 8px;
    background: var(--kn-toolbar-primary-background-color);
}

.theme-list__label {
    font-size: 0.9rem;
}
</style>
