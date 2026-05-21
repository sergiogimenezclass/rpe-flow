---
nombre: RPE Flow
colores:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#55433b'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#887269'
  outline-variant: '#dbc1b7'
  surface-tint: '#98471a'
  primary: '#98471a'
  on-primary: '#ffffff'
  primary-container: '#f28c5a'
  on-primary-container: '#6a2700'
  inverse-primary: '#ffb694'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#5e5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#a7a7a6'
  on-tertiary-container: '#3b3c3c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb694'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3003'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#e3e2e1'
  tertiary-fixed-dim: '#c7c6c5'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#464746'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
tipografía:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
redondeado:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
espaciado:
  container-max-width: 1120px
  gutter: 24px
  margin-x: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-padding: 64px
---

## Marca y Estilo
El sistema de diseño está pensado para el alto rendimiento deportivo, priorizando la claridad, el enfoque y una sensación de "flujo" (flow) profesional. Está dirigido a entrenadores de élite que requieren entornos ricos en datos que no resulten abrumadores.

La estética es una fusión del **minimalismo inspirado en Apple** y la **utilidad inspirada en Notion**. Utiliza un enfoque de "minimalismo cálido", evitando la frialdad estéril del software empresarial típico en favor de un entorno acogedor y espacioso que fomente el uso diario. La interfaz debe sentirse como un cuaderno físico de alta gama: organizada, de gran calidad e intencionada.

## Colores
La paleta se ancla en un **fondo blanco cálido** para reducir la fatiga visual durante las largas sesiones de entrenamiento. El color principal es un **Naranja Suave Premium**, elegido por su visibilidad y energía sin ser agresivo ni estar sobresaturado.

Los colores de superficie utilizan un gris muy claro para crear una distinción sutil entre el fondo y el contenido anidado. Los colores semánticos (Verde, Amarillo, Rojo) se han suavizado para asegurar que las alertas de alta fatiga capten la atención a través del tono en lugar de una intensidad discordante.

## Tipografía
Este sistema de diseño utiliza **Plus Jakarta Sans** en todos los niveles para lograr un aspecto moderno, accesible y geométrico. La tipografía se basa en interlineados generosos y un ajuste sutil del espacio entre letras en los encabezados más grandes para imitar los diseños editoriales de alta gama.

La jerarquía se establece a través del peso más que por el tamaño. Los titulares deben sentirse sólidos y firmes, mientras que el texto del cuerpo permanece ligero y fluido. Para las tablas de entrenamiento con muchos datos, se utilizan los niveles `label-md` o `label-sm` para mantener la legibilidad en escalas más pequeñas.

## Diseño y Espaciado
El diseño sigue una filosofía de **Cuadrícula Fija**, centrada en la pantalla para mantener el enfoque y prevenir la fatiga ocular.

- **Navegación:** Una única barra superior horizontal gestiona todo el enrutamiento de nivel superior. No se utilizan barras laterales para maximizar el espacio horizontal para los datos de entrenamiento.
- **Cuadrícula:** Un diseño de 12 columnas dentro de un contenedor de 1120px.
- **Ritmo:** Una escala lineal de 8px rige todos los rellenos (padding) y márgenes. Se usa `stack-lg` (32px) para separar grupos de tarjetas principales y `section-padding` (64px) para el espacio vertical entre bloques de contenido distintos.
- **Móvil:** En pantallas pequeñas, el contenedor pasa a un diseño fluido de 1 columna con márgenes horizontales de 16px.

## Elevación y Profundidad
La profundidad se transmite a través de **Capas Tonales** y **Sombras Ambientales**. Este sistema de diseño evita los bordes bruscos.

1.  **Nivel 0 (Fondo):** La base blanca cálida (#FAFAFA).
2.  **Nivel 1 (Superficies):** Gris muy claro (#F3F4F6) utilizado para áreas insertadas o agrupaciones secundarias.
3.  **Nivel 2 (Tarjetas):** Contenedores de color blanco puro (#FFFFFF). Representan los módulos interactivos principales.
4.  **Sombras:** Se utiliza una única sombra muy difusa para los elementos de Nivel 2: `0 4px 20px -2px rgba(0, 0, 0, 0.05)`. El objetivo es que la sombra se sienta como un resplandor suave en lugar de una sombra dura, dando a la interfaz una sensación de estar "elevada" sobre la página.

## Formas
El lenguaje de las formas se define por **Grandes Esquinas Redondeadas**, haciendo eco de la estética del hardware de consumo de alta gama.

- **Radio Base (rounded):** 0.5rem (8px) para botones, campos de entrada y widgets pequeños.
- **Radio Grande (rounded-lg):** 1rem (16px) para tarjetas y contenedores estándar.
- **Radio Extra Grande (rounded-xl):** 1.5rem (24px) para bloques hero de funciones principales o módulos principales del panel.
- **Avatares:** Estrictamente circulares (radio del 50%) para contrastar con la cuadrícula rectangular suavizada del resto de la interfaz.

## Componentes

### Botones
Los botones son limpios y planos. El **Botón Primario** utiliza el fondo Naranja Suave con texto blanco. El **Botón Secundario** utiliza un fondo gris claro con el color principal como texto. Ambos utilizan una fuente de peso medio y un radio de esquina de 0.5rem.

### Tarjetas
Las tarjetas son el contenedor principal para los datos de entrenamiento. Deben tener un fondo blanco puro, un radio de esquina de 1rem y la sombra ambiental estándar. El contenido dentro de las tarjetas debe tener al menos 24px de relleno interno para mantener la amplitud inspirada en Notion.

### Campos de Entrada
Los campos utilizan el color de superficie (#F3F4F6) como fondo sin borde en su estado predeterminado. Al enfocarse, pasan a un fondo blanco con un borde naranja suave de 1px.

### Avatars
Los avatares de los atletas son siempre circulares. Se deben utilizar imágenes de atletas de alta resolución y "reales" para mantener el enfoque profesional y humano de la aplicación.

### Indicadores RPE (Chips)
Se utilizan pequeños "chips" redondeados para los valores de RPE (Escala de Esfuerzo Percibido). El fondo del chip debe utilizar los colores semánticos de fatiga (Verde/Amarillo/Rojo) con texto oscuro de alto contraste.

### Navegación Superior
Una barra delgada de 64px de altura en la parte superior. Se utiliza un efecto de desenfoque de fondo (backdrop-blur/glassmorphism) si la navegación es fija, permitiendo que el fondo cálido se filtre ligeramente.
