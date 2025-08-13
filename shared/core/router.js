import { CONFIG } from './config.js';

// This will be the main container in the root index.html where apps are rendered.
const appContainer = () => document.getElementById('app-root');
const loadedScripts = new Set();
const loadedStyles = new Set();

/**
 * Cleans up previously loaded app-specific styles and scripts.
 * This prevents styles from one app leaking into another.
 */
function cleanup() {
    if (appContainer()) {
        appContainer().innerHTML = '';
    }
    loadedScripts.forEach(script => script.remove());
    loadedScripts.clear();
    loadedStyles.forEach(style => style.remove());
    loadedStyles.clear();
}

/**
 * Loads and renders an application into the main container.
 * @param {string} appName - The key of the app in CONFIG.ROUTING.APPS (e.g., 'MULTITIMER').
 */
async function loadApp(appName) {
    cleanup();

    const appPath = CONFIG.ROUTING.APPS[appName];
    if (!appPath || !appContainer()) {
        if (appContainer()) appContainer().innerHTML = `<h1>404 - App Not Found</h1>`;
        console.error(`Router error: App "${appName}" or app container not found.`);
        return;
    }

    const indexPath = `${appPath}index.html`;

    try {
        const response = await fetch(indexPath);
        if (!response.ok) throw new Error(`Failed to fetch app shell: ${response.status}`);

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Inject body content into the app container
        const pageBody = doc.body.innerHTML;
        appContainer().innerHTML = pageBody;

        // Find, correct paths, and load stylesheets
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = new URL(link.getAttribute('href'), response.url).href;
            document.head.appendChild(newLink);
            loadedStyles.add(newLink);
        });

        // Find, correct paths, and load scripts
        const scripts = Array.from(doc.querySelectorAll('script'));
        for (const script of scripts) {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = new URL(script.getAttribute('src'), response.url).href;
            } else {
                newScript.textContent = script.textContent;
            }
            // Use 'module' type to allow imports/exports
            newScript.type = 'module';
            document.body.appendChild(newScript); // Append to body to ensure DOM is ready
            loadedScripts.add(newScript);
        }

    } catch (error) {
        console.error(`Error loading app ${appName}:`, error);
        if (appContainer()) appContainer().innerHTML = `<h1>Error loading ${appName}</h1><p>${error.message}</p>`;
    }
}

/**
 * Handles changes to the URL hash.
 */
function handleRouteChange() {
    const hash = window.location.hash.substring(1); // e.g., #/multitimer -> /multitimer

    if (hash === '/multitimer') {
        loadApp('MULTITIMER');
    } else if (hash === '/multicount') {
        loadApp('MULTICOUNT');
    } else {
        // This is the landing page.
        cleanup();
        if (appContainer()) {
            appContainer().innerHTML = `
                <style>
                    .landing-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 40px 20px;
                        color: var(--text-color);
                    }
                    .landing-header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    .landing-header h1 {
                        font-size: 2.5rem;
                        font-weight: 700;
                    }
                    .landing-header p {
                        font-size: 1.2rem;
                        color: var(--text-light);
                    }
                    .card-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 20px;
                        width: 100%;
                        max-width: 1200px;
                    }
                    .card {
                        background-color: var(--panel-bg);
                        border: 1px solid var(--border-color);
                        border-radius: var(--border-radius-large);
                        padding: 20px;
                        text-decoration: none;
                        color: inherit;
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        box-shadow: var(--shadow);
                    }
                    .card:hover {
                        transform: translateY(-5px);
                        box-shadow: var(--shadow-hover);
                    }
                    .card h2 {
                        font-size: 1.5rem;
                        margin-bottom: 10px;
                    }
                    .card p {
                        font-size: 1rem;
                        color: var(--text-light);
                    }
                </style>
                <div class="landing-container">
                    <header class="landing-header">
                        <h1>MultiUtilities</h1>
                        <p>A collection of simple and useful web apps.</p>
                    </header>
                    <div class="card-grid">
                        <a href="#/multitimer" class="card">
                            <h2>MultiTimer</h2>
                            <p>A versatile timer app that can manage multiple timers simultaneously. Perfect for cooking, workouts, and more.</p>
                        </a>
                        <a href="#/multicount" class="card">
                            <h2>MultiCount</h2>
                            <p>A simple tool to manage multiple counters at once. Track scores, inventory, or anything you need to count.</p>
                        </a>
                    </div>
                </div>
            `;
        }
    }
}

/**
 * Initializes the router.
 */
export function initRouter() {
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('load', handleRouteChange); // Handle initial page load
}

/**
 * Programmatically navigates to a new path.
 * @param {string} path - The path to navigate to (e.g., '/multitimer').
 */
export function navigateTo(path) {
    window.location.hash = path;
}
