<template>
    <h5 class="q-mt-sm q-mb-none">{{ $t('common.parameters') }}</h5>
    <span class="text-caption">{{ $t('managers.menuManagement.info.parametersFormat') }}</span>
    <q-banner v-if="error" rounded dense class="bg-warning q-my-sm text-center">
        <template v-slot:avatar> <q-icon name="warning" /> </template>{{ $t('managers.menuManagement.warning.noValidParameters') }}
    </q-banner>

    <div class="row q-mb-sm q-mt-md q-gutter-sm">
        <q-input dense class="col" filled v-model="newPar.urlName" :label="$t('common.name')" />
        <q-input dense class="col" filled v-model="newPar.value[0].value" :label="$t('common.value')" />
        <q-input dense class="col" filled v-model="newPar.value[0].description" :label="$t('common.description')" :placeholder="$t('common.optional')" />
        <q-btn flat round icon="add" @click="addParam">
            <q-tooltip :delay="500">{{ $t('common.add') }}</q-tooltip>
        </q-btn>
    </div>
    <q-separator />
    <div v-if="tempParams && tempParams.length > 0" v-for="(par, index) in tempParams" :key="par.urlName" class="row q-mt-sm q-gutter-sm">
        <q-input dense class="col" filled v-model="par.urlName" :label="$t('common.name')" />
        <q-input dense class="col" filled v-model="par.value[0].value" :label="$t('common.value')" />
        <q-input dense class="col" filled v-model="par.value[0].description" :label="$t('common.description')" :placeholder="$t('common.optional')" />
        <q-btn flat round icon="delete" @click="deleteParam(index)">
            <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
        </q-btn>
    </div>
    <div class="row q-mt-md justify-end q-gutter-sm">
        <q-btn :label="$t('common.cancel')" @click="emit('close')" />
        <q-btn :label="$t('common.save')" color="primary" @click="saveParams" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits } from 'vue'

const tempParams = ref<{ urlName: string; value: [{ value: string; description: string }] }[]>([])
const newPar = ref<{ urlName: string; value: [{ value: string; description: string }] }>({ urlName: '', value: [{ value: '', description: '' }] })
const error = ref<boolean | null>(null)

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'save', parameters: string): void
}>()

const props = defineProps<{
    parametersString: string
}>()

onMounted(() => {
    if (props.parametersString) {
        const matches = props.parametersString.match(/params=([-A-Za-z0-9+\/]*={0,3})&?/)
        if (matches) {
            try {
                tempParams.value = JSON.parse(atob(matches[1]))
            } catch (e) {
                error.value = true
            }
        }
    }
})

function addParam() {
    if (newPar.value.urlName && newPar.value.value) {
        tempParams.value.push(newPar.value)
        newPar.value = { urlName: '', value: [{ value: '', description: '' }] }
    }
}

function deleteParam(index: number) {
    tempParams.value.splice(index, 1)
}

function saveParams() {
    if (tempParams.value.length > 0) {
        const paramsString = `params=${btoa(JSON.stringify(tempParams.value))}`
        emit('save', paramsString)
    } else {
        emit('save', '')
    }
}
</script>
