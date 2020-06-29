// This constant contains all the routes of the app
// which use vue-router
const routes = [
  {
    // The path here is empty because we want to use a layout
    // for all routes, because we want to display a note-explorer
    // on the left bar no matter what routes
    path: '',
    component: () => import('../components/layout/Layout'),
    children: [
      // A page for display all the settings we have in the app
      // this is a child of the Layout component to make sure that
      // the note-explorer is still on the left bar
      {
        path: '/settings',
        name: 'settings',
        component: () => import('../components/Settings')
      },
      // The route for viewing a single note, we don't have a route
      // for the index page because we have nothing to display on the
      // index page, so we just display a blank page
      {
        path: '/:id?',
        name: 'note-edit',
        component: () => import('../components/NoteEditor')
      },
    ],
  },
];

export default routes;
