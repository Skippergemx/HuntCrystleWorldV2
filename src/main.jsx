import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from "buffer";
import './index.css'
import App from './App.jsx'
import { Web3Provider } from './contexts/Web3Provider'

window.global = window;
window.Buffer = Buffer;
globalThis.Buffer = Buffer;
globalThis.global = window;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </StrictMode>,
)
