import Vue from 'vue';
import './styles/main.scss';
import store from './vuex/store';
import router from './router/routes';
import VueRouter from 'vue-router';
import {
  BModal,
  BButton,
  BDropdownItem,
  BNavItemDropdown,
} from 'bootstrap-vue';
import { library } from '@fortawesome/fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import {
  faCog, faPlus, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import App from './App.vue';
import VueNativeSock from 'vue-native-websocket';
import Axios from 'axios';
import { apiUrl } from './helpers/url';
import { PendingSocket } from './vuex/modules/websocket';

library.add(faTrashAlt, faCog, faPlus, faChevronLeft, faChevronRight);
Vue.config.productionTip = false;

// Initialise a pending socket to push any data sent before
// the connection opened, so that once the socket is opened
// it will send the data
Vue.prototype.$socket = new PendingSocket(store);

// This will register bootstrap tags such as <b-modal>
// to be available to all components
Vue.component('b-modal', BModal);
Vue.component('b-button', BButton);
Vue.component('b-nav-item-dropdown', BNavItemDropdown);
Vue.component('b-dropdown-item', BDropdownItem);
Vue.use(VueRouter);
Vue.use(VueNativeSock, process.env.VUE_APP_WS_URL, {
  store,
  format: 'JSON',
  reconnection: true,
  reconnectionDelay: 5000,
  passToStoreHandler: (eventName, event, defaultHandler) => {
    if (eventName === 'SOCKET_onopen') {
      store.dispatch('onSocketOpen', event);
    }
    defaultHandler(eventName, event);
  },
});

Vue.prototype.$http = Axios;
Vue.prototype.$http.defaults.baseURL = apiUrl('/');
Vue.prototype.$http.defaults.headers.common['Content-Type'] = 'application/json';
Vue.prototype.$http.defaults.headers.common['Accept'] = 'application/json';
Vue.prototype.$http.defaults.headers.common['Authorization'] = `Bearer ${store.getters.token}`;

new Vue({
  render: (h) => h(App),
  store,
  router,
}).$mount('#app');
