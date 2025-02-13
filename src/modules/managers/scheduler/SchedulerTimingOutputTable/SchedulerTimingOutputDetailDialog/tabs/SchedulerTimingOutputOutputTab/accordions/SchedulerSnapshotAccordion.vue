<template>
    <q-expansion-item default-opened expand-separator icon="camera" :label="$t('managers.scheduler.saveAsSnapshot')">
        <q-card>
            <q-card-section>
                <div v-if="document">
                    <div class="row">
                        <q-input
                            bottom-slots
                            dense
                            filled
                            :rules="[(val) => val.length > 0 || $t('common.validation.required', { fieldName: $t('common.name') })]"
                            v-model="document.documentname"
                            @update:model-value="setNameValidation"
                            :label="$t('common.name')"
                            counter
                            :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.snapshot.nameMaxLength"
                            class="col"
                        />
                        <q-input bottom-slots class="q-ml-sm" dense filled v-model="document.snapshothistorylength" @update:model-value="setNameValidation" :label="$t('managers.scheduler.historyLength')" type="number" />
                    </div>
                </div>
            </q-card-section>
        </q-card>
    </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import schedulerTimingOutputOutputTabDescriptor from '../SchedulerTimingOutputOutputTabDescriptor.json'

export default defineComponent({
    name: 'scheduler-snapshot-accordion',
    props: { propDocument: { type: Object } },
    data() {
        return {
            schedulerTimingOutputOutputTabDescriptor,
            document: null as any,
            snapshotNameDirty: false
        }
    },
    watch: {
        propDocument() {
            this.loadDocument()
        }
    },
    created() {
        this.loadDocument()
    },
    methods: {
        loadDocument() {
            this.document = this.propDocument
            this.document.invalid.invalidSnapshot = false
            this.validateDocument()
        },
        setNameValidation() {
            this.snapshotNameDirty = true
            this.validateDocument()
        },
        validateDocument() {
            this.document.invalid.invalidSnapshot = !this.document.snapshotname || this.document.snapshotname.length === 0
        }
    }
})
</script>

<style lang="scss" scoped>
#snapshot-name-container {
    flex: 2;
}

.name-help {
    font-size: smaller;
}
</style>
