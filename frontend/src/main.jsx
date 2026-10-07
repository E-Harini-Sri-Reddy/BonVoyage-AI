import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

// StrictMode intentionally omitted — it double-mounts GoogleOAuthProvider / GSI and
// triggers "google.accounts.id.initialize() is called multiple times" in development.
createRoot(document.getElementById('root')).render(<App />);
