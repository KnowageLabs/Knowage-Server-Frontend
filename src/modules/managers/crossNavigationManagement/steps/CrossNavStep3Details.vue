<template>
    <div class="row q-col-gutter-sm q-pt-sm">
        <div class="col-6">
            <q-input v-model.trim="simpleNavigation.name" :label="$t('common.name') + ' *'" dense outlined maxlength="40" hide-bottom-space :error="v$.simpleNavigation.name.$invalid && v$.simpleNavigation.name.$dirty" :error-message="$t('common.validation.required', { fieldName: $t('common.name') })" @blur="v$.simpleNavigation.name.$touch()" @update:model-value="$emit('touched')" />
        </div>

        <div class="col-6">
            <q-select v-model="simpleNavigation.type" :label="$t('managers.crossNavigationManagement.modality')" :options="crossModes" option-value="value" option-label="name" emit-value map-options dense outlined hide-bottom-space @update:model-value="$emit('touched')" />
        </div>

        <div class="col-6">
            <q-input v-model.trim="simpleNavigation.description" :label="$t('common.description')" dense outlined maxlength="200" hide-bottom-space @update:model-value="$emit('touched')">
                <template #append>
                    <q-btn flat round dense icon="info" size="sm" @click="$emit('hintDialog', 'desc')" />
                </template>
            </q-input>
        </div>

        <div class="col-6">
            <q-input v-model.trim="simpleNavigation.breadcrumb" :label="$t('managers.crossNavigationManagement.breadCrumbs')" dense outlined maxlength="200" hide-bottom-space @update:model-value="$emit('touched')">
                <template #append>
                    <q-btn flat round dense icon="info" size="sm" @click="$emit('hintDialog', 'bread')" />
                </template>
            </q-input>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
    name: 'cross-nav-step3-details',
    props: {
        simpleNavigation: { type: Object as PropType<any>, required: true },
        v$: { type: Object as PropType<any>, required: true }
    },
    emits: ['touched', 'hintDialog'],
    data() {
        return {
            crossModes: [
                { name: this.$t('managers.crossNavigationManagement.normal'), value: 3 },
                { name: this.$t('managers.crossNavigationManagement.popUp'), value: 1 }
            ]
        }
    },
    methods: {}
})
</script>
