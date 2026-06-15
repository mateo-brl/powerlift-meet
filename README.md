# 🏋️ powerlift-meet

> Suite d'affichage pour les compétitions de **force athlétique / powerlifting** de la
> **FFForce** — une alternative libre, moderne et optimisée au logiciel fédéral.

[![CI](https://github.com/mateo-brl/powerlift-meet/actions/workflows/ci.yml/badge.svg)](https://github.com/mateo-brl/powerlift-meet/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

`powerlift-meet` lit **en lecture seule** les feuilles de match Excel (`.xlsm`) du modèle
fédéral et pilote les **écrans de la salle** pendant la compétition : feuille de résultats,
panneau de l'athlète en cours, **chargeur** (répartition des disques) et **ordre de passage**.
Toute la logique fédérale (indices IPF, catégories d'âge et de poids, niveaux, totaux,
classement, départage, ordre de passage) est reproduite **au point près** — vérifiée par des
tests contre les valeurs calculées par Excel.

> [!IMPORTANT]
> L'application **ne modifie jamais** vos fichiers `.xlsm`. La saisie des essais reste faite
> dans Excel (les juges colorent les cellules) ; `powerlift-meet` relit les fichiers en continu
> et met à jour les écrans automatiquement.

## ✨ Fonctionnalités

- **4 écrans de salle**, chacun projetable en plein écran sur un vidéoprojecteur dédié :
  - 📋 **Feuille** — résultats par catégorie (âge × poids), essais, totaux, classement ;
  - 👤 **Joueur** — athlète en cours (nom, club, catégorie, essai, charge) ;
  - 🏋️ **Chargeur** — disques à mettre sur la barre, aux couleurs IPF ;
  - ⏭️ **Ordre** — file de passage (charge croissante, départage au lot).
- **Mise à jour temps réel** par surveillance du dossier des feuilles de match.
- **Calculs fédéraux fidèles** : indices IPF GL, catégories, niveaux, totaux annoncé/réalisé,
  classement et départage — portés du modèle fédéral et testés.
- **Multiplateforme** : exécutables **Windows (`.exe`)** et **Linux (`AppImage` / `.deb`)**.
- **Aucun runtime à installer** : tout est embarqué dans l'application.

## 🧱 Architecture

Monorepo (npm workspaces) :

| Paquet                                         | Rôle                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| [`packages/core`](packages/core)               | Moteur de calcul fédéral **pur** (sans Electron/DOM), entièrement testé. |
| [`packages/xlsx-reader`](packages/xlsx-reader) | Lecture des `.xlsm` (valeurs + couleurs + barré) via `exceljs`.          |
| [`apps/desktop`](apps/desktop)                 | Application **Electron + React** : panneau de contrôle + 4 écrans.       |

Les barèmes et tables de référence (catégories d'âge, niveaux, records) sont **extraits des
feuilles fédérales** (`scripts/extract_reference.py`) vers des JSON consommés par le moteur.

## 🚀 Installation (utilisateurs)

Téléchargez le binaire de votre système depuis la page
[**Releases**](https://github.com/mateo-brl/powerlift-meet/releases) :

- **Windows** : `powerlift-meet-Setup-x.y.z.exe` (installeur) ou la version portable ;
- **Linux** : `powerlift-meet-x.y.z.AppImage` (rendez-le exécutable) ou le `.deb`.

## 🛠️ Développement

```bash
npm install        # installe tout le monorepo
npm run build      # compile les paquets (core + reader)
npm test           # lance la suite de tests (Vitest)
npm run dev        # lance l'application desktop en mode dev
```

Régénérer les tables de référence depuis un dossier de feuilles de match :

```bash
python3 scripts/extract_reference.py "/chemin/vers/Feuille de match"
```

> Les fichiers `.xlsm` (données personnelles : noms, licences, dates de naissance) ne sont
> **jamais** versionnés — voir [`.gitignore`](.gitignore).

## ✅ Qualité

- Tests unitaires **+ tests « golden »** validés contre les valeurs calculées par Excel ;
- `typecheck`, `lint` (ESLint) et `format` (Prettier) en intégration continue (GitHub Actions) ;
- Build et publication automatiques des binaires sur tag `v*`.

## 📜 Licence

[GPL-3.0-or-later](LICENSE) © Mateo Baril.

Projet indépendant, non affilié à la Fédération Française de Force.
