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
} from 'bootstrap-vue';
import VModal from 'vue-js-modal';
import { library } from '@fortawesome/fontawesome';
import {
  faTrashAlt, faEdit,
} from '@fortawesome/free-regular-svg-icons';
import {
  faCog, faPlus, faChevronLeft, faChevronRight,
  faArrowsAlt, faTimes, faShareAlt,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import App from './App.vue';
import VueNativeSock from 'vue-native-websocket';
import Axios from 'axios';
import { apiUrl } from './helpers/url';
import './helpers/ws';
import { initialiseWsFromVueInstance } from './helpers/ws';
import GeminiScrollbar from './components/utilities/GeminiScrollbar';
import Icon from './components/utilities/Icon';
import MtIcon from './components/utilities/MtIcon';

window.isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

library.add(faTrashAlt, faCog, faPlus, faChevronLeft, faChevronRight, faEdit,
  faArrowsAlt, faTimes, faShareAlt, faChevronDown,
);
Vue.config.productionTip = false;

// This will register bootstrap tags such as <b-modal>
// to be available to all components
Vue.component('b-collapse', BCollapse);
Vue.component('b-dropdown', BDropdown);
Vue.component('b-dropdown-item', BDropdownItem);
Vue.component('b-dropdown-divider', BDropdownDivider);
Vue.component('gemini-scrollbar', GeminiScrollbar);
Vue.component('icon', Icon);
Vue.component('mt-icon', MtIcon);
Vue.use(VueRouter);
Vue.use(VueNativeSock, process.env.VUE_APP_WS_URL, {
  store,
  format: 'JSON',
  reconnection: true,
  reconnectionDelay: 5000,
  connectManually: true,
  passToStoreHandler: function (eventName, event, next) {
    if (eventName === 'SOCKET_onopen') {
      store.dispatch('SOCKET_ONOPEN', event);
      return;
    }
    next(eventName, event);
  },
});
Vue.use(VModal);

Axios.defaults.baseURL = apiUrl('/');
Axios.defaults.headers.common['Content-Type'] = 'application/json';
Axios.defaults.headers.common['Accept'] = 'application/json';
Axios.defaults.headers.common['Authorization'] = `Bearer ${store.getters.token}`;

const app = new Vue({
  render: (h) => h(App),
  store,
  router,
}).$mount('#app');

initialiseWsFromVueInstance(app);
