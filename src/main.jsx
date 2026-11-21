
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'

import './styles/index.css'
import './styles/redesign.css'
import './styles/flame-theme.css'
import './styles/rengoku-overrides.css'
import './styles/auth-flame.css'
import './styles/profile-pages.css'

// 대시보드 배경 최종 설정
import './styles/dashboard-background.css'
import './styles/nrnl-dark.css'
import './styles/clubhouse.css'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
)
