# SetupView 🖥️

Petit logiciel **autonome** pour prévisualiser et planifier votre setup : bureau,
tour PC, écran(s), clavier, souris, casque, enceintes, lampe, webcam, micro,
chaise, manette… que ce soit pour le **travail**, le **gaming** ou le **streaming**.

Aucune installation, aucune dépendance, aucune donnée envoyée en ligne : tout
fonctionne dans le navigateur et vos setups sont stockés localement.

## Lancer l'application

Ouvrez simplement `index.html` dans un navigateur moderne (Chrome, Firefox, Edge…).

Ou servez le dossier localement :

```bash
cd setup-preview
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

## Fonctionnalités

- **Catalogue d'éléments** : cliquez ou glissez-déposez un élément sur le plan.
- **Manipulation** : déplacer (glisser), pivoter, redimensionner, recolorer,
  dupliquer, mettre au premier plan / à l'arrière, supprimer.
- **Presets prêts à l'emploi** : Gaming, Bureautique, Streaming, Double écran.
- **Plan vu de dessus** avec grille d'alignement activable.
- **Résumé du setup** : liste automatique des éléments et de leur quantité.
- **Sauvegarde / chargement** dans le navigateur.
- **Export** en image **PNG** et en fichier **JSON** (et réimport du JSON).

## Raccourcis clavier

| Touche            | Action                  |
|-------------------|-------------------------|
| `Suppr` / `Retour`| Supprimer la sélection  |
| `R`               | Pivoter de 15°          |
| `Ctrl/Cmd + D`    | Dupliquer la sélection  |

## Structure

```
setup-preview/
├── index.html        # interface
├── css/style.css     # styles
└── js/
    ├── catalog.js    # définition + dessin des éléments
    └── app.js        # logique (canvas, sélection, presets, export)
```

Le catalogue est facilement extensible : ajoutez une entrée dans `CATALOG`
(`js/catalog.js`) avec un emoji, des dimensions et une fonction de dessin.
