/* @refresh reload */
import { render } from 'solid-js/web';
import { Route, Router } from '@solidjs/router';
import { lazy } from 'solid-js';
import './index.css';
import App from './App';

const Home = lazy(() => import('./pages/Home'));
const AddConnection = lazy(() => import('./pages/AddConnection'));
const Buckets = lazy(() => import('./pages/Buckets'));
const ObjectBrowser = lazy(() => import('./pages/ObjectBrowser'));
const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?',
  );
}

render(() => (
  <Router root={App}>
    <Route path="/" component={Home} />
    <Route path="/connections" component={Home} />
    <Route path="/connections/add" component={AddConnection} />
    <Route path="/connections/:id" component={Buckets} />
    <Route path="/connections/:id/buckets" component={Buckets} />
    <Route path="/connections/:id/buckets/:bucketName/*" component={ObjectBrowser} />
  </Router>
), root!);
