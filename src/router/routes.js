// This constant contains all the routes of the app

import VueRouter from 'vue-router';
import store from '../vuex/store';
import BaseLayout from '../components/layout/BaseLayout';
import SidebarLayout from '../components/layout/SidebarLayout';
import navigations from '../helpers/nav';
import NoteViewShared from '../components/NoteEditor/ViewShared';
import NoteEditor from '../components/NoteEditor';

// which use vue-router
const routes = [
  // Make sure all routes before the one with path '' because
  // '' matches everything so unless the router finds a match
  // before it reaches that otherwise it will go to path ''
  // no matter what
  {
    path: '/login',
    component: () => import('../components/Login'),
    meta: {
      requiresGuest: true,
    },
  },
  {
    // The path here is empty because we want to use a layout
    // for all routes, because we want to display a note-explorer
    // on the left bar no matter what routes
    path: '',
    component: BaseLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '/users/form/:id/change-password',
        component: () => import('../components/ManageUsers/ChangePassword'),
      },
      {
        path: '/users/form/:id?',
        component: () => import('../components/ManageUsers/Create'),
      },
      ...navigations.map((navigation) => navigation.toRoute()),
      {
        path: '/change-own-password',
        component: () => import('../components/ChangeOwnPassword'),
      },
      {
        path: '/',
        component: SidebarLayout,
        children: [
          // A page for display all the settings we have in the app
          // this is a child of the Layout component to make sure that
          // the note-explorer is still on the left bar
          {
            path: '/settings',
            name: 'settings',
            component: () => import('../components/Settings')
          },
          {
            path: '/view-shared/:id',
            name: 'view-shared-note',
            component: NoteViewShared,
          },
          // The route for viewing a single note, we don't have a route
          // for the index page because we have nothing to display on the
          // index page, so we just display a blank page
          {
            path: '/:id?',
            name: 'note-edit',
            component: NoteEditor,
          },
        ],
      },
    ],
  },
];

const router = new VueRouter({
  routes,
});

const checkLoggedIn = (nextCurrent, nextLogin) => {
  if (store.getters.token !== '') {
    store.dispatch('checkLoggedIn')
      .then(() => {
        if (store.getters.isLoggedIn) {
          nextCurrent();
        } else {
          nextLogin();
        }
      })
      .catch((err) => {
        console.error(err);
        nextLogin();
      });
  } else {
    nextLogin();
  }
};

router.beforeEach((to, from, next) => {
  store.commit('setGlobalIsLoading', true);
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (store.getters.isLoggedIn) {
      next();
    } else {
      checkLoggedIn(() => {
        next();
      }, () => {
        store.commit('setWantsUrl', to);
        next('/login');
      });
    }
  } else if (to.matched.some(record => record.meta.requiresGuest)) {
    if (store.getters.isLoggedIn) {
      next('/');
    } else {
      checkLoggedIn(() => {
        next('/');
      }, () => {
        next();
      });
    }
  }
});

router.afterEach(() => {
  store.commit('setGlobalIsLoading', false);
});

export default router;
