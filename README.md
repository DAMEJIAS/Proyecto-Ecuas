# ProyectoEcuas (Electron + React)

Aplicacion de escritorio para resolver sistemas de ecuaciones diferenciales de primer orden:

- x' = f(t, x, y)
- y' = g(t, x, y)

Usa el metodo de Runge-Kutta de cuarto orden (RK4), con grafica y tabla de resultados.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalacion

```bash
npm install
```

## Desarrollo (interfaz + Electron)

```bash
npm run electron:dev
```

## Build web

```bash
npm run build
```

## Generar instalador .exe

```bash
npm run electron:build
```

El instalador quedara en la carpeta `release/`.

## Sintaxis para ecuaciones

Puedes usar variables `t`, `x`, `y` y expresiones como:

- `x - y + t`
- `sin(t) + x*y`
- `exp(-t) * x`
