/* eslint-disable */
import {I18n} from "vue-i18n";

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue/types/vue' {
  import VueRouter, { Route } from 'vue-router'
  interface Vue {
    $router: VueRouter
  }
}


declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: string, values?: Record<string, any>) => string
    $i18n: I18n
  }
}
