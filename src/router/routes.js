// This constant contains all the routes of the app

import VueRouter from 'vue-router';
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
        path: '/guest/:id',
        name: 'view-guest-access-note',
        component: () => import('../components/GuestAccess'),
        meta: {
          requiresGuest: true,
        },
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

export default router;
