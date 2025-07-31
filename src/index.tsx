import { render } from 'solid-js/web';
import App from './app';

// Import global CSS reset for full-screen rendering
import './global.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

render(() => <App />, root);
