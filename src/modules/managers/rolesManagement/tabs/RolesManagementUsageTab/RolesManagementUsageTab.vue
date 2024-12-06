<template>
    <q-banner v-if="noUsage" class="bg-grey-3 q-ma-sm text-center">
        <template v-slot:avatar>
            <q-icon name="info" color="primary" />
        </template>
        <span>{{ $t('managers.rolesManagement.noUsages') }}</span>
    </q-banner>
    <div class="rolesManagementUsage">
        <template v-for="category in descriptor.categories">
            <div class="card q-pa-none" v-if="elements[category.name] && elements[category.name].length > 0">
                <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                    <q-toolbar-title shrink>
                        {{ $t(category.label) }}
                    </q-toolbar-title>
                </q-toolbar>
                <q-list dense separator class="overflow-auto" style="height: 250px">
                    <q-item v-for="element in elements[category.name]">
                        <q-item-section> {{ element }} </q-item-section>
                    </q-item>
                </q-list>
            </div>
        </template>
    </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUpdated, computed } from 'vue'
import descriptor from './RolesManagementUsageTabDescriptor.json'
import axios from '@/axios.js'

const props = defineProps(['id'])

const tempId = ref<number | undefined>()
const elements = ref<any>({})

onMounted(async () => {
    if (props.id) {
        loadElements(props.id)
    }
})

onUpdated(async () => {
    if (props.id != tempId.value) {
        loadElements(props.id)
    }
})

const noUsage = computed(() => {
    let count = 0
    descriptor.categories.forEach((cat) => {
        if (elements.value[cat.name] && elements.value[cat.name].length > 0) count++
    })
    return count === 0
})

async function loadElements(id) {
    tempId.value = id
    await axios.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/roles/${props.id}/allElement`).then((response) => {
        elements.value = response.data
    })
}
</script>
<style lang="scss" scoped>
.rolesManagementUsage {
    display: grid;
    margin: 8px;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    .card {
        border: 1px solid var(--kn-color-borders);
    }
}
.q-toolbar__title {
    font-size: inherit;
}

@media all and (max-width: 1200px) {
    .rolesManagementUsage {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media all and (max-width: 800px) {
    .rolesManagementUsage {
        grid-template-columns: repeat(1, 1fr);
    }
}
</style>
