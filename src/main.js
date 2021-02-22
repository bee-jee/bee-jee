import Vue from 'vue';
import './styles/main.scss';
import store from './vuex/store';
import router from './router/routes';
import VueRouter from 'vue-router';
import {
  BCollapse,
  BDropdown,
  BDropdownItem,
  BDropdownDivider,
  BPopover,
} from 'bootstrap-vue';
import VModal from 'vue-js-modal';
import { library } from '@fortawesome/fontawesome';
import {
  faTrashAlt, faEdit,
} from '@fortawesome/free-regular-svg-icons';
import {
  faCog, faPlus, faChevronLeft, faChevronRight,
  faArrowsAlt, faTimes,
  faChevronDown, faSearch,
} from '@fortawesome/free-solid-svg-icons';
import VueInputAutowidth from 'vue-input-autowidth';
import App from './App.vue';
import Axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import VueShortkey from 'vue-shortkey';
import { apiUrl } from './helpers/url';
import Icon from './components/utilities/Icon';
import MtIcon from './components/utilities/MtIcon';
import { createRefreshAuth } from './helpers/auth';

window.isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

library.add(faTrashAlt, faCog, faPlus, faChevronLeft, faChevronRight, faEdit,
  faArrowsAlt, faTimes, faChevronDown, faSearch,
);
Vue.config.productionTip = false;

// This will register bootstrap tags such as <b-modal>
// to be available to all components
Vue.component('b-collapse', BCollapse);
Vue.component('b-dropdown', BDropdown);
Vue.component('b-dropdown-item', BDropdownItem);
Vue.component('b-dropdown-divider', BDropdownDivider);
Vue.component('b-popover', BPopover);
Vue.component('icon', Icon);
Vue.component('mt-icon', MtIcon);
Vue.use(VueRouter);
Vue.use(VModal);
Vue.use(VueInputAutowidth);
Vue.use(VueShortkey);

Axios.defaults.baseURL = apiUrl('/');
Axios.defaults.headers.common['Content-Type'] = 'application/json';
Axios.defaults.headers.common['Accept'] = 'application/json';
Axios.defaults.headers.common['Authorization'] = `Bearer ${store.getters.token}`;

createAuthRefreshInterceptor(Axios, createRefreshAuth(store, router));

new Vue({
  render: (h) => h(App),
  store,
  router,
}).$mount('#app');
