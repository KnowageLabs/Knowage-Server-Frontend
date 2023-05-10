<template>
    <Dialog class="kn-dialog--toolbar--primary" :visible="visible" :header="view?.new ? $t('documentExecution.main.newSavedView') : $t('documentExecution.main.addToMyRepository')" :style="descriptor.dialogStyle" :closable="false" modal :breakpoints="descriptor.dialogBreakpoints">
        <Message class="p-text-center p-m-5" severity="info" :closable="false">{{ $t('documentExecution.main.saveViewHint') }}</Message>

        <div v-if="view" class="p-formgrid p-grid p-fluid p-m-4">
            <div class="p-float-label p-col-12 p-lg-3 kn-flex">
                <InputText v-model="view.name" class="kn-material-input" :disabled="!view.new" />
                <label class="kn-material-input-label">{{ $t('common.name') }}</label>
            </div>

            <div class="p-float-label p-col-12 p-lg-6 kn-flex">
                <InputText v-model="view.description" class="kn-material-input" />
                <label class="kn-material-input-label">{{ $t('common.description') }}</label>
            </div>

            <div class="p-col-12 p-lg-3 p-d-flex p-flex-row p-ai-center">
                <span class="p-field p-float-label kn-flex">
                    <Dropdown v-model="view.visibility" class="kn-material-input" :options="descriptor.visibilityTypes" option-value="value">
                        <template #value="slotProps">
                            <span>{{ getTranslatedLabel(slotProps.value, descriptor.visibilityTypes, $t) }}</span>
                        </template>
                        <template #option="slotProps">
                            <span>{{ $t(slotProps.option.label) }}</span>
                        </template>
                    </Dropdown>
                    <label class="kn-material-input-label"> {{ $t('common.visibility') }} </label>
                </span>
                <i v-tooltip.top="$t('documentExecution.main.viewVisibilityHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-3 p-mb-2"></i>
            </div>
        </div>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.close') }}</Button>
                <Button class="kn-button kn-button--primary" @click="saveView"> {{ $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardView } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import descriptor from './DashboardSaveViewDialogDescriptor.json'
import appStore from '@/App.store'
import Message from 'primevue/message'

export default defineComponent({
    name: 'dashboard-save-view-dialog',
    components: { Dialog, Dropdown, Message },
    props: { visible: { required: true, type: Boolean }, propView: { type: Object as PropType<IDashboardView | null>, required: true } },
    emits: ['setRanges', 'close'],
    data() {
        return {
            descriptor,
            view: null as IDashboardView | null,
            getTranslatedLabel
        }
    },
    watch: {
        visible() {
            this.loadView()
        }
    },
    created() {
        this.loadView()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadView() {
            this.view = this.propView
            console.log('---------- LOADED VIEW: ', this.view)
        },
        async saveView() {
            console.log('------- SAVE VIEW: ', this.view)
            // TODO
            delete this.view?.new
            this.closeDialog()
        },
        closeDialog() {
            this.view = null
            this.$emit('close')
        }
    }
})
</script>

<style lang="scss" scoped>
#add-range-button {
    font-size: 0.8rem;
}
</style>
