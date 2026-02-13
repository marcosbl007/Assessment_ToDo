# 🏗️ Arquitectura del Proyecto Frontend

## 📁 Estructura de Carpetas

```
src/
├── components/
│   ├── atoms/           # Componentes más básicos y reutilizables
│   │   ├── Input.tsx    # Input con estilos personalizados
│   │   ├── Button.tsx   # Botón con variantes
│   │   └── Logo.tsx     # Logo CO2+
│   ├── molecules/       # Combinaciones de componentes atómicos
│   │   └── LoginForm.tsx
│   └── organisms/       # Componentes complejos (futuro)
├── features/            # Funcionalidades por módulo
│   └── auth/
│       ├── LoginPage.tsx
│       └── index.ts
├── hooks/               # Custom hooks
├── services/            # Llamadas a API
├── types/               # TypeScript types/interfaces
│   ├── auth.types.ts
│   └── index.ts
├── utils/               # Funciones utilitarias
├── assets/              # Imágenes, SVGs
├── App.tsx
├── main.tsx
└── index.css
```

## 🎨 Patrón de Diseño: Feature-Based Architecture + Atomic Design

### ¿Por qué esta arquitectura?

#### **1. Atomic Design**
- **Átomos** (`atoms/`): Componentes más simples (Input, Button, Logo)
- **Moléculas** (`molecules/`): Grupos de átomos (LoginForm = Input + Button)
- **Organismos** (`organisms/`): Componentes complejos (futuro: Header, Sidebar)
- **Páginas** (`features/`): Vistas completas

#### **2. Feature-Based**
- Cada feature tiene su propia carpeta (auth, tasks, dashboard)
- Facilita escalabilidad y mantenimiento
- Código organizado por funcionalidad, no por tipo de archivo

### Ventajas

✅ **Escalable**: Fácil agregar nuevas features  
✅ **Mantenible**: Código organizado y predecible  
✅ **Reutilizable**: Componentes atómicos compartidos  
✅ **Testable**: Cada componente es independiente  
✅ **Colaborativo**: Múltiples desarrolladores pueden trabajar sin conflictos

## 🎨 Paleta de Colores

```css
--fondo: #14151A    /* Background oscuro */
--dorado: #9D833E   /* Color principal/acentos */
--blanco: #DEDEE0   /* Texto principal */
```

## 🛠️ Tecnologías

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilos)
- **pnpm** (package manager)

## 🚀 Comandos

```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Build para producción
pnpm build

# Preview del build
pnpm preview
```

## 📱 Responsividad

Todos los componentes están diseñados con **mobile-first**:
- Breakpoints de Tailwind (sm, md, lg, xl, 2xl)
- Flexbox/Grid para layouts fluidos
- Tamaños relativos (rem, %, vw/vh)

## 🔐 Próximos Pasos

1. **Backend Integration**
   - Conectar con API REST
   - Implementar autenticación JWT
   - Manejo de estados globales (Context API o Zustand)

2. **Nuevas Features**
   - Dashboard
   - Gestión de Tareas (CRUD)
   - Sistema de permisos por roles
   - Aprobación de cambios

3. **Optimizaciones**
   - Lazy loading de rutas
   - React Query para cache
   - Error boundaries
   - Tests unitarios (Vitest)
