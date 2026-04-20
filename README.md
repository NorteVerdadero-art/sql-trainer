# SQL Trainer WHMCS

Entrenador interactivo de SQL con autogeneración de ejercicios via Claude API.
Contexto: schema WHMCS 8.x estándar (tablas `tbl*`), orientado a análisis BI.

---

## Stack

- **Frontend**: HTML + CSS + JS vanilla (ES Modules)
- **Sin build step**: funciona directo en el browser
- **Deploy**: GitHub Pages (estático)
- **Generación**: Claude API (`claude-sonnet-4-20250514`) llamada directo desde el browser
- **Persistencia**: `localStorage` del browser

---

## Estructura del repo

```
sql-trainer/
├── index.html          ← App completa (entry point)
├── css/
│   └── app.css         ← Estilos (dark terminal aesthetic)
├── js/
│   ├── generator.js    ← Motor de generación + checkAnswer()
│   ├── store.js        ← Estado, localStorage, ejercicios semilla
│   └── ui.js           ← Renders y helpers visuales
├── data/
│   └── schema.js       ← Schema WHMCS 8.x + contexto de negocio
└── README.md
```

---

## Setup local

```bash
git clone https://github.com/TU_USUARIO/sql-trainer.git
cd sql-trainer

# Opción 1: cualquier servidor estático
npx serve .

# Opción 2: Python
python3 -m http.server 8080

# Opción 3: VS Code Live Server
# Click derecho en index.html → Open with Live Server
```

> ⚠️ Debes servir el proyecto (no abrir index.html directo en el filesystem) porque usa ES Modules (`type="module"`), que requieren HTTP/HTTPS.

---

## Deploy en GitHub Pages

```bash
# 1. Crea el repo en GitHub
git init
git add .
git commit -m "feat: initial sql trainer"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sql-trainer.git
git push -u origin main

# 2. Activa GitHub Pages
# GitHub → Repo → Settings → Pages → Source: "Deploy from a branch" → main / root
# URL: https://TU_USUARIO.github.io/sql-trainer/
```

---

## Configurar la API Key

1. Obtén tu key en [console.anthropic.com](https://console.anthropic.com) → API Keys
2. En la app, ve a **Config** → pega tu key (`sk-ant-...`) → Guardar
3. La key se guarda en `localStorage` — **nunca sale de tu browser** excepto hacia `api.anthropic.com`

---

## Cómo funciona la autogeneración

```
Usuario selecciona:
  Capa (1-4) + Concepto + Cantidad
        ↓
generator.js construye prompt con:
  - BUSINESS_CONTEXT (contexto Neubox)
  - WHMCS_SCHEMA (tablas/columnas/relaciones)
  - Capa objetivo + concepto
  - IDs existentes (para evitar duplicados)
        ↓
Claude API → JSON array de ejercicios
        ↓
store.js guarda en localStorage
        ↓
UI renderiza los nuevos ejercicios
```

Cada ejercicio generado incluye:
- `id`, `layer`, `concept`, `title`
- `question` — pregunta de negocio real
- `explanation` — didáctica del concepto
- `hint` — estructura sugerida
- `solution` — query SQL completa
- `check_rules` — keywords requeridas/prohibidas
- `pro_tip` — tip de experto
- `error_messages` — mensajes específicos por tipo de error

---

## Extender el schema

Para agregar tablas propias de Neubox, edita `data/schema.js`:

```javascript
// En WHMCS_SCHEMA.tables, agrega:
{
  name: "tbl_neubox_campaigns",
  alias: "Campañas Meta",
  description: "Datos de Meta Ads importados",
  rows_estimate: "~5,000",
  columns: [
    { name: "id",          type: "INT",     pk: true },
    { name: "campaign_id", type: "VARCHAR", note: "ID de Meta Ads" },
    { name: "spend",       type: "DECIMAL", note: "Gasto en MXN" },
    // ...
  ]
}
```

Los ejercicios generados automáticamente usarán la nueva tabla.

---

## Ejercicios semilla

La Capa 1 viene con 6 ejercicios hardcoded en `js/store.js` (array `SEED_EXERCISES`).
Siempre disponibles sin API. Las Capas 2-4 requieren generación.

---

## Personalizar el contexto de negocio

Edita `BUSINESS_CONTEXT` en `data/schema.js` para ajustar el tono y ejemplos
que usa Claude al generar. Por ejemplo, agregar productos específicos de Neubox,
patrones de análisis frecuentes, etc.

---

## Roadmap sugerido

- [ ] Exportar banco de ejercicios como JSON (backup)
- [ ] Importar ejercicios de un JSON
- [ ] Modo "review": repasar ejercicios fallidos
- [ ] Categorías por tabla (ej: "Solo tblhosting")
- [ ] Dark/light mode toggle
- [ ] PWA (offline con service worker)
