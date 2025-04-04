<template>
    <template v-if="props.properties.length > 0">
        <q-list dense bordered separator>
            <q-item v-for="prop in props.properties">
                <q-item-section>{{ prop }}</q-item-section>
            </q-item>
        </q-list>
    </template>
    <q-banner v-else dense rounded class="bg-amber-3 text-black q-mx-sm text-center">{{ $t('dashboard.widgetEditor.map.layerInfo.noProperties') }}</q-banner>
</template>

<script lang="ts" setup>
const props = defineProps<{
    properties: any
}>()
</script>
