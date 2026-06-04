<template>
    <div class="kn-side-panel column">
        <div class="kn-side-panel-header row items-center q-px-md q-py-xs">
            <q-icon name="analytics" size="xs" color="white" class="q-mr-xs" />
            <span class="col text-subtitle2 text-white kn-side-panel-title">{{ $t('ai.sidePanel.title') }}</span>
            <q-btn flat round dense icon="close" color="white" size="xs" @click="$emit('close')" />
        </div>
        <div class="kn-side-panel-body col q-pa-sm">
            <div v-if="items.length === 0" class="kn-side-panel-empty column items-center justify-center">
                <q-icon name="analytics" size="2.5rem" color="grey-4" class="q-mb-sm" />
                <div class="text-caption text-grey-5">{{ $t('ai.sidePanel.noArtifacts') }}</div>
            </div>

            <template v-for="(item, index) in items" :key="index">
                <!-- SQL Query -->
                <q-card v-if="item.type === 'sql_query'" flat bordered class="kn-artifact-card q-mb-sm">
                    <q-card-section class="q-pa-sm">
                        <div class="row items-center q-mb-xs">
                            <q-icon name="storage" size="xs" color="deep-purple-5" class="q-mr-xs" />
                            <span class="text-caption text-weight-bold" style="color: #7c3aed">{{ $t('ai.sidePanel.sql') }}</span>
                        </div>
                        <pre class="kn-code-block">{{ item.query }}</pre>
                    </q-card-section>
                </q-card>

                <!-- Artifacts -->
                <template v-if="item.type === 'artifacts'">
                    <q-card v-for="file in item.files" :key="file.name" flat bordered class="kn-artifact-card q-mb-sm">
                        <q-card-section class="q-pa-sm">
                            <!-- PNG image -->
                            <template v-if="file.ext === 'png'">
                                <div class="row items-center q-mb-xs">
                                    <q-icon name="image" size="xs" color="teal-6" class="q-mr-xs" />
                                    <span class="text-caption text-weight-bold col" style="color: #0d9488">{{ file.title }}</span>
                                    <q-btn flat round dense size="xs" icon="download" color="grey-6" tag="a" :href="file.path" target="_blank" />
                                </div>
                                <p v-if="file.description" class="text-caption text-grey-6 q-mb-xs q-mt-none">{{ file.description }}</p>
                                <img :src="file.path" class="kn-artifact-img" alt="" />
                            </template>

                            <!-- CSV -->
                            <template v-else-if="file.ext === 'csv'">
                                <div class="row items-center q-mb-xs">
                                    <q-icon name="table_view" size="xs" color="blue-6" class="q-mr-xs" />
                                    <span class="text-caption text-weight-bold col" style="color: #2563eb">{{ file.title }}</span>
                                    <q-btn flat round dense size="xs" icon="download" color="grey-6" tag="a" :href="file.path" target="_blank" />
                                </div>
                                <p v-if="file.description" class="text-caption text-grey-6 q-mb-xs q-mt-none">{{ file.description }}</p>
                                <KnCsvPreview :url="file.path" />
                            </template>

                            <!-- Other (json, etc.) -->
                            <template v-else>
                                <div class="row items-center q-mb-xs">
                                    <q-icon name="insert_drive_file" size="xs" color="orange-6" class="q-mr-xs" />
                                    <span class="text-caption text-weight-bold col" style="color: #d97706">{{ file.title }}</span>
                                    <q-btn flat round dense size="xs" icon="download" color="grey-6" tag="a" :href="file.path" target="_blank" />
                                </div>
                                <p v-if="file.description" class="text-caption text-grey-6 q-mt-none">{{ file.description }}</p>
                            </template>
                        </q-card-section>
                    </q-card>
                </template>

                <!-- Python code -->
                <q-card v-if="item.type === 'python_code'" flat bordered class="kn-artifact-card q-mb-sm">
                    <q-card-section class="q-pa-sm">
                        <div class="row items-center q-mb-xs">
                            <q-icon name="code" size="xs" color="green-7" class="q-mr-xs" />
                            <span class="text-caption text-weight-bold" style="color: #15803d">{{ $t('ai.sidePanel.python') }}</span>
                        </div>
                        <pre class="kn-code-block">{{ item.code }}</pre>
                    </q-card-section>
                </q-card>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import KnCsvPreview from './KnCsvPreview.vue'
import type { IChatBlock } from './KnChatbot'

defineProps<{ items: IChatBlock[] }>()
defineEmits<{ (e: 'close'): void }>()
</script>

<style scoped lang="scss">
.kn-side-panel {
    width: 380px;
    min-width: 260px;
    max-width: 480px;
    border-left: 1px solid #e2e8f0;
    background: #f8fafc;
    overflow: hidden;
    flex-shrink: 0;
    animation: kn-slide-in-right 0.22s ease;

    &-header {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        min-height: 36px;
        flex-shrink: 0;
    }

    &-title {
        font-size: 0.78rem;
        letter-spacing: 0.02em;
    }

    &-body {
        overflow-y: auto;
        overflow-x: hidden;
    }

    &-empty {
        height: 100%;
        min-height: 120px;
        padding: 32px 16px;
    }
}

.kn-artifact-card {
    border-radius: 8px;
    border-color: #e2e8f0;
    background: white;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:hover {
        border-color: #a5b4fc;
        box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
    }
}

.kn-code-block {
    background: #1e1e2e;
    color: #cdd6f4;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 0.7rem;
    font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
    overflow-x: auto;
    overflow-y: auto;
    white-space: pre;
    margin: 0;
    max-height: 180px;
    line-height: 1.5;
}

.kn-artifact-img {
    width: 100%;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    display: block;
}

@keyframes kn-slide-in-right {
    from {
        transform: translateX(16px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
