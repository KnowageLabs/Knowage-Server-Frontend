<template>
    <div class="dashboardEditor">
        <Toolbar class="kn-toolbar kn-toolbar--primary">
            <template #start> {{ $t('dashboard.generalSettings.title') }} </template>
            <template #end>
                <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" @click="saveGeneralSettings" />
                <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" @click="$emit('closeGeneralSettings')" />
            </template>
        </Toolbar>

        <div class="datasetEditor-container kn-overflow">
            <DashboardGeneralSettingsList @selected-option="setSelectedOption"></DashboardGeneralSettingsList>
            <DashboardVariables v-if="selectedOption === 'Variables'" :dashboard-id="dashboardId" :prop-variables="variables" :selected-datasets="selectedDatasets" :selected-datasets-columns-map="selectedDatasetColumnsMap" :profile-attributes="profileAttributes" />
            <DashboardInformation v-if="selectedOption === 'Information'" :dashboard-model-prop="dashboardModel" />
            <DashboardBackground v-if="selectedOption === 'Background'" :dashboard-model-prop="dashboardModel" />
            <MenuWidgets v-if="selectedOption === 'MenuWidgets'" :dashboard-model-prop="dashboardModel" />
            <CssEditor v-if="selectedOption === 'CSS'" :dashboard-model-prop="dashboardModel" />
            <DashboardThemes v-if="selectedOption === 'Themes'" :dashboard-model-prop="dashboardModel" />
            <WidgetEditor v-if="false" :dashboard-id="dashboardId" :datasets="datasets" :variables="variables" :prop-widget="mockedWidget"></WidgetEditor>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IVariable, IDataset } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import DashboardGeneralSettingsList from './DashboardGeneralSettingsList.vue'
import DashboardInformation from './information/DashboardInformation.vue'
import DashboardBackground from './background/DashboardBackground.vue'
import CssEditor from './cssEditor/DashboardCssEditor.vue'
import MenuWidgets from './menu&widgets/Menu&Widgets.vue'
import DashboardVariables from './DashboardVariables.vue'
import DashboardThemes from './themes/DashboardThemes.vue'
import store from '@/modules/documentExecution/dashboard/Dashboard.store'
import mainStore from '@/App.store'
import deepcopy from 'deepcopy'
import { setVariableValueFromDataset } from './VariablesHelper'
import { applySelectedThemeToWidgets } from './themes/ThemesHelper'
import WidgetEditor from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditor.vue'

export default defineComponent({
    name: 'dashboard-general-settings',
    components: { DashboardGeneralSettingsList, DashboardVariables, DashboardInformation, DashboardBackground, MenuWidgets, CssEditor, DashboardThemes, WidgetEditor },
    props: {
        dashboardId: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        profileAttributes: { type: Array as PropType<{ name: string; value: string }[]>, required: true },
        generalSettingsMode: { type: String, default: 'General' }
    },
    emits: ['closeGeneralSettings'],
    data() {
        return {
            selectedOption: '' as string,
            dashboardModel: null as any,
            variables: [] as IVariable[],
            selectedDatasets: [] as IDataset[],
            selectedDatasetColumnsMap: {},
            mockedWidget: {
                id: 'CFX96d6n9KToHa3d',
                new: true,
                type: 'html',
                dataset: 168,
                columns: [],
                settings: {
                    sortingColumn: '',
                    sortingOrder: '',
                    updatable: true,
                    clickable: true,
                    editor: {
                        css: ' .titleContainer {  \n  display: flex;  \n  flex-direction: row;  \n  justify-content: space-between;  \n  align-items: center;  \n  height: 100%;  \n  background: url("data:image/jpeg;base64,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") no-repeat;  \n  background-size: 100% 100%; \n}\n\n .logo { \n  height: 80%;\n  max-width: 250px;  \n  text-align: center; \n  padding-right: 30px;\n}\n\n .text {  \n  display: flex;  \n  flex-direction: column;  \n  justify-content: center;  \n  align-items: start;  \n  color: #062E6C;  \n  margin: 0 0 0 20px;\n  font-family: \'font_name\', sans-serif;\n}\n\n  .title {  \n  font-size: 23px;  \n  font-weight: 700;  \n  text-transform: uppercase; \n}\n\n  .time {  \n  font-size: 14px; \n}\n',
                        html: '<div class="titleContainer">  \n  <div class="text">    \n    <span class="title">document title</span>    \n    <span class="time">Parameter value 1 - Parameter value 2</span>  \n  </div>\n  <img class="logo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABGCAYAAACJ4ts2AAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAOiZJREFUeJztfQdYVMf6/s0/iabceDWxixprVMSGXRQLNuxRrLFGpUiR3mEpUqWJgHSkiCxF2hZYQOrSO0vvS5O+FFnq959ZgqLSzM0vJje8z7MP7Dlzpp155yvzzey//vV/hNIm9mIj5zBpgqVfs6yeG93eL/Uqqwem/V+VN4lJ/G1Q3w3T5I2eB/0kIAO7L2gC/2Vt2H2e0KvzOED/U9dtEpP45CCG55xYc0Qe7ht6Z2XWdXEnlbTsuC5vXbrtlBJUdwDPp67fJCbxSWHnHUVYc0QRnEKZQkPXDGyDDOby3obwTJbQWM9OYhL/83APTvl1xQFpMHIOdx+6Jq7lTF28SwRKWuDwp6zbJCbxyVHRDktOiRjX/iQgDwFROQoOAQkWy/dKgbCaXd6nrtskJvGHoa2v93NaeSNBKaiA8CC0iBBT1Xjx/TSN3QMzSXG5V02fxhKekVOkyhtfz8DXvV9m7D1+x5ix5pg6LD+oAHc1XYozimv24HuM8vqlbuQ0DRPXaEJUWqFQXVP71OF5NgN8F1HeIK5CKiaok/MJMcym+00Dkx6wSfyFgMlhF5uvtk+fDD/JPoc1cs9B0CiwziuvVnB4uge2wVFbz6jC7M23Yfk+SZAxeEYnxxdx4Xse1GTitxvEYdYOWfCLzDXH15IZxVuvK9ikLN4tBrPQM/svaYGuVYDp8DxDiupszz2i9XEreMNqWQ84Yx4KEeWNDn9e6ycxiXFALX1F4NcLgiu24UGBWRXcXukVN46b0pi3nyZAYFU3N07jQU4ynr9NFKT1PVMj04puGD8NdV6GSHJS1KKOYEfzXb5PCm6pOzEFbhgx1p9U7XMOSiftv6rfsfawfJele9iDsIScK1fl7PKW77sPHuS0GzjPotaOe6csIrpuOcczUhvaHoSWNVwRsolmHDcPby5p6RAcs9KTmMSfBWnfbC1uhecQVdX+xi172aNIaJOaH1hGl3IG6nmJx8StZwmMhLzqpUNpLJ7HOC4XUIT/bBIF/l8MGLWd/SfoxXWHdl3Wq5+2QRS4j6nAU0qa5VD6tMreq7sv6oCMjuMj/N03vYC4TcsfnufXEIbSOGczCft0A+FlQTnxT2n8JCYxHrSpubprFJ7B88zKc7UAn+FrqtEsobXKPuCRXi3SNjDw+UU5O2++izo1IUnFa/H92l6Ypm9Hclt9VAXm8cnAnsu6jIR85qaAmLy9e68ZtM3dJQs8x9XA0jPyYVMvfIufiS9uu7vjvDaoWzx3xN8dEnK9d+kEQkJNAwF/LwGYZplQZnXUiAz08hrnT9Qdk5jEu0ioa7570SoUzlrR2izodYb68d1CshFtpiuVg8Azr7WSUt7jZBaa3/bd1vsgrOXJcA2vFjJwfum5YLsI3FRyrLF7kRi8EqlbdzVd287dt+pefViORYxiEHcKaTLXHJIGa58kFxcaU+imqmvHv3cqgE1URZZZKvuqTRKzbZM2BZxyWET9+A4h47gae0FTKtx0iK181cVe9Kn7ZRKT4KANYCqttFHuqmMMbFD1gzXy3rBU4QXMlCPDCnk/WC1PhKVyfjD3hhvMPqAKc7eJwJI9EiCs6UaKZTQtZ/XAZ9ZeMRb/Rkb6nJ3S8IyWY4DzpaaU7BIluJUt5EPXtwrDzMM6MOv2c5TnC04Zy+RewBxOGb6wVt4LNmn4geTzRIis7vj1U/fJJCYxItr6ev/T0t+/N6qWXbFWxQf2mEZxN/T2fnHb2vfqEZNQSG1otU3OKSGU1bXsHXrG3id+7eEbxgVLBZTZC/fK9t7WsK+IyixdNXQ/r7xOIC23gkCu7H+0mUCCx7Elivi6jAvp6k5df8huaU9t7u8zaRnoPfIJmjyJSXwc2qH/M5uMDsm1yn5w2DKBY7hfNHQTEjSjIYK0EIanDc1smHX4ukHJxhMq4EJKvEOwChJdc1Cm9xdZKwarH74YntYuF27wEsjgmFCujb8LP/YW2oUM8viaxnfynMQk/pLwi8xwvafjyRDTe87QJWfXLlcKAkF9otx5LWuhq45hwdsMwkAziO56SctS6HFwlFhpV+9hIi1DesV+aTB2ieSsXTSw4QtxbWev+dvvQgGr/0hhS8fFgLwShlsqg2FKL61brYZtDJrDeS0robvukdR1mkFgRkqs/1XVhSFv5MMgx+WYIZXti/HqOolJ/Gmoae2Zpm9HjlqwXQyO3DTuOnDduOu77TIw55Yb8OtTQcCIClt0KLBYkQz7DEPhoBEFeNV84aRFGFiF5nZxH1YBJ0r122BFB4rBrK134Xl6HRw0pMI2TX9OHnz6YbBAkQI79ULgkFEIbH8QCrMu28JsPik4etu0+eB1Q1jMJwGalsEGn7I/JjGJd+BFS7u7SuA+6NuHRNW+hqUp1TBNxsQ/dM4BJXCmF0qXAwhZJxXSj5iGg39BtQB+xq8GeI+ZhrEOIamy9LAq3CW4M3PK61dlltUfOC9tw/rpjC7s1guFO0/ju9M6ek/hZ2zz4eYmLTK4ZNY8rkR5usYx6Av2y4OpR7RnQz/MKe+An4QJzxJ2niOwKupbdnzaXpnEJH6DiXssYfq6q5BWVC0+dM2eUnF+2oYboGdL4niUHkVmEI+ahIDLyzTuoTSapBQin1YASJiS6IsE1YFf2btvp+yzgeUnCd0mwVltq+W8wDq21Kwd4HOc3i4fbmzRDgazsNy7+LuhUwhxzRE5iEjN/3koz4ceiYR1xxXBlxp5/s/rgUlMYgx4haarLNkjClbEKE/8va4Ppmnbh7ot5ZcEwTuWHEJ4p+cTsVplk1Qqir+/AuBSJ2XT9+r6g0NcvjQfIQB264fANm0K7NULYcY09zxbJfcMDMNyXVgwaFM8y2lO2KIRCP7ZdXL4u4tfhOmK/ZJg452g24ZI1NQHM+4QnrlvOKncllFcvftT9cckJvEOUguqZohputCxmqVi7vvgtoqDNl7nuK7gTIzK6+NE1hZ39u46ZEIBAWMq60FoClErJCtxk1oA/Po0PvGUVQyBVzMQiCVsLsPInMObEZHcU7JjL9pEMvkfkMAoLD2WQEkm8uuGwE3HOEhqAw7p6jsG5t9UcqjYfEq5z42cZKn0kEhdyi8OurZk2qftkUn8Y9HcC195UrMP+NMyiERq5tXcOvYCfP1VcxvXDRUn1uwd92H2Dkk4K/mIXt8BM/G9+KKWWZ7ktFvu9NK+S7YJsEmDBDu0yWAcUciMedW2Uso7g7BG3hO8GVX+OpEFxG2avhCQVWgRlJK1VNQjjr5NKwg2aVLgpkMyeEQXlfi+zBVCts4snHdUduXK48JmzXN33ocftoqBisWLEmZ775zBchu4PEhJYi9oaY7B8cV8n67XJvGPQEVbz2JZQ3ffNQdlBtYeUYSVB2TgtOhDJjkhl7N3w9QjJm/ODhng4pMDU7dwf3ztiXcc76EbeuV41+CaI0qw/LAKaLtHMRPqmsE4ssTTKDJXOqa68YTwUzpjvTYVeAjB8ItDjFvyq5YtBrRcgkpgrr5XavEDYSN/5o8H5IEblbv6oBycEXuYEZFdyZ1V2TL9jqZnxHRecfhxvwJYe9Odm7rhG3dqzr5D13VYPwnIwppDcsAjKA8yD9wJ0ckZU8ds5CQm8Xth4hRmvmyvFJi4vUy3IOZy2xFjHmw9q9519LZBvbX3S8b87aJw8b5tynUlx/pFO0Xg0bMI2oFreqz91/TAOTjZ1IyYx61g4h+wQFALNqkFAg/6rFH0AeUXqVUuaZWsefIkWKJMBnVyptY1p6jiVQo+sFY1ADYo+MHMvYrI1oj1dyAVbNK2phhzH1WC81KPmLpPgrIX7hIHWWNvxnkZG1ghIAcO/vHZ285psI7cNkL/Jys4BTF2qVoQGcuQ+uUcFC/9qftxEv+jOHn7QSD/JQIUtfS+8UQ9p6UqrjysDP/egGwOZfuU+OyyVaHJxeuvKTtV/3vDPVh6QKnNyivs2FD6zNIGHn5VPzhkGgHxDZ2KutRcy5/UKbBIiQpCdnHE07Z0+mIlMvBokMEjp845vJqlvl2XAj8bBMNQHo2v4VuX4BTj+bukYRqSHOJ6nhFlLT1LycmFu85J2TT/e5MYbDxNgKjMcqmhZ4prm7Yu2ysNB2+YEP60DpvEPwu3VayjtpxWHsiqat82dM3CM9KZi08S5u2UAYEbhsyg2HwBr7DsE0fvmAO2CxbuuQ96jjTFofQpxfX7tst5goDpS0hvZ9MMI4pcVyiTEEEocNkjlX7SIZmxWCkYflILAv0YprRNWs3JzbpUOEzwh/JXrRyDv6Sli8vMM5Y+c4sYzN4uARekbUqSShp2uIbkH999Ra8DX/uRXxpeRBdpNLPhS/wMo7z+3GI+caSaPSL86R03iX8GbH1SJNYekmffVLYrsfQIM1cwfk5fKXCfLaHtnusTnmO94bgy7PlFv373ZX0WzxE5Fim+6OmvKo4lqw/JssW13fyNnagG1xXty388rcvepkNi8T0gwVZNf5AipsbZptaUcymSYLkKCaQC8jWuOcTRt2j4w3adINiH0nEdVQUpPY/CJ8QoW5RX+jJ+SVAx908xdYs0WSUg03NM2Iy59awGa8d5DbYnLfvpJWmrpo3HlXt1bYJirZ6Fu5yXsqzbKCjbQaQmf7BXfhKT+EPQ3gefW7iHq+w8qwjztt6C1fuReqPlEsYoq+PsvbDyTbGet1sOGcvKEBRfwNnRl1xcu/KelkvMqn1iMG+bCKy/YADGYWWp5NrXQc4Z1USPrHLpyLqWw1fsohgbtMjArRYA521jnuexurnc00sJpPKm+uimHrCMLIUVgmowZ8sd2CgoDUZO5JTq9r45rd3w/6SMSOb/QarWisOq4BWZy9mznlpWv/lXlSeMFXtEgWvbryBwVQscvCMvtnX1fDZeOxsBtlUBEIrRpwx96gAUmwHW/95+Q8+urgWQLRkAQgXK7xWAeDv8d/FiqI5LUR1VS1F+NQDqDQArx0rfBLAdt6V0sD1iv7fcNlRv9LzkUF6obMUWVJffmx8GassWlKdq0dv+ufvf5DeE9sG6ipejPCvRpx7gErr2//6IvMdEUXP/Hu+YGqGcmh6h+t/O0E0vqr544Kpe37qTqrD6iCo+RpSZkF/HCfdg9cN36ZVdhw2Di4lHTaLhJ1kvWCPnAdccY5hPYgt3SXlnEtYpeoNnXp2nQUw5cYemL5j60IS80sulL9m8ZOFDIFbJEUHoMR180mrr8171Hhyqi6lL6I7NZ9RYG3/WgsV7ZUDwjlFhYHwh5yCI1gGYk1LGPkHLaBVidsDW8dqV09SuaETL9L7rntR2/FEk7NIjA98DCpywiIQ7bikdDyiZxNTaJnWU75Tx8mrv7v68oKVd3DQix/eWc2LDMfMI2Iny2q1PhXM20XDPPbnQP5dJLGrvHnNwWYTlmV18Eu/3MCSLM+HUdfdstYsv9LzqlJh30IQGux6QAed91y25MKygyrS+4/U7J7rkNrUdV/PPCLhkE9PApx/CadNZ6yi2HDEpIquh7Ub7bztAhyO8uptL0z+deNE6zvdJRBpnwmnr7ZlCLaomSnom089bR8MeAyrw6ZFA0DwcrjskFBqGMYjVXT2/4naP1zdDKGN13rWIZHhdd06sEzQLgx16FOBH+Qo9ie6+7RofFVfd4F7TNzAfpzUiZ0pfd6ST1HyTiPndwDWUB5p4uHReJBMv2cb7q79I4ywg1/bD4qjKeqKERyJDCNV1N84X9ftVhzhQC8yIzW3ukHm/LsllzLtX7OL8f7GL840uaZjwfiKriGzTi0/oflJu8b6jJkouqtx2WtS8eutpFaaZC1XA2vPllb2XdeGOuktfFKNxNU5TxOq03aTuD1ccYhjxNSzZ4MJag8PGlL6zNi+rzaJLSjaqB0JoU9c1v7Jm4maNF6DqESAqYEhi/fw4nBVV2SCdWNOofdIijHnEJARCqrs5g50Sk8nFd0GHefKuSV14atmpR88i5TadUu29pebImGgD8Sp9TPPrvYZheVmrCaEwW44Cs2TJMFfWH36UfwFL5P3Q/wEwU46ErlNglXoIqJMYVRRmm0D7AIw4GMp6YI9DCjNmj2EYLFWjwTylUJglFwzzZAJgrkwgyosC38uFwBx5Cpy1jYWXVW1E/KJHygsNfMZMVJ+brrEQ19RjKeKZDHNQXX6QI8N8VK/5qJ4zUV4zZGmwTCUY9Gi5dfl9wIVmdi4io4Z+wCQClU2G2bJBsAClnyMXBN/Lh3Ce2f0wAnxzawPeJ4lnGfCcs02ApSqhoBkUX5fa2KEq553cwKUQzCl3KK8FqGz8//dyVHSdCgfNXsKjuBL/VBj72KWyXthqlVjhuUMvhFO3GXIhnP6dL/fitzxJMBP19WJlCkj7pHcw2rtl5fwYibjfjlnQIIkNb5xESMpzn7OicdJLEDML8zq7VdAzbT+iZ2fLBgMXym+ZQgAskg+AH2QH64n7xD+3ll43rM+ZrR08e4zDOPkovMgqaRkYmDPe2MlpantwwCxyYJZ8MHomBUZN6EZJ01i4UwTM3UII+HtlG0w1cI42XbjrHmhYBnFOR3RNyiHu0AkE34K3ByyoBqZQ+HQRMUpeAa+iLxx7FA4HHobBLm0Ky6eoxXANMuZNI/Kth9LLUCpv8xKCICjvlSH+bu1OM14lIA12L+iy+Hv9a/hGwTTQk/eUKjsuLXdCpzIyWF3nxTwTXy1WCkKdQ4INuqEg75fZo0Ep8tcKL9PWoJVpqZGL/WV9Mzo2auMXiuwhBRLcdIzpjHzVsbu9f+CdwVXb08trEp6fu0odEU0hBFZrUOGGM71bnZSfe9WNQRAh5lrK+GY1HDBFA1ceDXREkuOWkRBQ1DjiIRN3EEHwS73wNB5uuqXCfPkg2KIbAjLEtE6tMCZRiVxid987s2mjFg1myIciApPhRV6tS2RVO3G7DhkWKATBzzYxoBNaVCcdVGqoSikOuuRA7+FSpHKIctgsvDW1oe3Q8DK9ywfWX3BIgkWqYaAQnDwg9jypD5e7WDkYzj6JAgKloFjCv8BY2LtAW51UkHHuSQz8iO7NQAOYh0CGh+idtfb1jShlX/X0rXwUVcjgIYRwBiv2WF52jIMH4SX1iuQiczXUHg1yHvOsXSzMV0STCipXNTi7VyOslEOkoxZhkND1liAlmCDWEZwJ535QEaiSsgcWygfCWg0KKAXkdGuGlDo8iKwgKJNLjKV8sgZWofeBJxwBoxCgN7FvDK+bYURB3xx5Muw2fNmXUtc8bkS4YWhOxCLFIFitiT2uDaMfEmLmRidM57kGEcm5b0LWHYIrhKavvwUKRl6ca6YvM4mCaPaPZ9b9MpRG4UUScacuGW7r+8L3/PIg6kyHK+ZoNtirAFK2EaxVSBUzJGcThtKbZvcL8RKCISCnxgt/N3IKJa4+LA/BsWlvdhIaP40lrDumDN6UmHHP9W3p7pkl651UOFt+cEZXC87qiqpqV2UifR5JljcvGP9fDbD4ZU2HiiYlF810VJgtQwK1FykN6az+ZUPpkET5wimh2HcZItt/5Gmw3SgMiIzavIzX/SvqBwa+H0qH8pof19x3QJOcWbFUhYpmfxy6HwLF7Z0fvJQ77skMPDC41MLQjEiGE1YxEFHVaohmvyU4/gx9PivrG+CKrmqNWqERhvJChPRIhZ9tY4ALDS7tkLzGnPYeQaTXz2zv7/sMt4XxeuCobXI1h+xz0GBS8M/SHV6md9nA+jM2iWhAhsFPhHCYjWbIddrhSNrUxKZ39vIim+FNW1A9vknp6F3vn18bxaMTjp6hwnr14F7bmFzL99uC4ZxQYrtcJYhD5j0Po8Avt644i93PjWyoWUNpUF1n5XTDTvcMZsmWB+EwT4ECK7WjOAQRfI8gHAlijculwY+akTBHkQwnreMgoqKZimy0FY3D3iOyQzY7pVTQFitROZLLNCKvGb3rN+8vrrHHdo9ROHq/wSDpmTRmuBKylQ6ffoSlMxUkPNOgbABGH28RqQU3dgmpwUUZa3pEdsu+sKymY4Iij6NmCxJAlVIm7V4JQrpRxfS9DyPBv7KT6FYBQhYpDaZ7kG54BonlHwXw6e5eQZwGVzdOu6PumL5IQAlOWsbACcsI8C5q83RDeXiU9NPWadLAjdFc6IryMI8uSpkjoAzXVD2Csmv7TpBS6oUEbhhn7busxyyprBtRZRlCywBMs4svjlquglQVBTJI+6bV1Xf3Coz1DEZVRxefql/qq11aAWATU0hPbu56U05cQy/hqMVLDtk2a1EhtKzRtKF/8ESWkdDU2/u1BjnTayF6qd8jktx1S0wsZfevHZ7mjkcyYzoi23T5MDj0MASCCqpVkNT6QLVr62VP0aLmoMGMZkiUHqspKkFZdUkt3aveT4tR0AOCh03COGqHvE86Cxmwb7YHuBYD92mrBJiOCDIdDTw+/VCglDTRx+sbSmkTnR8NsO+RJDlsFgG5bDg1/H5MU5/4CWQT4PvbdSiQUNdGbQIYU5UJyK1zX0egctqPPyNLEEQQ3EeyobDtARVimC0Wo+VXx+7h+cWJ3vwDekcn0WRDYrLfhCChPuBV8M3IwhPHbsNQyGLDiB5PRLpvPXKbLRbKBQBWO82ii8zH65t/mbuGS+GQjsV8YsDFJw7f8inCbBFvWHL/OSyV8gCu+94wB720H+97wnKpp8Cj7A0aQVngEJZL5xZUhmdR9W8YaOJMNcDeKr+sBpKwe2LHGgVvWIbzkPZGuioVFqG/y6WewaL7RJh92wOm7ZSBJfySsGCHGOw4pwkugcnjekHKAASOmlA4B0uIPU8dKO6duOek9DVsSGmBU80AM4Zf1yVndMxB6hcW426ZTHrDOLo4BqMbFiOVq2MWemHcKv7wOK6EMPw+liBYGmE93zqugNY6xrGq5vG15ktUkT2CBtJGTSokt4NoG4xsJ7Wil3zbI60Q2xSX7KIA2S1vBsNTRJBT1nQOOfDkYZNUSawaxUYaDhyhbZ9aRVyoSOIcpvEkriwW9cH8ofsPw3NZs5FauUKNAu7pVfTGYfdGQynqQ3VKftACJA3xRCFoPrIEmS4XCvOQvWERU5ZbNUzCjQSHxGIG1hp+0giF0OIm1+H3aBWNhDXo+hzZQLCNL08ZyTZMahvglvFORaoaFQTMY9lF7V0nx2vHv1rZMMUlMOmmtK7DEyUTNxebqPLi1Yov4O6zVIVNmsEbZP1TIvgRK59lVUU7xRcrGITmCeKoXHdK+iUc0yX/0J+jw2VWNE0T0XRJ/WmfJBQ09a/wrehaIeuTsc8iIu9Xs4T6ILzCfsomVmzRfT9upcA06mZCALjF5RaqP3oWJKFhY+xJSROq6oQx462wUerMYN1ZJOvHmQGsE8oeoxf53biNHANN3b07TlvHwALlUKRT06vyWJ0T+m0TNEg+f5ZZY7oJ6bFzsbHnl5XcOKwudxFB8MtfpEyFnAaW8Vh5GSazz/MgWwQbs9ecEnvRgB3Tc/eLS3LATGRkH0GzcuxreLN/5i1BQmCfSSQbteXSRNqCUdTJPnfANIo9A9VZgpgCCZ2Dg7mlr/97IdtYjnS9YB/XUtnVe2q8vIaQ9Iold9zy5SBBRpEguI926YdAeHm99kieueEgFzTQF6uEov4moUm4mjr8XiW7b9F5O3rVD6gPLzvFA62W/cG2CXJhgy8Pduggaa1OysxCk9ZXE20LB1jP9Sl4bcaj7Ae7HsZyGmOBbJCjpqGQUt9MGJ42k9n51XkpSxreO6LvGGItZ0QkrdwvCaIEpw8OfrPIGhDi1SLDWgKFsyZhF88gcg6Oq23U+pj6ITIstI8vr8Kek2164ZDb0vFfx2eVs7oI2MM1R4EKNnH5E/aiYZR2sLeds4kr5VKhgahbPCD99s0AwBIEG9PbDaOgpbd75lj5uJWD0GYdPPsFwy3XlPDxyhV7nkGch/Tt/Q9DIYz1Vod2LgHuEzbxnBlS1DP2o9qCcd83lYFVt90mMaAW28ppS11Xj8RqZCN9jwbyo6jcj8qT1d8/455nGh3niQmSOJKKhYh3xiauoup1z87x8gsparZaqRHGMdafp5V/UJfnGVX+y5BtOB9NWLb04ujh9xp7er8XeZbC/AGpxPwmkRBazhKdcENK2rvukXNLiMRUhu+TxMq6lUr+YBSeSfVMzSVqUlKZ2MftHs9gWHqGPLN29Zdset3PMaCoqaWbrkhbMRbzywEOW7mj7uxf9Oo1R7SFJeVNe+xKJli60YiPIgvpPOokuPSYoq5g7yukEpBE36AVDK6pRXleKTlEWkEZsfx1989j15LjO+c2i8jjqC1HLeOh5nXvf32Ob0FThysemHOR6PZKrxrdJz4CWvr7PztsEeu7QJkGl2wjIbv37QC4yyEIFU48iR3djfgbAl6B0PYHZMCDXtInY9yjV+95pRMXjEYQ63iOW1svJO2jCfIoKofjml5NCAPJgCKOFKtoZz/AMzb27Pnn1Hx0nkpBacQfUH1GIwi24Y5bxkax+vpHtfmG4JRcJ7RGM4yjXnukln1Ql/jm/n033JI59y/Z01mv+vr4h+6l1LeIb9UL5dhR2OuFyl89buXr+2ExMauKzqsRABtVfWCnjj9sJAQjnZAMW5AKtEs7ANarB8D0U+YwfbskbDqlAgt3icHxOw+b3Sjpp1JKG+comQdQZ/CKc+K3FM1IBJyv+mOS0M5zWqxleyWBFz3z3XZpmHHhCWzWHMxznUYgLEAs34bK4NN6AetUfGC/Pgnc0iu1x6pvNepUw1AGx+Ny9DEiyEeI+9GACbIADQAu5RDwyar5KIJgHLGMJ3KphIOQzUvI7H1XgvyAJMhFh2hoY7PHtGmi2SDEZxAEC5G+rkNJmwBBMojzRyAIVrFOIoJgVc2AlvHRg9kqisGRINxI3dOPKN+HrzE7enTmypORWhICL34HQTSC04i4PqOpWNjoPmVF92/r6x93oVKVXLprLIIg++wb1/Q6hwVy/rBUmQSeOXVmSCv6Gtsj2iGFEbOR5rFa2R+CqtlXJ1T58LI6RQH9QJDxyWgLfdVzoW1g4LNH6WyJ1SqBEF7bnlUEQDBDM9FsPmnQc46kVnfBIp/oCjmeIwoDuy9o1Qtrer6cv00YlCzIEb+qexSvwjaJOYm48bgS8J3XZtEyGoQb+mC9lAkpagafLBDTylJRxxCe5lTmbX1AAq/CmjO4Hu5lA0InLWOKT5uHNpZ1dI0qSZBuvto2vqzve/TCNumGQlZDq+yEGjoGSlte265QJXNckk6JRR81AMrb2UtRvRlcymFw2yUOKt9TsfCi3k33eEyQMWfHtwQJxjP/hCQIViPeJ4hLySBB8DqFhFfcx6tY3tg1TYW9ZjFgmtLBUYdfYRWLEM7xmplF5nxUnm39/dMlvNKiMAmOmo9OkEsOCTREkHHtgUGC0DiLkyMRBKOgH84dNIuA2UhqKb/IaGYOAG9iR5/QOZtIDrGuOyewmBMNP5L2zdZeq0gEem3rEeyXR2z7f665r7XWKvlAUG4dAac5JmxK3HhanZ5ZVv/G3+0enKS67oQG/If3HkgbelcX1nZNi82pXnZGwqb+2w33QOCGCbiQs44Ppc+p7xfad80AZPUc7fB3J44NEgDmgdFvOsw+vZywi+APYQXlXqPVtx5gqmNGk/FcGX/OQpRJdJFd7QQ8TmOhtqNnzvHHMRwb5IpjTHFBZ++4Xh+MlgH4zCurSgm7PRcjQ1zYLTm4Bt46GbCKhX3tt9zo0N7FHnN2xATZ9ZsE0Q9JHZcg4sQMIpZ6IxIE2SDY9kFqC7uko2v/RNqCUdTRdWHQSKe+Y6Q39/XP+dkujiO1z9nGNZR09O6ZaJ7ZrZ2yQrbxnLWT9928xcNUrAv28VREkHE3xE2EINhpo0XOomEXPK8uDfyLWZa28eWFC5XIgBeB3VJKvFgTjadTJ+cbrJH3gvDyhiv4O5oBZzinN0RsRaoQMav2Gr52Xd6WuOWMBjM8vYTjb28agCmKJt7+P+6VBq7d0nBc2LQ7Jq92xxO/JIH1J9VYi/cqwKqDCqBsFkQYKic4+ZXQ1jNqoGLsyvFzk3JKiDsIL8Aqofx+82/uTJuUSgOsbkUUlLt+UNFhyO4Goa2agZxZ8qZbEhT0gMqEGovA7AH+3M4P3bw6wekdXApkWE8IAb9c5oR+fiF/AL6XIGamzkcvYhNSQx/HFL1pL45rEvVIyZ2vSIU7HhwJMubsiAmy2zAIlirhk18yAscrW843M3CxYjAcNguFl8MI8qJ8gPfskwSYoxgGK9Uo4Jv3iljbO76bF/eHfXKV+0IkRefKBYFNbEls/TBXrhEtpwGHyaxUDwHXtKpYlH5MpwMGkvbTLOgVxCVKg27esQhyeaIShFQyLkEwMptYirsNwjpmIdVOk5YPQo6JnAXJczYxzTVd7Inbrcn1reKXkeg5YR7WYB6V5adNzaLx65OBQM6GlPbBxlDis67itYr91/SZKo8CiRdkbenzdwiDhnVQoV90ngX/JW3Y84sRa8NJdfbP4uasKEaN9F01R+Yyfgm4Im9Pw8/svqTTse2MKtBSKjhhJMyuft5LdlHMIyY0tnl0LtUwPCfooHFo5w2XOGY1u39MNyt6cVya5JzE+YoUpBaRQME/vaOhu2/feG2tYfce1idlsA7pByFjnJmY1/r2FPmXdd3ah81fcuKdTphRIbOlU7qpt3fMGe1pcqXDGjUSzFUKAwnPlPSizp43YhsTQswjpQCvRdx2i4XxAgFjukBov3EwLFEIAFNa2rgEUfHPpC1WDIJDJiEQ1TLwRp9OetV35SySILMVQtGHAqcskWFc15aI6jNmkGZMFStKELUfD1a8IS6z693VZWT8Kp60igJsbOMg0OTGDpvWgbHd64k1LAd+o1CO9BjJzVs8TMU6bR37ETbI+ATBMIrI50jwpephHPtpjkIIeGZVfbTa+S965SvTUxbhXetVA5ERHQi37V/WZ7J634mHsnlGe8QnpF6/+pAcrDuiwLL2jIioaRuY29YNnxEjMn2/XS8BC/YoQHhGFcfIbunomqVu+jxs3TEl9qpDsiDwizbTg0QnDM8zubb5/jnL0PpN2EGg7g8XrMLqE5gTi8as7mKLiHgkdGDj7we5UCCEZHUlvOrURSrOkvfT4sC2qLpORZ2QPPhRGa++k0COmNiS2fh611Ca9gGY6kwvDsLBcXNRR15yiYegggbXIjT7tgzzzdf2w5wU9JLtE8pTtumjjkdq2R79UChpbVd/v1xhpGLhvG4jGwQRZEz/flLXwI19RkGIIEHwkDa+iiWJVKyFqB2HTMMgpnng1tD1hLq+86et6DAHkXapejgsRBJs/8OXEFHWRM3rAe7G/oHv2nv7OXXBoRxI+q4ML2sK3mUcBTNRXXnUSL22sflWI5XpklBkv0J1MMBR0DoaaBUtxaV9sLJ1mFqJJq9v8MAPLKyLOmoZwxnI89RwrNnooSaYlIKPoicktdU+giDPsxsPbiBQEDkH11r2GodCcDV740TK+QAlba8FYqvqCQm1jXI1HV0j/j5HKqN8ln9o3IaX8TlvRLa2NfXG5lNqHYfvmrN2XtBlH76hX/OMmnhi6H5EfMaygPD4DXnl1SPaCWWd3bvjqxsI+Id0Kl53j+sHH460pk7lG0/je/B+eBxisPVBKCj6Z7cqBhVZm8SXEkzoZQSV4CIHJb8s1mbdUI4bd7kqCe640jtjGjoOoBnrnUFb1dWz25iWX4+DFOcrhsA6TQqIuMa3yr3I8dYNKzNQDCzUJQQzyi/Yx8BCJez1osJRs5fgm1s/crCi+2Cw4i03DkHG1HnjXsOlAxwJEggG1FTv8dou9psXS+AhDaJbB64PXc9r7jP42TqBE/Er7p8MN5/GwyK5QFiP2iLsngS2cRWVHuk1FJO4sgc6ocXEO66JvauRFJyOZnlulEYvLNeitY/9zUhlvmL3LnkcW1zIo0nh5P+TOhXEPVN6dGjlwSbx5dqGceXaOrTiuDseibBcmcRZPMURzDKkIs4i44heLKtBgvxsExeI3se4dsFEVSyM8n5YIu2T/hq/g7myQUAgZZdWjxMe84ciIb9p2d5L2uwDV/WBnlu584l31OF1R+R6z4qbsdpHCZP4I9EE8GVOS9cFs7CcumXKweglkDl2yRxEGOzhwUYsduvhGW+WDBnPjvA4Or8qtaVr02hhHKVsOBiUX8vi1fBHkgbp40ohMA/ZGEtUyIB1fkyyOUh9wVLoim0k0KtZjypHcRLcdUtizEESDhESG+ljqmuYIPuQDbJCORAehqb5j9d2iedpRC7ZQESQUEyQNypWRmOf2BmbBJglT4X73lHFOS2v7+uR0mAxIjSWdguRyrcEqWY4hHw+6p+5iqGcoL1DaHZ1TCxxTesbe2W5vBd+9MqqdtmpO9i3eNENB2Jih8k8hWBOICGW6ktQXyn6pXYUtHdfk/fLTsaq2bH31kHehruT4cTjWN/3J6yRIO6Tu5lbE71PNOCfjUMQJM1WaFLyu3FIznYdElAK6z5qUfq/xjNyivpKAVkwco17s5qtYvLcdi7vbUgv7xo3IvePRHJtk4NSQIr/VceEjsHNSEhX1guBY0ivvuWSxNImpROTa5pU2vonRtyM+hZpbXKG7w3nhA58LvE+Ayrw61FAyDoSJNyTqj3TS4mVHV1jGnuPwvJMr9jRfc3DcsZVH3K6YYfsMzrxhl0ckZhaPG50gHUEQ/qabay3uneKX1rLwJtgxbyWPgNMEDzDS3hGcAZQazf7J0pBFVHGJy1FyCYa9hmGcNpz2DgExNwT23RCMnzLO7o+6oeLcptZUg/DcgJuPU1iH0Yk3fmAzNmIddk+FhR8UvNiy1851HQPRvk+pGZKn7eNJaq/SCbmsd86DPC+lwcBKcRLT+KIGn6ZE4qIsKOXrhB2paNnYomUnMoxnTPRdeyfdxjQONsSFHxT816xexZ/TBv/azj50Qn4rCvboMIrQ9cIln6687fchqjs1nN/amV+A9KrjzABCCW/bSutBVBHkmbb+E+OjAYAvuoBIBT2AaGon7NNVRIZp3+Zn4hr7+97Ry3Ja+l/QxDx3wgyBBbArDq8fRhvR8ZbZFGbXvXB7/7hIryFF/XPkZrftjj/1t9i6PrHxTf9H8E+rvglDrxcgDSAGGbDn//z4n7RJZt4Tyizj981Zj58+vKwvmM4duWW77mg3tHYD9P/9ApN4l85zb0qgwShguTziI/32PyPANmzP/9sTW/BKvdlZzo0DvyJtsdwGNhRTVcLiAPXThGYu+0ObD2t3OVGitP8JJWZxL/cSmHtqSfxnB2C4v9ggjgkFhFXqJBgkTIZ7JOZiZ+0MgklLTv07WnaOrZh0oy67gmvsk7ij4fLb7FY/2SCvALYccYyohob/5ccEyCta4wdg5P4Z8GtCO8HiR88COEfSBAcLuWR3/brUjlfmCcbDGqkQuvxn/obIKOgcoUPKWb9C1rc7nB6BndzZ//Xvyef8tqm7+mZhVsDIxL2hcRlHEzKLlnze/MajrLa5lmp+RUn6BmFv6Tmlgm8auma0T7GOV0pueVcftTYTZSYlP3JuWUbfk+ZlfWdU6OTc7n9KLG8gRGJ+4LDE7nLahvH1KUjqnpW6QSkdl+2jYDHtMRPq1p8AmDHgX142tOrT2gg7BLFjmI2jr9j8K8CS9eXYrdVnzJUTYiM9r7B1VcqPX2XxmM/Gt/lB93LDyrBj/vkYNNpDRDVcSsJjs2SmGjejLL6JU4B0fYn71nWbjitCYv45WHJfnnYKkTou6bkVBKVnmfcyOrkRNS6ByYY3VJB9TDzZeSWVC8bno/p07CAWyouDFPnYP+WXpiRVVg27cXLVNcTopa1G89oAvdxNdh1URfEdTyryXE5+u/XI724co+VT1TGrgu6rBUCCrAY1WGbkB5oPQlkJBVUnplIW1q74FufsKRn1xQcizf/rAPLUB4/7lWAtcfUQPCueYPxUwotNqPwg4gBDLw2VAuwohSA+9UALJho//0vgQkwDbe/dNihDn8LnBG3I3zFIwo8x5WguReu6dnT7FceUgZ87et1wvDv9XfhW/SZyiMCU3iQ4b9bFvQcqMT6ntGD7Zq6YZpLUJLinisG6HkJ9KwEyu8efL1WBL5ZK4z+F0fXxOGHreJwVcGhNrW09aTiQ1//KWvFgOeEBsSgGXp4fieEHzOmoPJ/VbPpyq3tUL4obd0xbaMYfI3zXCeCPqLwzXpJ+HajNMzfLQPatiRSdTdwtfbDt15hWcZbzur0fcUjhsoURWXf5fzFbflq7T3YelYLfCJzxEdrC4Y7NVPispx937/X3wNcx6koL1zuN2tFB9uybrB9m85og64dJbCODX+ub38S/3c4I+7AIQj3cXV46BoJM3nvwQ9bxOCU8MNma2KChVtoldBjX8YNQ8fQlBUCsmhw3IO5O6Tg4dMI95Hya+mDr03dwqPm7xSHL9dJwncbxUHwVwP2Q8cQhqQh5ZKyRfgtC/fIjHNSZl3TN9/jEO+izBMw9YhFg08CeE5qjkAQK8aXqNwryvZwTdkZEUMEFu6+D6rmPnUmrrG6ypY0McLjICbXTglU5j2Yt0sKnvjGubuRM8xWH1FCdRCF3ec1u6y9YlKULcNvGzpH2V6Rftz87QZxRBQJ4L/6gJVaUHVgpPYQQzKkVx1ShKlrxWEaSr/nkla3gVNIrLJ19CWCbbyQmVu062VZy44FO+9zSIfLUrcOSqtlD6wdKb9J/M1wRtyegGe/GVvlYOY2GVi0R65X357iTC9qe+eEjIZe+O5FJMMAqSbsKWgQ7rtqBAUVjR+Eczz2jJRazC/Xjwfe6iOKnWoWfs/TytveGfBtA/BFIat3qalrhPP289psvFdliYA6fLlWEkmQ0Qkyi08BZu+QgVOiFk3E8BxCU//b8O76Xphm6023XHVEBdVPHE5JWMPuy4aI7OKgYOIbG55Ww83qf7vfILOybb6s8YusGVukYNpGEZDSdXV7vy20lMqfD9806pqKJM0iPhlQMQ90jmbU8b4fElPU1LvYg5qheOCaMQtLsvl8sqDxmOT58W9jEn85DBHkSx4pmLlVAszcaX4tHV2jBqg9dKK6foMG9Lcb7wElNlN1+L2U/Or1+64Z1n/JIwmL98pBRHKebtvr7jEPN6YlFwpvRPbNFJ77iCD3EUG0PiDISREbxne892HmDkXY94sBxGQVj7qlV9bgWSAm8JQNkvANUhEvy9gk59W2j7hPoqiVvf7QLaNGrCYJSVq3vX//VzWXkq/WiyOJdB90rQNsx2oHRgKDueeMuGX9FKRyLRdQhvSi2kn3+t8dQwSZitQhEa1nDZlV7BENzSE8oxXv+XG/EuBBaPo08J14JjULojPeBz+NVxoUzAKoo+UxHO298LmhU5j7dF4pRBApRBACIkjeOwQ5L2XPmL1TAdksMiBv5DVmvgQr0sV/b8DqnRSsO64KAdH5Y9oXUvreDKw27hTSBiRh3khEekbRrkV7sEopCTeVnUvq2gYmtKPRjZwuN2fHoCqqbvliQuHik/gLY5AgYmi2vQvSpiHj/tZHfgus2XxWc+BLNEsKq7u9GQBIbfr8pIh53VSk3uy/ps8uYfVM6CxfjIQi1k/IDmFPGUHFamO//hwRJO9rpLos2qsInpSMMQPorql4c89FahjOa/1Jdd92du+Y0ajXVNytpyAjf8UBWajvgTdbAsxcyESsJs5ApPSLyndgdgD38E9F5+DfymHXqvCnEw6dELHowvbI8btmzPzSmr9MjNgkfgeGCDJr2z2IKng97upmQz+s2nuF0DcFzZBCEtZvCIIG1wbeU6ocr44owSPlY+rQ0gv/ITwOTMC6/vqTBIhLyXtPxbLm2CD810zBNYzJPVo+GFoOSdyL9ioglVEcbqq5jDuDC4o+IWCCzNshCjU9b1d3j9+1RASRhO+QNBS4ZQqCd0f/HMOfO4N/Be+awfIjmoDVzC0/a0JofPYnCRCdxB+EIYIs5peEum7gHy99cz/M47uo2YRVLKF7bwmCnhVatOsefIWuX1P2fPAxdWjvgc+svOIdZ2yWgh3n9SAhrfCd7b0nRJCRjgbxRVlzqOqGMQli5JnNvXjfIEEe2FLGJcgxkSeEqSjvuduEoW4YQdYIqhG/QGraF+vEOerSVI6b+N7IH0Tsr9YO3p/y5u89wD/QGhCTQ/iYvpjEXwxDBFlzRBGaB8b/UZymAVjEf0Wr7UukfgwnyCtMED68JiAKF+SeEj62Hk+8E63xT15vO6cHce/ZICeEbZAEEYPrylYdDQOwYqx8jDyyuPEBFVjFsXoWPi5BjorYIIKIwNztIu8QhBsRZMp6KeC/bgD2ftRn5k99LCw9/K1NnYgmDx28jEwcvYzNnIimRnbP9I3tPA3w/w8ePyUY23saGDxx18X3Daxc5OLT8sck9CT+4hgiCM9xFWiBsWdnjDcEQTPrcII09MH8bWcJnBn0jsbTj1Kx2vrgO317SuzXKM+R3bzWHIJcVbRsbhzn58neEuQe2PlQx435GY0gR29bEDHJtglp9jEaRj7RfRL/ALwliPJHEuRdFQvjovQT1lREEP4rep3p5R2HRsvjfWQy2Stvqjh3Yqk0+kIhJsijiRMEqTi2xCCz8coejSCEx76OU9aJAdceWbB7kTzhI2laBuAL3SfBP8UXtI4p6SbxN8FHEwQwQbQ/kCAYOlYvXGdsvgfTNkmAplVw8kTr4PAi0Xr2Tjmk70vC2j+CIPyDBLHzDh71dy2GMEgQ0Q8I4h8Svxb/bjwOiblLcJ+QyxojKrvu/Pazmr0Hrul3P/YImQzp/rvjj5QgSbkVG/ZdNa7G7tEVB5SAQs8dcw0Cg86oPrXrwgPWl+vvwxc8UmNKkMuy5q9Q+WPGOQ2XIBMhCPZijUQQDGFNN9ZXaCJYcUgRnvhEmo6XV35Z3eIrsk+ysaPi+y33wDc0QW68ZybxF8dgsKIYJ1hxggTh2nNZizUSQTC8QlNFVx6U49gAa4+pgr4DzbOKNcDbye545xzc5gFYZepJN+a/atj3NVJlsAQZPdQE2SBowJ+XMmHi8seq3yBB5DkEeeIVNO6gHk2CYPhEl+3Yf1WPhb1S8/ikwfDpS2Jh84dHfFZ0wLQAepm04K8mHd8gQs3YdA+k9Z+P+wtSk/gb4Iy4LSdYcR2SIK0wfhTqIEEIrdjNe07c6gOC1HfBdwZOVP+fDinA91tlYOVBVbiu4FglrO1lbOefSnAKSiOIPfA1uKZsX8K1Rw6mInLs+UW/SUzHuxCrMyNKEOzm5YSDmFSORxBDj2zOOggmqI1nwJg/kIMxtA6CCVLT8+EuN2MnmvCKAwq9eAF0NlK5zklbsSQNfU1t/JIJDv5pBAk9f8L5+09S8ZnIeA0Ix5XdVLYvpqVXT3qv/hdwRtwGEUQY1h9TANY4gw8Dzfzz91xUa566VgSExC1HdKNWdfROo8TmGR+88bBuzs77gCXU1+tFYRrvPfjPJnFOeDqO4sXxWpdlbbP9Y4u2yRk8I+Jw+A0n1CA6KeedwXVK5BED53FdwbK5sW9sG8TEI517yT5ZVKYIWLgQxz1z6bjwY8LXqP3zt9/B60AfLOq19sDnjz2jbx8TfsScsVmck+83qP7/4RXntOUbTltwuL0orDmq3ilr6EUipTFnjVTWJP6GkNByF+I5qkQ8eVuf2NI3/m/cNffBjMuSps48x1SIktqOY4Z9pBRV7dG08vc8LWbJ2nhSFZbwS8PyA3LYywVHbpnSXYPpphkFpZz4JyNbf+n1gorEU3eNiEmZBe8QVUzd0XS9oDLxvra9dVMP/DBWmXZ+6Vz7rmgR1wnKE01t3Mf9EVERNWeh9YIKxF1nFYlI+o26DsSoaFpBsPRzP37HhLH1nCasQGrkUtSetUcU4OBNA9YZMTMiKSbzGqtngieUT2Jc/H99XtZ+8MrzlQAAAABJRU5ErkJggg=="/>\n</div>\n'
                    },
                    configuration: {
                        exports: {
                            showExcelExport: true,
                            showScreenshot: true
                        }
                    },
                    interactions: {
                        crossNavigation: {
                            column: '',
                            enabled: false,
                            name: '',
                            parameters: [],
                            type: ''
                        },
                        preview: {
                            dataset: -1,
                            directDownload: false,
                            enabled: false,
                            parameters: [],
                            type: ''
                        },
                        iframe: {
                            column: '',
                            enabled: false,
                            json: '',
                            type: ''
                        }
                    },
                    style: {
                        themeName: '',
                        title: {
                            enabled: false,
                            height: 25,
                            properties: {
                                'background-color': '',
                                color: '',
                                'font-family': '',
                                'font-size': '',
                                'font-style': '',
                                'font-weight': '',
                                'justify-content': ''
                            },
                            text: ''
                        },
                        padding: {
                            enabled: false,
                            properties: {
                                'padding-bottom': '',
                                'padding-left': '',
                                'padding-right': '',
                                'padding-top': '',
                                unlinked: false
                            }
                        },
                        borders: {
                            enabled: false,
                            properties: {
                                'border-bottom-left-radius': '',
                                'border-bottom-right-radius': '',
                                'border-color': 'rgb(212, 212, 212)',
                                'border-style': 'solid',
                                'border-top-left-radius': '',
                                'border-top-right-radius': '',
                                'border-width': '1px'
                            }
                        },
                        shadows: {
                            enabled: false,
                            properties: {
                                'box-shadow': '',
                                color: ''
                            }
                        },
                        background: {
                            enabled: false,
                            properties: {
                                'background-color': ''
                            }
                        }
                    },
                    responsive: {
                        lg: true,
                        md: true,
                        sm: true,
                        xs: true,
                        xxs: true
                    }
                }
            } as any
        }
    },
    computed: {},
    watch: {},
    created() {
        this.setSelectedOption(this.generalSettingsMode)
        this.loadDashboardModel()
        this.loadVariables()
        this.loadSelectedDatasets()
        this.loadSelectedDatasetColumnNames()
    },
    methods: {
        ...mapActions(store, ['getDashboard']),
        ...mapActions(mainStore, ['getUser']),
        loadDashboardModel() {
            this.dashboardModel = this.getDashboard(this.dashboardId)
        },
        loadVariables() {
            if (this.dashboardModel && this.dashboardModel.configuration) this.variables = deepcopy(this.dashboardModel.configuration.variables)
        },
        loadSelectedDatasets() {
            this.selectedDatasets = [] as IDataset[]
            if (this.dashboardModel && this.dashboardModel.configuration) {
                const tempModelDatasets = deepcopy(this.dashboardModel.configuration.datasets)
                for (let i = 0; i < tempModelDatasets.length; i++) {
                    const tempDataset = tempModelDatasets[i]
                    const index = this.datasets.findIndex((dataset: any) => dataset.id.dsId === tempDataset.id)
                    if (index !== -1)
                        this.selectedDatasets.push({
                            ...this.datasets[index],
                            cache: tempDataset.cache,
                            indexes: tempDataset.indexes ?? [],
                            parameters: tempDataset.parameters as any[],
                            drivers: tempDataset.drivers ?? []
                        })
                }
            }
        },
        loadSelectedDatasetColumnNames() {
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return
            this.selectedDatasets.forEach((dataset: IDataset) => this.loadSelectedDatasetColumnName(dataset))
        },
        loadSelectedDatasetColumnName(dataset: IDataset) {
            this.selectedDatasetColumnsMap[dataset.id.dsId] = { name: dataset.name, columns: [] }
            for (let i = 0; i < dataset.metadata.fieldsMeta.length; i++) {
                this.selectedDatasetColumnsMap[dataset.id.dsId].columns.push(dataset.metadata.fieldsMeta[i].name)
            }
        },
        setSelectedOption(option: string) {
            this.selectedOption = option
        },

        async saveGeneralSettings() {
            for (let i = 0; i < this.variables.length; i++) {
                if (this.variables[i].type === 'dataset') await setVariableValueFromDataset(this.variables[i], this.datasets, this.$http)
            }
            this.dashboardModel.configuration.variables = this.variables

            if (this.dashboardModel.configuration.theme) applySelectedThemeToWidgets(this.dashboardModel.widgets, this.dashboardModel.configuration.theme)

            this.$emit('closeGeneralSettings')
        }
    }
})
</script>
