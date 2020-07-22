const navigations = [
  {
    id: 'manage-users',
    href: '/users/',
    label: 'Manage users',
    hasAccess: (user) => user && user.role === 'admin',
    toRoute() {
      return {
        path: '/users/:page?',
        component: () => import('../components/ManageUsers'),
        name: this.id,
      }
    },
  },
];

export default navigations;
