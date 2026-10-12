<template>
    <div v-if="driver && driver.parameterValue" class="q-pa-md">
        <q-linear-progress v-if="loading" indeterminate color="primary" class="q-mb-sm" />
        <q-tree
            id="kn-parameter-tree"
            :nodes="nodes"
            node-key="id"
            :selected="selectedKey"
            :ticked="tickedKeys"
            :tick-strategy="tickStrategy"
            :no-nodes-label="$t('common.info.noDataFound')"
            no-connectors
            selected-color="primary"
            @update:selected="onSelectedChange"
            @update:ticked="onTickedChange"
            @lazy-load="onLazyLoad"
        >
            <template #default-header="{ node, expanded }">
                <q-icon :name="node.leaf ? 'description' : expanded ? 'folder_open' : 'folder'" size="18px" class="q-mr-sm text-grey-7" />
                <span>{{ node.label }}</span>
            </template>
        </q-tree>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardDatasetDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { getFormattedDrivers, getUserRole } from './DatasetEditorDriverHelper'
import { AxiosResponse } from 'axios'
import { mapState } from 'pinia'
import mainStore from '@/App.store'

interface IFilterValueResponse {
    isEnabled: boolean
    description: string
    label: string
    id: string
    value: string
    leaf?: boolean
}

interface IDriverValue {
    value: string
    description: string
}

export default defineComponent({
    name: 'driver-dialog-tree',
    props: {
        propDriver: {
            type: Object as PropType<IDashboardDatasetDriver | null>,
            required: true
        },
        selectedDatasetProp: { required: true, type: Object },
        drivers: {
            type: Array as PropType<IDashboardDatasetDriver[]>,
            required: true
        }
    },
    data() {
        return {
            driver: null as IDashboardDatasetDriver | null,
            nodes: [] as any[],
            nodeDataMap: {} as Record<string, IDriverValue & { leaf: boolean }>,
            selectedKey: null as string | null,
            tickedKeys: [] as string[],
            // Saved values whose node is not loaded yet; they stay in the value until their node shows
            pendingValues: [] as IDriverValue[],
            loading: false
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user'
        }),
        tickStrategy(): 'none' | 'strict' | 'leaf' {
            if (!this.driver?.multivalue) return 'none'
            return this.driver.allowInternalNodeSelection ? 'strict' : 'leaf'
        }
    },
    watch: {
        propDriver() {
            this.loadDriver()
        }
    },
    created() {
        this.loadDriver()
    },
    methods: {
        async loadDriver() {
            this.driver = this.propDriver
            this.nodeDataMap = {}
            this.selectedKey = null
            this.tickedKeys = []
            this.pendingValues = this.driver?.multivalue ? (this.driver.parameterValue ?? []).filter((el) => el.value !== '' && el.value !== null && el.value !== undefined).map((el) => ({ value: el.value as string, description: el.description })) : []
            this.nodes = await this.fetchNodes(null)
        },
        async fetchNodes(parent: any) {
            if (!this.driver || !this.selectedDatasetProp) return []
            this.loading = true
            const postData = {
                name: this.selectedDatasetProp.configuration?.qbeDatamarts,
                role: getUserRole(this.user),
                parameterId: this.driver.urlName,
                mode: 'complete',
                treeLovNode: parent ? parent.id : 'lovroot',
                PARAMETERS: getFormattedDrivers(this.drivers)
            }

            const content = [] as any[]
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/businessModelOpening/parametervalues', postData, { headers: { 'X-Disable-Interceptor': 'true' } })
                .then((response: AxiosResponse<any>) => {
                    response.data.filterValues.forEach((el: IFilterValueResponse) => content.push(this.createNode(el)))
                })
                .catch((error: any) => console.log('ERROR: ', error))
            content.forEach((node) => this.checkIfNodeIsSelected(node))
            this.loading = false
            return content
        },
        async onLazyLoad({ node, done }: { node: any; done: (nodes?: any[]) => void }) {
            done(await this.fetchNodes(node))
        },
        createNode(el: IFilterValueResponse) {
            const leaf = el.leaf ?? false
            this.nodeDataMap[el.id] = { value: el.value, description: el.description, leaf }
            const node: any = { id: el.id, label: el.label, data: { value: el.value, description: el.description }, leaf, noTick: !this.isNodeSelectable(leaf) }
            if (!leaf) node.lazy = true
            return node
        },
        // Multivalue: only leaves, unless the driver allows internal nodes. Single value: every node.
        isNodeSelectable(leaf: boolean) {
            if (!this.driver || !this.driver.multivalue) return true
            return this.driver.allowInternalNodeSelection || leaf
        },
        checkIfNodeIsSelected(node: any) {
            if (!this.driver) return
            if (this.driver.multivalue) {
                const index = this.pendingValues.findIndex((el) => el.value === node.data.value)
                if (index === -1) return
                this.pendingValues.splice(index, 1)
                if (!this.tickedKeys.includes(node.id)) this.tickedKeys = [...this.tickedKeys, node.id]
            } else if (this.driver.parameterValue[0]?.value === node.data.value) {
                this.selectedKey = node.id
            }
        },
        onSelectedChange(key: string | null) {
            if (!this.driver || this.driver.multivalue) return
            this.selectedKey = key
            const data = key ? this.nodeDataMap[key] : null
            this.driver.parameterValue = data ? [{ value: data.value, description: data.description ?? '' }] : [{ value: '', description: '' }]
        },
        onTickedChange(keys: string[]) {
            if (!this.driver) return
            this.tickedKeys = keys
            const tickedValues = keys
                .map((key) => this.nodeDataMap[key])
                .filter(Boolean)
                .map((data) => ({ value: data.value, description: data.description ?? '' }))
            this.driver.parameterValue = [...this.pendingValues, ...tickedValues]
        }
    }
})
</script>
