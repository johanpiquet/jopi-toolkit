## What is it?

### Server Side or Browser Side

Le premier rôle de Jopi NodeSpace, est de permettre de créer des librairies dont le code source est le même pour le serveur et le browser.

* Il permet de détecter automatiquement si nous sommes côté serveur ou navigateur.
* Il permet de gommer certains écarts entre le fonctionnement serveur/browser, notamment quant aux WebWorkers.
* Il permet un accès uniformisé aux variables d'environnement, que l'on soit browser ou serveur (proccess.env).
* Il permet d'accéder à des fonctionnalités serveur, sans devoir ajouter des dépendances.

> NodeSpace inclut des fonctionnalités d'accès aux fichiers et différents éléments serveur.
> Ils ne fonctionnent que lorsque nous sommes côté serveur, cependant ils évitent d'avoir à faire des *import*
lesquels sont incompatibles avec les bundlers (ex: ViteJS).

### Packed with common tools

Le second objectif de Jopi NodeSpace est d'apporter des outils communs.

* Cycle de vie de l'application : pouvoir associer des écouteurs, afin d'être prévenu quand l'application quitte.
* Hot-Reload: détection et gestion des hot-reload (une fonctionnalité bun.js).
* Points d'extension: permet de créer une application extensible.
* Logs: inclut des fonctionnalités de logs (basé sur jopi-logs).
* User: inclut des fonctionnalités permettant d'obtenir des informations sur l'utilisateur actuel (app side).
