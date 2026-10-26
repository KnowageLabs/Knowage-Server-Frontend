<template>
    <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
            <q-input v-model="document.documentname" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.document.name" :label="$t('common.name') + ' *'" :error="!document.documentname" data-test="document-name" />
        </div>
        <div class="col-12 col-sm-6">
            <q-input v-model="document.documentdescription" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.document.description" :label="$t('common.description')" />
        </div>
        <div class="col-12">
            <q-toggle v-model="document.useFixedFolder" dense :disable="readonly" :label="$t('managers.scheduler.fixedFolder')" />
            <q-scroll-area v-if="document.useFixedFolder" class="scheduler-document-output__tree q-mt-sm" :style="{ height: treeHeight }">
                <q-tree :nodes="nodes" node-key="id" tick-strategy="strict" :ticked="document.funct ?? []" default-expand-all dense :disable="readonly" @update:ticked="(value: number[]) => (document.funct = value)">
                    <template #default-header="{ node }">
                        <q-icon name="folder" class="scheduler-document-output__icon q-mr-xs" />
                        <span>{{ node.label }}</span>
                    </template>
                </q-tree>
            </q-scroll-area>
        </div>
        <div v-if="drivers.length > 0" class="col-12">
            <q-toggle v-model="document.useFolderDataset" dense :disable="readonly" :label="$t('managers.scheduler.folderFromDataset')">
                <q-tooltip :delay="300" max-width="400px">{{ $t('managers.scheduler.useFolderDatasetHint.partOne') }} {{ $t('managers.scheduler.useFolderDatasetHint.partTwo') }} {{ $t('managers.scheduler.useFolderDatasetHint.partThree') }}</q-tooltip>
            </q-toggle>
            <div v-if="document.useFolderDataset" class="row q-col-gutter-sm q-mt-xs">
                <div class="col-12 col-sm-6">
                    <q-select v-model="document.datasetFolderLabel" outlined dense hide-bottom-space emit-value map-options :readonly="readonly" :options="datasets ?? []" option-label="label" option-value="label" :label="$t('managers.scheduler.datasetVerification') + ' *'" :error="!document.datasetFolderLabel" />
                </div>
                <div class="col-12 col-sm-6">
                    <q-select v-model="document.datasetFolderParameter" outlined dense hide-bottom-space emit-value map-options :readonly="readonly" :options="drivers" option-label="label" option-value="label" :label="$t('common.driver') + ' *'" :error="!document.datasetFolderParameter" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { iFunctionality, iJobInfo, iTriggerDocument } from '../../Scheduler'
import { getJobDocument } from '../../schedulerHelpers'
import descriptor from '../../SchedulerDescriptor.json'

const props = defineProps<{ document: iTriggerDocument; functionalities?: iFunctionality[]; datasets?: any[]; jobInfo?: iJobInfo | null; readonly?: boolean }>()

const TREE_MAX_HEIGHT = 220
const TREE_NODE_HEIGHT = 28
const TREE_PADDING = 12

interface iFolderNode {
    id: number
    label: string
    children?: iFolderNode[]
}

const toNodes = (functionalities: iFunctionality[]): iFolderNode[] => functionalities.map((functionality: iFunctionality) => ({ id: functionality.id, label: functionality.name, children: toNodes(functionality.childs ?? []) }))

const nodes = computed(() => toNodes(props.functionalities ?? []))

// q-scroll-area needs a height: the tree is fully expanded, so it grows with the folders up to a maximum
const countNodes = (list: iFolderNode[]): number => list.reduce((total: number, node: iFolderNode) => total + 1 + countNodes(node.children ?? []), 0)
const treeHeight = computed(() => Math.min(TREE_MAX_HEIGHT, countNodes(nodes.value) * TREE_NODE_HEIGHT + TREE_PADDING) + 'px')
const drivers = computed(() => (getJobDocument(props.document, props.jobInfo)?.parameters ?? []) as any[])
</script>

<style scoped lang="scss">
.scheduler-document-output__tree {
    border: 1px solid var(--kn-color-borders);
    border-radius: 4px;
}

.scheduler-document-output__tree :deep(.q-scrollarea__content) {
    width: 100%;
    padding: 4px 8px;
}

.scheduler-document-output__icon {
    color: var(--kn-editor-list-icon-color);
}
</style>
