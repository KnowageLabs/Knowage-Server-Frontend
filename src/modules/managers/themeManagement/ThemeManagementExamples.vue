<template>
    <div id="example" ref="example" class="kn-page-content p-m-0 p-p-4">
        <Card class="p-mt-4">
            <template #content>
                <form class="p-fluid p-m-5 p-grid">
                    <div class="p-field p-col-3 p-md-4">
                        <span class="p-float-label">
                            <InputText id="exampleTextInput" v-model="examples.input.text" class="kn-material-input" type="text" />
                            <label for="exampleTextInput" class="kn-material-input-label">Example Text Input</label>
                        </span>
                    </div>
                    <div class="p-field p-col-3 p-md-4">
                        <span class="p-float-label">
                            <InputText id="exampleTextInputDisabled" v-model="examples.input.disabled" class="kn-material-input" type="text" disabled />
                            <label for="exampleTextInputDisabled" class="kn-material-input-label">Example Text Input disabled</label>
                        </span>
                    </div>
                    <div class="p-field p-col-3 p-md-4">
                        <span class="p-float-label">
                            <InputText id="exampleTextInputInvalid" v-model="examples.input.invalid" class="kn-material-input p-invalid" type="text" />
                            <label for="exampleTextInputInvalid" class="kn-material-input-label">Example Text Input invalid</label>
                        </span>
                    </div>
                    <div class="p-field p-col-3 p-md-4">
                        <span class="p-float-label">
                            <InputText id="exampleNumberInput" v-model="examples.input.number" class="kn-material-input" type="number" />
                            <label for="exampleNumberInput" class="kn-material-input-label">Example Number Input</label>
                        </span>
                    </div>
                </form>
            </template>
        </Card>
        <Toolbar class="kn-toolbar kn-toolbar--primary p-mt-4">
            <template #start>Example Primary toolbar</template>
            <template #end>
                <Button icon="fas fa-bookmark" class="p-button-text p-button-rounded p-button-plain" />
                <Button icon="pi pi-briefcase" class="p-button-text p-button-rounded p-button-plain" />
                <Button icon="fas fa-box" class="p-button-text p-button-rounded p-button-plain" disabled />
                <FabButton icon="fas fa-plus" style="z-index: 10" />
            </template>
        </Toolbar>

        <Toolbar class="kn-toolbar kn-toolbar--secondary p-mt-4">
            <template #start>Example Secondary toolbar</template>
            <template #end>
                <Button icon="fas fa-bookmark" class="p-button-text p-button-rounded p-button-plain" />
                <Button icon="pi pi-briefcase" class="p-button-text p-button-rounded p-button-plain" />
                <Button icon="fas fa-box" class="p-button-text p-button-rounded p-button-plain" disabled />
            </template>
        </Toolbar>

        <Toolbar class="kn-toolbar kn-toolbar--primary p-mt-4">
            <template #start>
                <Breadcrumb :home="examples.breadcrumbs.home" :model="examples.breadcrumbs.items" class="kn-breadcrumb-toolbar">
                    <template #item="{ item }">
                        <span class="breadcrumbs-item">{{ item.crossBreadcrumb ? item.crossBreadcrumb : item.label }}</span>
                    </template>
                </Breadcrumb>
            </template>
        </Toolbar>

        <div>
            <Breadcrumb :home="examples.breadcrumbs.home" :model="examples.breadcrumbs.items" class="kn-breadcrumb">
                <template #item="{ item }">
                    <span class="breadcrumbs-item">{{ item.crossBreadcrumb ? item.crossBreadcrumb : item.label }}</span>
                </template>
            </Breadcrumb>
        </div>

        <Card class="p-mt-4">
            <template #content>
                <Button class="p-m-2 kn-button--primary">Primary</Button>
                <Button class="p-m-2 kn-button--secondary">Secondary</Button>
                <Button class="p-m-2 kn-button">Default</Button>
                <Button class="p-m-2 kn-button--primary" disabled>disabled</Button>
                <Button class="p-m-2 kn-button--warning">Warning</Button>
                <Button class="p-m-2 p-button-text kn-button--primary">Flat</Button>
                <Button class="p-m-2 p-button-text kn-button--primary" disabled>Flat disabled</Button>
            </template>
        </Card>

        <Card class="p-mt-4">
            <template #content>
                <Message severity="success">Success Message Content</Message>
                <Message severity="info">Info Message Content</Message>
                <Message severity="warn">Warning Message Content</Message>
                <Message severity="error">Error Message Content</Message>
            </template>
        </Card>
        <KnHint title="Example hint card title text" hint="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam"></KnHint>
        <Card class="p-mt-4">
            <template #content>
                <TabView class="kn-tab">
                    <TabPanel header="Header I">
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit
                            in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                        </p>
                    </TabPanel>
                    <TabPanel header="Header II">
                        <p>
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur
                            aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                        </p>
                    </TabPanel>
                    <TabPanel header="Header III">
                        <p>
                            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est
                            laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.
                        </p>
                    </TabPanel>
                </TabView>
            </template>
        </Card>
        <Card class="p-mt-4">
            <template #content>
                <DataTable class="kn-table" :value="examples.dataTable" responsive-layout="scroll" :paginator="true" :rows="5">
                    <Column field="code" header="Code" :sortable="true"></Column>
                    <Column field="name" header="Name" :sortable="true"></Column>
                    <Column field="category" header="Category" :sortable="true"></Column>
                    <Column field="rating" header="Icon" :sortable="true">
                        <template #body="slotProps">
                            <i v-if="slotProps.data.rating < 4" class="fas fa-times-circle"></i>
                            <i v-else class="fas fa-check-circle"></i>
                        </template>
                    </Column>
                    <Column style="padding: 0; text-align: end">
                        <template #body>
                            <Button icon="fas fa-play-circle" class="p-button-text p-button-rounded p-button-plain p-button-link" />
                            <Button icon="fas fa-ellipsis-v" class="p-button-text p-button-rounded p-button-plain p-button-link" />
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
        <Card class="p-mt-4">
            <template #content>
                <div class="p-d-flex kn-width-full p-jc-center">
                    <Button class="kn-param-sidebar-toggle-button example-button" :class="parameterSidebarVisible ? 'kn-param-sidebar-visible' : 'kn-param-sidebar-hidden'" :icon="paramSidebarIcon" data-test="parameter-sidebar-icon" @click="toggleParamSidebar()"></Button>
                </div>
            </template>
        </Card>
    </div>
    <div class="hiddenProperties">{{ properties }}</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import FabButton from '@/components/UI/KnFabButton.vue'
import Message from 'primevue/message'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import ThemeManagementDescriptor from './ThemeManagementDescriptor.json'
import KnHint from '@/components/UI/KnHint.vue'
import { mapState } from 'pinia'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'theme-management-examples',
    components: { Breadcrumb, Button, Card, Column, DataTable, FabButton, KnHint, Message, TabPanel, TabView },
    props: { properties: Object },
    data() {
        return {
            examples: ThemeManagementDescriptor.examples,
            parameterSidebarVisible: false
        }
    },
    computed: {
        ...mapState(mainStore, {
            theme: 'theme',
            defaultTheme: 'defaultTheme'
        }),
        paramSidebarIcon() {
            if (Object.keys(this.theme).length > 0) return this.parameterSidebarVisible ? this.theme['--kn-param-sidebar-expanded-icon'] : this.theme['--kn-param-sidebar-collapsed-icon']
            else return this.parameterSidebarVisible ? this.defaultTheme['--kn-param-sidebar-expanded-icon'] : this.defaultTheme['--kn-param-sidebar-collapsed-icon']
        }
    },
    mounted() {
        this.updateStyle(this.properties)
    },
    updated() {
        this.updateStyle(this.properties)
    },
    methods: {
        updateStyle(properties) {
            for (const key in properties) {
                // @ts-ignore
                this.$refs.example.style.setProperty(key, properties[key])
            }
        },
        toggleParamSidebar() {
            this.parameterSidebarVisible = !this.parameterSidebarVisible
        }
    }
})
</script>
<style lang="scss" scoped>
#example {
    font-size: var(--kn-font-size);
}
.hiddenProperties {
    display: none;
}
.kn-hint {
    height: 300px;
}
.example-button {
    position: inherit;
}
</style>
