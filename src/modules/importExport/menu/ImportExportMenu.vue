<template>
    <div class="import-export-menu">
        <q-card class="p-my-2">
            <q-input class="p-col-4" v-model="searchFilter" dense :placeholder="$t('common.search')" type="text">
                <template #prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
        </q-card>

        <q-card class="p-d-flex p-flex-column kn-flex kn-overflow">
            <q-tree ref="menuTree" :nodes="menuTreeNodes" :filter="searchFilter" node-key="menuId" tick-strategy="leaf" v-model:ticked="selectedMenuIds">
                <template #default-header="{ node }">
                    <div class="row items-center full-width">
                        <span>{{ node.name }}</span>
                    </div>
                </template>
            </q-tree>
        </q-card>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import mainStore from '@/App.store'
import type { ISelectedItems } from '../ImportExportTypes'
import { iMenuNode } from '@/modules/managers/menuManagement/MenuManagement'

export default defineComponent({
    name: 'import-export-menu',
    props: { selectedItems: { type: Object as () => ISelectedItems, required: true } },
    emits: ['onItemSelected', 'update:loading'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            menuItems: [] as iMenuNode[],
            menuTreeNodes: [] as any[],
            searchFilter: '',
            selectedMenuIds: [] as number[],
            lastEmittedKey: '',
            FUNCTIONALITY: 'menu' as const
        }
    },
    watch: {
        selectedMenuIds() {
            this.emitSelectedMenu()
        },
        selectedItems: {
            handler(newVal) {
                const selectedMenu = newVal?.[this.FUNCTIONALITY] || []
                this.selectedMenuIds = selectedMenu.map((item: any) => (typeof item === 'object' ? item.menuId : item)).filter((id: any) => id !== undefined && id !== null)
            },
            deep: true
        }
    },
    created() {
        this.loadAllMenuItems()
    },
    methods: {
        loadAllMenuItems(): void {
            this.$emit('update:loading', true)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/menu/getAllMenu')
                .then((response: AxiosResponse<any>) => {
                    const payload = response.data?.currentMenu ?? response.data?.menu ?? response.data
                    const menuList = Array.isArray(payload) ? payload : []

                    this.menuItems = menuList.map((item: any) => ({
                        ...item,
                        menuId: Number(item.menuId),
                        parentId: item.parentId === null || item.parentId === undefined ? null : Number(item.parentId)
                    }))
                    this.buildTree()

                    if (this.selectedItems && this.selectedItems[this.FUNCTIONALITY]) {
                        const filtered = this.selectedItems[this.FUNCTIONALITY].filter((element: any) => {
                            const menuId = typeof element === 'object' ? element.menuId : element
                            return this.menuItems.some((el) => el.menuId === menuId)
                        })
                        this.selectedMenuIds = filtered.map((element: any) => (typeof element === 'object' ? element.menuId : element))
                    }
                })
                .catch((error) => console.error('[ImportExportMenu] loadAllMenuItems error', error))
                .finally(() => {
                    this.$emit('update:loading', false)
                })
        },
        buildTree(): void {
            const itemsMap = new Map<number, any>()
            const roots: any[] = []

            this.menuItems.forEach((item) => {
                itemsMap.set(item.menuId, { ...item, label: item.name, children: [] })
            })

            this.menuItems.forEach((item) => {
                const node = itemsMap.get(item.menuId)
                if (item.parentId === null) {
                    roots.push(node)
                } else {
                    const parent = itemsMap.get(item.parentId)
                    if (parent) parent.children.push(node)
                }
            })

            this.menuTreeNodes = roots
        },
        emitSelectedMenu(): void {
            const key = JSON.stringify([...this.selectedMenuIds].sort())
            if (key === this.lastEmittedKey) return
            this.lastEmittedKey = key

            const selected = this.menuItems.filter((item) => this.selectedMenuIds.includes(item.menuId))
            this.$emit('onItemSelected', { functionality: this.FUNCTIONALITY, items: selected })
        }
    }
})
</script>

<style scoped>
.import-export-menu {
    display: flex;
    flex-direction: column;
    height: 95vh;
}
</style>
