# assets/

Place the following files in this folder before deploying:

## Required

| File | Description |
|------|-------------|
| `logo-atlas-cae.svg` | Logo principal de ATLAS CAE (versión blanca/teal sobre fondo oscuro). Recomendado: SVG vector, aprox. 120×40px o cuadrado 52×52px. |
| `favicon.png` | Favicon de la landing NFC. Recomendado: 32×32px o 64×64px PNG. |

## Optional (activates dossier button)

| File | Description |
|------|-------------|
| `dossier-atlas-cae.pdf` | Dossier corporativo de ATLAS CAE en PDF. Cuando esté disponible, súbelo con este nombre exacto y el botón "Descargar dossier" funcionará automáticamente. |

## Notes

- El botón de dossier muestra "Pronto" mientras el archivo no esté disponible.
- Si el PDF está presente pero da 404, el JS muestra un toast informativo.
- El logo usa un fallback SVG inline si `logo-atlas-cae.svg` no existe.
