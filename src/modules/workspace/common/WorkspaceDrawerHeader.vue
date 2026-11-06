<template>
    <div class="row items-start no-wrap kn-ws-drawer__header">
        <!-- the preview image, when there is one, is only this tile: a click shows it full size (spec 9) -->
        <q-btn v-if="imageUrl" flat dense padding="0" class="kn-ws-drawer__tile kn-ws-drawer__tile--image" :aria-label="$t('workspace.previewImage')" data-ws="drawer-image" @click="imageOpen = true">
            <img :src="imageUrl" alt="" />
            <q-tooltip class="kn-ws-above-drawer">{{ $t('workspace.previewImage') }}</q-tooltip>
        </q-btn>
        <span v-else class="kn-ws-drawer__tile" :class="{ 'kn-ws-drawer__tile--view': view }"><q-icon :name="icon" size="22px" /></span>

        <div class="column col kn-ws-drawer__title">
            <span class="kn-ws-drawer__name">{{ name }}</span>
            <span class="kn-ws-drawer__sub"><slot name="subtitle" /></span>
        </div>

        <div class="row no-wrap items-center kn-ws-drawer__buttons">
            <slot name="buttons" />
            <q-btn v-close-popup flat round dense icon="close" :aria-label="$t('workspace.close')" data-ws-drawer-close>
                <q-tooltip class="kn-ws-above-drawer">{{ $t('workspace.close') }}</q-tooltip>
            </q-btn>
        </div>

        <q-dialog v-if="imageUrl" v-model="imageOpen" class="kn-ws-above-drawer">
            <q-card class="kn-ws-image-card">
                <img :src="imageUrl" :alt="name" />
            </q-card>
        </q-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// The drawer header (spec 9): a tile with the type icon or the preview image, the name, a subtitle, extra buttons, close.
defineProps<{ name: string; icon: string; view?: boolean; imageUrl?: string | null }>()

const imageOpen = ref(false)
</script>
