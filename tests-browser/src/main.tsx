import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./tests.ts";

function init() {
    createRoot(document.getElementById('root')!).render(<StrictMode><MyComponent/></StrictMode>);
}

function MyComponent() {
    return <div>See console</div>
}

init();
