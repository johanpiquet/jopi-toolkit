## What is it?

### Server Side or Browser Side

The primary role of Jopi NodeSpace is to enable the creation of libraries whose source code is the same for both server and browser.

* It automatically detects whether we are on the server side or browser side.
* It helps bridge certain gaps between server/browser functionality, particularly regarding WebWorkers.
* It provides unified access to environment variables, whether on browser or server (process.env).
* It allows access to server functionality without having to add dependencies.

> NodeSpace includes file access functionalities and various server elements.
> These only work when we are on the server side, however, they eliminate the need for *imports*
which are incompatible with bundlers (e.g., ViteJS).

### Packed with common tools

The second objective of Jopi NodeSpace is to provide common tools for both Node.js and Bun.js, acting as a compatibility layer.

* Application lifecycle: ability to attach listeners to be notified when the application exits.
* Hot-Reload: detection and management of hot-reload (a bun.js feature).
* Extension points: allows creating an extensible application.
* Logs: includes logging functionalities (based on jopi-logs).
* User: includes functionalities to obtain information about the current user (app side).
