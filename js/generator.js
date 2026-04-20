// ============================================================
// generator.js — Motor de generación de ejercicios con Claude API
// ============================================================

import { WHMCS_SCHEMA, BUSINESS_CONTEXT, PRODUCTS_CONTEXT } from '../data/schema.js';

// Capas con su descripción de dificultad y conceptos objetivo
export const LAYERS = {
  1: {
    name: "Recuperar datos",
    color: "#1a9e6a",
    badge: "badge-l1",
    concepts: ["SELECT *", "SELECT columnas", "FROM", "WHERE =", "ORDER BY", "LIMIT", "DISTINCT", "Alias con AS"],
    difficulty: "Fundamentos — toda query empieza aquí",
    sample_count: 6
  },
  2: {
    name: "Filtrar & transformar",
    color: "#3b6fd4",
    badge: "badge-l2",
    concepts: ["AND / OR / NOT", "IN / NOT IN", "BETWEEN", "LIKE / NOT LIKE", "IS NULL / IS NOT NULL", "CASE WHEN", "COALESCE", "CAST", "Funciones de fecha (YEAR, MONTH, DATEDIFF)"],
    difficulty: "Intermedio — dar forma al dataset",
    sample_count: 6
  },
  3: {
    name: "Agregar & agrupar",
    color: "#9a7a00",
    badge: "badge-l3",
    concepts: ["COUNT(*) / COUNT(col)", "SUM / AVG / MIN / MAX", "GROUP BY simple", "GROUP BY múltiple", "HAVING", "Subconsultas en WHERE", "Subconsultas en SELECT"],
    difficulty: "Analítico — resumir el negocio",
    sample_count: 5
  },
  4: {
    name: "Relacionar tablas",
    color: "#c43030",
    badge: "badge-l4",
    concepts: ["INNER JOIN", "LEFT JOIN", "Multi-table JOIN", "CTEs (WITH)", "Window Functions: RANK / ROW_NUMBER", "Window Functions: LAG / LEAD", "PARTITION BY"],
    difficulty: "Avanzado — cruzar fuentes de datos",
    sample_count: 5
  }
};

// ────────────────────────────────────────────────
// buildPrompt: construye el prompt para Claude
// ────────────────────────────────────────────────
function buildPrompt(layer, concept, count = 1, existingIds = [], customSchema = null) {
  const layerInfo = LAYERS[layer];
  const schemaText = formatSchemaForPrompt(customSchema);
  const existingNote = existingIds.length > 0
    ? `\nYa existen ejercicios con IDs: ${existingIds.join(', ')}. Genera IDs distintos comenzando desde l${layer}_${String(existingIds.length + 1).padStart(2,'0')}.`
    : '';

  return `${BUSINESS_CONTEXT}

## SCHEMA WHMCS DISPONIBLE
${schemaText}

## TAREA
Genera exactamente ${count} ejercicio(s) SQL de nivel CAPA ${layer} (${layerInfo.name}).
Concepto principal a ejercitar: **${concept}**
${existingNote}

## FORMATO DE RESPUESTA
Responde ÚNICAMENTE con un array JSON válido. Sin texto extra, sin backticks, sin explicaciones fuera del JSON.

Estructura de cada ejercicio:
{
  "id": "l${layer}_XX",           // XX = número secuencial con cero a la izquierda
  "layer": ${layer},
  "concept": "nombre del concepto",
  "title": "Título corto y descriptivo (max 6 palabras)",
  "question": "Pregunta clara que describe QUÉ debe obtener el analista. Incluye el nombre de tabla en código como \`tblname\`. Debe ser una pregunta de negocio real de Neubox.",
  "explanation": "Explicación didáctica del concepto en 2-3 oraciones. Incluye la sintaxis clave en código HTML con <code>KEYWORD</code>. Enfócate en EL CONCEPTO, no en la solución.",
  "hint": "Estructura sugerida en pseudocódigo SQL. Ej: SELECT col FROM tabla WHERE condicion",
  "solution": "La query SQL completa y correcta, formateada con saltos de línea \\n para legibilidad.",
  "check_rules": {
    "required_keywords": ["array", "de", "keywords", "lowercase", "que DEBEN estar en el query del alumno"],
    "forbidden_keywords": ["keywords", "que NO deben aparecer si hay error típico"],
    "custom_checks": ["descripción en texto de validaciones adicionales no cubiertas por keywords"]
  },
  "pro_tip": "Un tip de experto relacionado al concepto. Algo que un DBA senior diría.",
  "error_messages": {
    "no_table": "Mensaje cuando no usan la tabla correcta",
    "wrong_structure": "Mensaje cuando la estructura general está mal",
    "missing_key": "Mensaje cuando falta la keyword principal del concepto"
  }
}

## RESTRICCIONES
- Usa SOLO tablas y columnas del schema proporcionado
- Las preguntas deben tener contexto de negocio real (MRR, churn, cobros, soporte, etc.)
- La solución debe ser SQL estándar compatible con MySQL 5.7+
- El nivel de dificultad debe corresponder a la capa ${layer}
- Varía las tablas — no uses siempre tblinvoices
- Si la capa es 3 o 4, combina tablas cuando sea natural para la pregunta de negocio`;
}

// ────────────────────────────────────────────────
// formatSchemaForPrompt: schema compacto para el prompt
// ────────────────────────────────────────────────
function formatSchemaForPrompt(customSchema = null) {
  const schema = customSchema || WHMCS_SCHEMA;
  return schema.tables.map(t => {
    const cols = t.columns.map(c => {
      const flags = [c.pk ? 'PK' : null, c.fk ? `FK→${c.fk}` : null].filter(Boolean).join(' ');
      return `  ${c.name} ${c.type}${flags ? ' [' + flags + ']' : ''}${c.note ? ' -- ' + c.note : ''}`;
    }).join('\n');
    return `TABLE ${t.name} (${t.alias}) ~${t.rows_estimate} filas\n${cols}`;
  }).join('\n\n');
}

// ────────────────────────────────────────────────
// generateExercises: llama Claude API y parsea respuesta
// ────────────────────────────────────────────────
export async function generateExercises({ layer, concept, count = 1, existingIds = [], apiKey, customSchema = null }) {
  const prompt = buildPrompt(layer, concept, count, existingIds, customSchema);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: "Eres un generador de ejercicios SQL. Responde ÚNICAMENTE con JSON válido. Sin texto adicional, sin markdown, sin backticks.",
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text || '';

  // Parse robusto: limpia posibles backticks o texto extra
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Intento de recuperación: buscar el array dentro del texto
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error('No se pudo parsear la respuesta de Claude como JSON.');
  }

  return Array.isArray(parsed) ? parsed : [parsed];
}

// ────────────────────────────────────────────────
// askBusinessQuestion: Pregunta libre → SQL sugerido
// ────────────────────────────────────────────────
export async function askBusinessQuestion({ question, apiKey, customSchema = null }) {
  const schemaText = formatSchemaForPrompt(customSchema);

  const userPrompt = `${BUSINESS_CONTEXT}

## CATÁLOGO DE PRODUCTOS (IDs reales en tblproducts / tblhosting.packageid)
${PRODUCTS_CONTEXT}

## SCHEMA DE BASE DE DATOS
${schemaText}

## PREGUNTA DE NEGOCIO
${question}

## INSTRUCCIONES
Genera el query SQL más preciso posible para MySQL 5.7+ que responda exactamente la pregunta.
Usa los IDs y nombres de producto del catálogo cuando sea relevante.
Usa alias descriptivos en las columnas del SELECT.
Formatea el SQL con saltos de línea para legibilidad.

Responde ÚNICAMENTE con este JSON (sin backticks, sin texto extra):
{
  "query": "SELECT ... -- query SQL completo",
  "explanation": "Qué hace el query y por qué está estructurado así (2-3 oraciones)",
  "tables": ["tabla1", "tabla2"],
  "insight": "Un insight de negocio que revela este dato — qué acción tomar con este resultado (1 oración)"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: 'Eres un experto en SQL y BI para SaaS de hosting. Responde ÚNICAMENTE con JSON válido. Sin texto adicional, sin markdown, sin backticks.',
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const raw  = data.content?.[0]?.text || '';
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('No se pudo parsear la respuesta de Claude.');
  }
}

// ────────────────────────────────────────────────
// checkAnswer: evalúa respuesta del alumno
// ────────────────────────────────────────────────
export function checkAnswer(exercise, userQuery, customSchema = null) {
  const q = userQuery.toLowerCase().replace(/\s+/g, ' ').trim();
  const rules = exercise.check_rules;

  // Check required keywords
  const missingKeywords = (rules.required_keywords || []).filter(kw => !q.includes(kw.toLowerCase()));

  if (missingKeywords.length > 0) {
    // Find best error message
    const missing = missingKeywords[0];
    let msg = exercise.error_messages?.missing_key || `Falta usar <code>${missing.toUpperCase()}</code> en tu query.`;

    // Check for specific common errors
    if (!q.includes('from')) {
      msg = exercise.error_messages?.wrong_structure || 'Todo query necesita <code>FROM tabla</code>.';
    } else if (!q.includes('select')) {
      msg = 'Un query SQL siempre empieza con <code>SELECT</code>.';
    }

    const activeSchema = customSchema || WHMCS_SCHEMA;
    const tableMentioned = activeSchema.tables.some(t => q.includes(t.name));
    if (!tableMentioned && q.includes('from')) {
      msg = exercise.error_messages?.no_table || 'No encontré ninguna tabla WHMCS en tu query. Revisa el schema.';
    }

    return { ok: false, message: msg, missing: missingKeywords };
  }

  // Check forbidden keywords (common wrong patterns)
  const forbidden = (rules.forbidden_keywords || []).filter(kw => q.includes(kw.toLowerCase()));
  if (forbidden.length > 0) {
    return {
      ok: false,
      message: `Detecté un patrón incorrecto: <code>${forbidden[0].toUpperCase()}</code>. ${exercise.error_messages?.wrong_structure || 'Revisa la estructura.'}`
    };
  }

  return { ok: true };
}
