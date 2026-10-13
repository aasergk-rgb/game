// Collects the web game into www/ for the Android app (Capacitor's webDir).
// The service worker stays out: inside the app every file is already local.
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const FILES = ['index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'fonts'];
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of FILES) cpSync(f, `www/${f}`, { recursive: true });
console.log('www/ ready:', FILES.join(', '));
