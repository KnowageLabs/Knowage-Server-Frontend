<template>
    <div class="row q-col-gutter-md q-pt-sm">
        <div class="col-6">
            <q-input :model-value="simpleNavigation.fromDoc" :label="$t('managers.crossNavigationManagement.originDoc')" dense outlined readonly class="cursor-pointer" :placeholder="$t('managers.crossNavigationManagement.noDocSelected')" @click="openDocDialog('origin')">
                <template #prepend>
                    <q-icon name="description" :color="simpleNavigation.fromDoc ? 'primary' : 'grey-6'" />
                </template>
                <template #append>
                    <q-spinner v-if="loading && activeDocType === 'origin'" color="primary" size="xs" />
                    <q-icon v-else name="search" color="grey-6" />
                </template>
            </q-input>
        </div>

        <div class="col-6">
            <q-input :model-value="simpleNavigation.toDoc" :label="$t('managers.crossNavigationManagement.targetDoc')" dense outlined readonly class="cursor-pointer" :placeholder="$t('managers.crossNavigationManagement.noDocSelected')" @click="openDocDialog('target')">
                <template #prepend>
                    <q-icon name="description" :color="simpleNavigation.toDoc ? 'primary' : 'grey-6'" />
                </template>
                <template #append>
                    <q-spinner v-if="loading && activeDocType === 'target'" color="primary" size="xs" />
                    <q-icon v-else name="search" color="grey-6" />
                </template>
            </q-input>
        </div>

        <CrossNavigationManagementDocDialog :dialog-visible="dialogVisible" :selected-doc="activeDocId" @close="dialogVisible = false" @apply="handleDocApply" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import CrossNavigationManagementDocDialog from '../dialogs/CrossNavigationManagementDocDialog.vue'

export default defineComponent({
    name: 'cross-nav-step1-docs',
    components: { CrossNavigationManagementDocDialog },
    props: {
        simpleNavigation: { type: Object as PropType<any>, required: true },
        loading: { type: Boolean, default: false }
    },
    emits: ['docSelected', 'touched'],
    data() {
        return {
            dialogVisible: false,
            activeDocType: '' as string,
            activeDocId: null as any
        }
    },
    methods: {
        openDocDialog(type: string) {
            this.activeDocType = type
            this.activeDocId = type === 'origin' ? this.simpleNavigation.fromDocId : this.simpleNavigation.toDocId
            this.dialogVisible = true
        },
        handleDocApply(doc: any) {
            this.dialogVisible = false
            this.$emit('docSelected', this.activeDocType, doc)
            this.$emit('touched')
        }
    }
})
</script>
