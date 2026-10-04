# entreno

App web para armar y seguir entrenamientos desde el celular.

## Qué va a hacer

- Elegir ejercicios
- Definir series y repeticiones por serie
- Descansos con temporizador
- Instalable en el celular (PWA)

## Tecnología

HTML + CSS + JavaScript, sin frameworks ni herramientas de build.

## Estructura

```
index.html       página de la app
sw.js            service worker: funcionamiento offline (va en la raíz para cubrir toda la app)
manifest.json    datos para instalarla en el celular
css/             estilos
js/              lógica de la app
data/            catálogo de ejercicios (wger)
icons/           íconos de la app
tools/           scripts de mantenimiento (no los usa la app)
```

## Cómo usarla

Online (también desde el celular): https://matic-git.github.io/entreno/

Se publica con GitHub Pages desde la rama `main`: cada merge actualiza el sitio en un par de minutos.

En local: abrir `index.html` en el navegador.

## Imágenes de ejercicios

Las imágenes vienen de [wger](https://wger.de) (licencias Creative Commons, con crédito al autor).
`data/exercises-es.json` es una copia de los ejercicios de wger que tienen nombre en español e imagen; para actualizarla:

```
powershell -File tools/actualizar-catalogo.ps1
```
