import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import 'leaflet/dist/leaflet.css';
import './styles/app.css';
import './styles/map-mobile.css';
import './styles/typography.css';
import { AppProvider } from './app/context';
import App from './app/App';

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><AppProvider><App/></AppProvider></BrowserRouter></StrictMode>);
