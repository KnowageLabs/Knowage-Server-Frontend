<template>
    <q-dialog :model-value="visible" @update:model-value="(value) => !value && closeDialog()">
        <q-card class="scheduler-parameter-dialog column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>
                    {{ $t('managers.scheduler.documentParameter') }}<span class="scheduler-parameter-dialog__document"> · {{ documentLabel }}</span>
                </q-toolbar-title>
            </q-toolbar>
            <q-linear-progress v-if="loading" indeterminate color="primary" />
            <q-card-section class="col scroll">
                <q-banner v-if="deletedParams && deletedParams.length > 0" dense rounded class="bg-warning q-mb-md">
                    <template #avatar><q-icon name="warning" /></template>
                    {{ $t('managers.scheduler.deletedParametersWarning', { names: deletedParamsMessage }) }}
                </q-banner>
                <SchedulerDocumentParameterForm v-for="(parameter, index) in parameters" :key="index" :prop-parameter="parameter" :roles="roles" :formulas="formulas" :document-label="documentLabel" @loading="setLoading($event)" />
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat :label="$t('common.cancel')" @click="closeDialog" />
                <q-btn unelevated color="primary" :label="$t('common.set')" @click="setParameters" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import SchedulerDocumentParameterForm from './SchedulerDocumentParameterForm.vue'

export default defineComponent({
    name: 'scheduler-document-parameter-dialog',
    components: { SchedulerDocumentParameterForm },
    props: { visible: { type: Boolean }, propParameters: { type: Array }, roles: { type: Array }, deletedParams: { type: Array }, documentLabel: { type: String } },
    emits: ['close', 'setParameters'],
    data() {
        return {
            parameters: [] as any[],
            formulas: [] as any[],
            loading: false
        }
    },
    computed: {
        deletedParamsMessage(): string {
            return (this.deletedParams ?? []).map((el: any) => el.name).join(', ')
        }
    },
    watch: {
        propParameters: {
            handler() {
                this.loadParameters()
            },
            deep: true
        }
    },
    async created() {
        this.loadParameters()
        await this.loadFormulas()
    },
    methods: {
        loadParameters() {
            this.parameters = []
            this.propParameters?.forEach((el: any) => this.parameters.push({ ...el }))
            this.parameters.sort((a: any, b: any) => (a.name > b.name ? 1 : -1))
        },
        closeDialog() {
            this.parameters = []
            this.$emit('close')
        },
        async loadFormulas() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/formulas/`).then((response: AxiosResponse<any>) => (this.formulas = response.data))
        },
        setParameters() {
            this.$emit('setParameters', this.parameters)
        },
        setLoading(loadingValue: boolean) {
            this.loading = loadingValue
        }
    }
})
</script>

<style scoped lang="scss">
.scheduler-parameter-dialog {
    width: 900px;
    max-width: 90vw;
    max-height: 80vh;
}

.scheduler-parameter-dialog__document {
    font-weight: 400;
    opacity: 0.7;
}
</style>
