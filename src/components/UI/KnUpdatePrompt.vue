<template>
    <q-dialog v-model="isVisible" :persistent="true">
        <q-card class="kn-update-prompt">
            <q-card-section class="kn-update-prompt-header">
                <div class="row items-center">
                    <q-icon name="refresh" size="lg" class="q-mr-md" />
                    <div class="text-h6">{{ $t('common.updateAvailable') }}</div>
                </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="kn-update-prompt-content">
                <p>{{ $t('common.updateAvailableMessage') }}</p>
                <p class="kn-update-prompt-info">{{ $t('common.updateAvailableInfo') }}</p>
            </q-card-section>

            <q-separator />

            <q-card-actions align="right">
                <q-btn :label="$t('common.later')" flat color="primary" @click="onDismiss" />
                <q-btn :label="$t('common.updateNow')" unelevated color="primary" @click="onUpdate" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'update:visible': [value: boolean]
    update: []
    dismiss: []
}>()

const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
})

const onUpdate = () => {
    emit('update')
}

const onDismiss = () => {
    emit('dismiss')
}
</script>

<style lang="scss" scoped>
.kn-update-prompt {
    min-width: 400px;
    max-width: 500px;

    .kn-update-prompt-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .kn-update-prompt-content {
        p {
            margin: 0 0 1rem 0;
            font-size: 1rem;
            line-height: 1.5;

            &:last-child {
                margin-bottom: 0;
            }
        }

        .kn-update-prompt-info {
            font-size: 0.875rem;
            color: #6c757d;
            font-style: italic;
        }
    }
}

@media (max-width: 600px) {
    .kn-update-prompt {
        min-width: 90vw;
    }
}
</style>
