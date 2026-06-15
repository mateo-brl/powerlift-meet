# Journal des modifications

Toutes les évolutions notables de `powerlift-meet` sont consignées ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
[versionnage sémantique](https://semver.org/lang/fr/).

## [0.1.0] — 2026-06-15

Première version publique.

### Ajouté

- **Moteur de calcul fédéral** (`@powerlift-meet/core`) : portage fidèle de la logique du
  classeur Excel FFForce — indices IPF GL, catégories d'âge et de poids, niveaux
  (Niv FA/PL), totaux annoncé et réalisé, classement avec départage, ordre de passage et
  calcul du chargeur (disques aux couleurs IPF). Validé par 41 tests « golden » contre les
  valeurs calculées par Excel.
- **Lecture des feuilles de match** (`@powerlift-meet/xlsx-reader`) : lecture seule des
  `.xlsm` via `exceljs`, avec détection du statut des essais d'après la couleur des cellules
  et le texte barré.
- **Application desktop** (Electron + React) : panneau de contrôle et 4 écrans de salle
  projetables — **Feuille**, **Joueur**, **Chargeur**, **Ordre** — mis à jour en temps réel
  par surveillance du dossier des feuilles de match. Forçage manuel du passage en cours.
- **Distribution** : exécutables Windows (`.exe` NSIS + portable) et Linux
  (`AppImage`, `.deb`), construits automatiquement par GitHub Actions sur tag `v*`.

### À venir (phase 2)

- Export VMIX et intégration de l'overlay OBS.
- Lecture des hauteurs / rack / cales pour le chargeur.

[0.1.0]: https://github.com/mateo-brl/powerlift-meet/releases/tag/v0.1.0
