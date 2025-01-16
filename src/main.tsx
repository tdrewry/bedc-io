import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom';
import './index.css'
import App from './App.tsx'

/**
 * adjusted StrictMode to resolve a duplication event issue with running Dev with React Router. The issue is that React
 * Router runs all routes twice when running dev mode. This means that an npm run dev would result in all actions occurring
 * twice...
 */

createRoot(document.getElementById('root')!).render(
    <>
        <HashRouter>
            <App />
        </HashRouter>
        <StrictMode />
    </>
)
