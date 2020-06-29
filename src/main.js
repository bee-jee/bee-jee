import Vue from 'vue';
import './styles/main.scss';
import store from './vuex/store';
import routes from './router/routes';
import VueRouter from 'vue-router';
import { BootstrapVue } from 'bootstrap-vue';

Vue.config.productionTip = false;

// This will register bootstrap tags such as <b-modal>
// to be available to all components
Vue.use(BootstrapVue);
Vue.use(VueRouter);

const router = new VueRouter({
  routes,
});

new Vue({
  el: '#app',
  store,
  router,
});
