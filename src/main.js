import Vue from 'vue';
import './styles/main.scss';
import store from './vuex/store';
import routes from './router/routes';
import VueRouter from 'vue-router';
import { BootstrapVue } from 'bootstrap-vue';
import App from './App.vue';
import VueNativeSock from 'vue-native-websocket';

Vue.config.productionTip = false;

// This will register bootstrap tags such as <b-modal>
// to be available to all components
Vue.use(BootstrapVue);
Vue.use(VueRouter);
Vue.use(VueNativeSock, process.env.VUE_APP_WS_URL, { store, format: 'JSON' });

const router = new VueRouter({
  routes,
});

new Vue({
  render: (h) => h(App),
  store,
  router,
}).$mount('#app');
