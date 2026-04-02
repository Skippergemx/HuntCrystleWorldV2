import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from "buffer";
import './index.css'
import App from './App.jsx'
import { Web3Provider } from './contexts/Web3Provider'

window.Buffer = Buffer;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </StrictMode>,
)
