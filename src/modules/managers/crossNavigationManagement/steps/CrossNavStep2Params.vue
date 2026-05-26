<template>
    <div class="q-pt-sm">
        <q-banner v-if="!navigation.fromPars || !navigation.toPars" rounded class="bg-orange-1 text-orange-9 q-mb-md">
            <template #avatar>
                <q-icon name="info" color="orange" />
            </template>
            {{ $t('managers.crossNavigationManagement.hintDrag') }}
        </q-banner>

        <div v-if="navigation.fromPars" class="row q-mb-sm q-col-gutter-sm items-center">
            <div class="col">
                <q-input v-model.trim="fixedValue" :label="$t('managers.crossNavigationManagement.fixedValue')" dense outlined maxlength="100" hide-bottom-space @keyup.enter="addFixedValue" />
            </div>
            <div class="col-auto">
                <q-btn unelevated color="primary" :label="$t('common.add')" :disable="!fixedValue" @click="addFixedValue" />
            </div>
        </div>

        <div v-if="!navigation.toPars?.length" class="q-pa-sm text-grey text-center">{{ $t('common.info.noDataFound') }}</div>
        <q-table v-else :rows="navigation.toPars" :columns="tableColumns" row-key="id" dense flat bordered hide-bottom :pagination="{ rowsPerPage: 0 }">
            <template #body-cell-source="props">
                <q-td :props="props" style="min-width: 200px">
                    <q-select :model-value="getLinkedSourceName(props.row)" :options="navigation.fromPars || []" option-label="name" option-value="name" emit-value map-options dense outlined clearable :placeholder="$t('managers.crossNavigationManagement.notLinked')" @update:model-value="(name) => onTableSelect(props.row, name)">
                        <template #option="scope">
                            <q-item v-bind="scope.itemProps">
                                <q-item-section>
                                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <q-badge :color="parTypeBadgeColor(scope.opt.type)" :label="$t(parTypeLabel(scope.opt.type))" />
                                </q-item-section>
                            </q-item>
                        </template>
                    </q-select>
                </q-td>
            </template>
        </q-table>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import mainStore from '../../../../App.store'

export default defineComponent({
    name: 'cross-nav-step2-params',
    props: {
        navigation: { type: Object as PropType<any>, required: true }
    },
    emits: ['touched'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            fixedValue: '' as string,
            tableColumns: [
                { name: 'name', label: this.$t('managers.crossNavigationManagement.targetParameter'), field: 'name', align: 'left' as const, sortable: false },
                { name: 'source', label: this.$t('managers.crossNavigationManagement.sourceParameter'), field: '', align: 'left' as const }
            ]
        }
    },
    methods: {
        parTypeLabel(type: number): string {
            const labels: Record<number, string> = {
                0: 'managers.crossNavigationManagement.output',
                1: 'managers.crossNavigationManagement.input',
                2: 'managers.crossNavigationManagement.fixed'
            }
            return labels[type] ?? ''
        },
        parTypeBadgeColor(type: number): string {
            const colors: Record<number, string> = { 0: 'green', 1: 'blue', 2: 'orange' }
            return colors[type] ?? 'grey'
        },
        getLinkedSource(toPar: any): any {
            return toPar.links?.[0] ?? null
        },
        getLinkedSourceName(toPar: any): string | null {
            return toPar.links?.[0]?.name ?? null
        },
        setLink(toPar: any, fromPar: any) {
            if (fromPar.type === 2 || fromPar.parType === toPar.parType) {
                toPar.links = [fromPar]
                this.$emit('touched')
            } else {
                this.store.setInfo({
                    title: this.$t('managers.crossNavigationManagement.incompatibleTypes'),
                    msg: this.$t('managers.crossNavigationManagement.incompatibleTypesMessage', { originParam: fromPar.name, targetParam: toPar.name })
                })
            }
        },
        removeLink(toParId: number) {
            const toPar = this.navigation.toPars?.find((p: any) => p.id === toParId)
            if (toPar) {
                toPar.links = []
                this.$emit('touched')
            }
        },
        addFixedValue() {
            if (!this.fixedValue) return
            if (!this.navigation.fromPars) this.navigation.fromPars = []
            this.navigation.fromPars.push({
                id: this.navigation.simpleNavigation?.fromDocId,
                name: this.fixedValue,
                type: 2,
                fixedValue: this.fixedValue
            })
            this.fixedValue = ''
            this.$emit('touched')
        },
        onTableSelect(toPar: any, name: string | null) {
            if (!name) {
                this.removeLink(toPar.id)
                return
            }
            const fromPar = this.navigation.fromPars?.find((fp: any) => fp.name === name)
            if (fromPar) this.setLink(toPar, fromPar)
        }
    }
})
</script>
