<template>
    <Card>
        <template #content>
            <form v-if="target" class="p-fluid p-m-5">
                <div class="p-field">
                    <span class="p-float-label">
                        <InputText
                            v-bind="$attrs"
                            id="name"
                            v-model="target.name"
                            class="kn-material-input"
                            type="text"
                            max-length="100"
                            :class="{
                                'p-invalid': vcomp.name.$invalid && vcomp.name.$dirty
                            }"
                            @input="valueChanged('name', $event.target.value)"
                            @blur="vcomp.name.$touch()"
                        />
                        <label for="name" class="kn-material-input-label">{{ $t('kpi.targetDefinition.name') }} * </label>
                    </span>
                    <KnValidationMessages :v-comp="vcomp.name" :additional-translate-params="{ fieldName: $t('kpi.targetDefinition.name') }"></KnValidationMessages>
                </div>
                <div class="p-my-4">
                    <span class="p-float-label">
                        <Dropdown id="category" v-model="target.category" :options="categories" option-label="valueName" :data-key="'valueId'" :show-clear="true" class="kn-material-input kn-width-full" @change="valueChanged('category', $event.value)" />
                        <label for="category" class="kn-material-input-label"> {{ $t('kpi.targetDefinition.kpiCategory') }}</label>
                    </span>
                </div>
                <div class="kn-flex">
                    <div class="p-d-flex p-jc-between">
                        <div>
                            <span class="p-float-label">
                                <Calendar
                                    id="startDate"
                                    v-model="target.startValidity"
                                    class="kn-material-input"
                                    :class="{
                                        'p-invalid': vcomp.startValidity.$invalid && vcomp.startValidity.$dirty
                                    }"
                                    :show-icon="true"
                                    :manual-input="false"
                                    @date-select="valueChanged('startValidity', $event)"
                                    @blur="vcomp.startValidity.$touch()"
                                />
                                <label for="startDate" class="kn-material-input-label"> {{ $t('kpi.targetDefinition.startDate') }} * </label>
                            </span>
                            <KnValidationMessages :v-comp="vcomp.startValidity" :additional-translate-params="{ fieldName: $t('kpi.targetDefinition.startDate') }"></KnValidationMessages>
                        </div>
                        <div class="p-d-flex">
                            <div>
                                <span class="p-float-label">
                                    <Calendar
                                        id="endDate"
                                        v-model="target.endValidity"
                                        class="kn-material-input"
                                        :class="{
                                            'p-invalid': vcomp.endValidity.$invalid && vcomp.endValidity.$dirty
                                        }"
                                        :show-icon="true"
                                        :manual-input="false"
                                        @date-select="valueChanged('endValidity', $event)"
                                        @blur="vcomp.endValidity.$touch()"
                                    />
                                    <label for="endDate" class="kn-material-input-label"> {{ $t('kpi.targetDefinition.endDate') }} * </label>
                                </span>
                                <KnValidationMessages :v-comp="vcomp.endValidity" :additional-translate-params="{ fieldName: $t('kpi.targetDefinition.endDate') }" :specific-translate-keys="{ is_after_date: 'kpi.targetDefinition.endDateBeforeStart' }"></KnValidationMessages>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </template>
    </Card>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iCategory, iTargetDefinition } from './TargetDefinition'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'

export default defineComponent({
    name: 'target-definition-form',
    components: {
        Dropdown,
        Calendar,
        KnValidationMessages
    },
    props: {
        selectedTarget: {
            type: Object as PropType<iTargetDefinition>
        },
        categories: {
            type: Array
        },
        vcomp: Object
    },
    emits: ['touched', 'valueChanged'],
    data() {
        return {
            target: {} as iTargetDefinition
        }
    },
    watch: {
        selectedTarget() {
            this.target = { ...this.selectedTarget }
            this.matchCategory()
        },
        categories() {
            this.matchCategory()
        }
    },
    methods: {
        matchCategory() {
            if (this.target.category && this.categories) {
                const match = (this.categories as iCategory[]).find((c) => c.valueId === (this.target.category as iCategory)?.valueId)
                if (match) this.target.category = match
            }
        },
        valueChanged(fieldName: string, value: any) {
            this.$emit('valueChanged', { fieldName, value })
        }
    }
})
</script>
