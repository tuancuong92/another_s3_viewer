import { lazy } from 'solid-js';

const Home = lazy(() => import('./pages/Home'));
const AddConnection = lazy(() => import('./pages/AddConnection'));
const Buckets = lazy(() => import('./pages/Buckets'));
const ObjectBrowser = lazy(() => import('./pages/ObjectBrowser'));
export const routes = [
    {
        path: '/',
        component: Home,
    },
    {
        path: '/connections',
        component: Home,
    },
    {
        path: '/connections/add',
        component: AddConnection,
    },
    {
        path: '/connections/:id',
        component: Buckets,
    },
    {
        path: '/connections/:id/buckets',
        component: Buckets,
    },
    {
        path: '/connections/:id/buckets/:bucketName',
        component: ObjectBrowser,
    },
    {
        path: '/connections/:id/buckets/:bucketName/*prefix',
        component: ObjectBrowser
    },
];
