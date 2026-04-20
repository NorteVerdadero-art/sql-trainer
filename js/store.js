// ============================================================
// store.js — Estado global, persistencia y banco de ejercicios
// ============================================================

const STORAGE_KEY = 'sql_trainer_v2';

// Ejercicios hardcoded de arranque (Capa 1 completa)
// Siempre disponibles sin necesidad de API
export const SEED_EXERCISES = [
  {
    id: "l1_01", layer: 1, concept: "SELECT *",
    title: "Tu primer SELECT",
    question: "Trae todas las columnas de la tabla <code>tblinvoices</code>. El punto de entrada a cualquier análisis.",
    explanation: "<code>SELECT *</code> significa 'dame todas las columnas'. El <code>*</code> es un comodín. <code>FROM</code> indica la tabla fuente. Es la query más básica y el punto de entrada obligatorio.",
    hint: "SELECT * FROM tabla",
    solution: "SELECT *\nFROM tblinvoices;",
    check_rules: {
      required_keywords: ["select", "from", "tblinvoices"],
      forbidden_keywords: [],
      custom_checks: []
    },
    pro_tip: "En producción evita SELECT * — selecciona solo las columnas necesarias. Reduce tráfico de red y carga en el servidor.",
    error_messages: {
      no_table: "Necesitas especificar la tabla tblinvoices después de FROM.",
      wrong_structure: "La estructura es SELECT [columnas] FROM [tabla].",
      missing_key: "Falta el * o las columnas específicas después de SELECT."
    }
  },
  {
    id: "l1_02", layer: 1, concept: "SELECT columnas",
    title: "Solo lo que necesitas",
    question: "Trae solo <code>id</code>, <code>userid</code>, <code>total</code> y <code>status</code> de <code>tblinvoices</code>.",
    explanation: "En vez de <code>SELECT *</code>, nombra solo las columnas que necesitas separadas por comas. Mejora rendimiento y claridad del análisis.",
    hint: "SELECT col1, col2, col3 FROM tabla",
    solution: "SELECT id, userid, total, status\nFROM tblinvoices;",
    check_rules: {
      required_keywords: ["select", "from", "tblinvoices", "total", "status"],
      forbidden_keywords: ["select *"],
      custom_checks: []
    },
    pro_tip: "Dale alias descriptivos a tus columnas: SELECT total AS ingreso_total. Hace legibles los reportes ejecutivos.",
    error_messages: {
      no_table: "Falta FROM tblinvoices.",
      wrong_structure: "SELECT col1, col2 FROM tabla — las columnas van separadas por comas.",
      missing_key: "Especifica las columnas individuales en lugar de *."
    }
  },
  {
    id: "l1_03", layer: 1, concept: "WHERE =",
    title: "Filtrar facturas pagadas",
    question: "Trae todas las facturas donde <code>status</code> sea <code>'Paid'</code> de la tabla <code>tblinvoices</code>.",
    explanation: "<code>WHERE</code> filtra filas que cumplen una condición. El operador <code>=</code> compara exactamente. Los textos van entre comillas simples <code>'valor'</code>.",
    hint: "SELECT * FROM tabla WHERE columna = 'valor'",
    solution: "SELECT *\nFROM tblinvoices\nWHERE status = 'Paid';",
    check_rules: {
      required_keywords: ["where", "status"],
      forbidden_keywords: [],
      custom_checks: ["debe incluir 'Paid' o 'paid' entre comillas"]
    },
    pro_tip: "Los valores de texto en SQL siempre van entre comillas simples. Las comillas dobles son para nombres de columnas/tablas (y no siempre funcionan en MySQL).",
    error_messages: {
      no_table: "Necesitas FROM tblinvoices.",
      wrong_structure: "Estructura: SELECT * FROM tblinvoices WHERE status = 'Paid'",
      missing_key: "Falta la cláusula WHERE para filtrar."
    }
  },
  {
    id: "l1_04", layer: 1, concept: "ORDER BY DESC",
    title: "Facturas más grandes primero",
    question: "Trae <code>id</code> y <code>total</code> de <code>tblinvoices</code> ordenadas de mayor a menor por <code>total</code>.",
    explanation: "<code>ORDER BY columna DESC</code> ordena de mayor a menor. <code>ASC</code> es de menor a mayor (default). El orden lógico: SELECT → FROM → WHERE → ORDER BY.",
    hint: "SELECT id, total FROM tabla ORDER BY total DESC",
    solution: "SELECT id, total\nFROM tblinvoices\nORDER BY total DESC;",
    check_rules: {
      required_keywords: ["order by", "total", "desc"],
      forbidden_keywords: [],
      custom_checks: []
    },
    pro_tip: "Puedes ordenar por múltiples columnas: ORDER BY total DESC, date ASC. El segundo criterio rompe empates del primero.",
    error_messages: {
      no_table: "Falta FROM tblinvoices.",
      wrong_structure: "Agrega ORDER BY al final del query.",
      missing_key: "Falta DESC para ordenar de mayor a menor."
    }
  },
  {
    id: "l1_05", layer: 1, concept: "LIMIT",
    title: "Top 10 clientes recientes",
    question: "Obtén los 10 clientes más recientes de <code>tblclients</code> ordenados por <code>datecreated</code>.",
    explanation: "<code>LIMIT n</code> restringe el número de filas devueltas. Combinar <code>ORDER BY fecha DESC</code> + <code>LIMIT 10</code> es el patrón clásico para 'dame los N más recientes'.",
    hint: "ORDER BY datecreated DESC LIMIT 10",
    solution: "SELECT *\nFROM tblclients\nORDER BY datecreated DESC\nLIMIT 10;",
    check_rules: {
      required_keywords: ["limit", "tblclients", "datecreated", "desc"],
      forbidden_keywords: [],
      custom_checks: ["debe incluir el número 10"]
    },
    pro_tip: "LIMIT es MySQL/MariaDB. En SQL Server usa TOP 10, en PostgreSQL también LIMIT, en Oracle usa ROWNUM o FETCH FIRST.",
    error_messages: {
      no_table: "Falta FROM tblclients.",
      wrong_structure: "La estructura es: SELECT * FROM tabla ORDER BY col DESC LIMIT n",
      missing_key: "Falta LIMIT para restringir el número de resultados."
    }
  },
  {
    id: "l1_06", layer: 1, concept: "DISTINCT",
    title: "Gateways únicos",
    question: "Lista todos los métodos de pago únicos (<code>paymentmethod</code>) que existen en <code>tblinvoices</code>. Sin repeticiones.",
    explanation: "<code>DISTINCT</code> elimina duplicados. Si hay 500k facturas con 6 gateways distintos, <code>SELECT DISTINCT paymentmethod</code> devuelve solo 6 filas. Útil para explorar qué valores existen.",
    hint: "SELECT DISTINCT columna FROM tabla",
    solution: "SELECT DISTINCT paymentmethod\nFROM tblinvoices;",
    check_rules: {
      required_keywords: ["distinct", "paymentmethod", "tblinvoices"],
      forbidden_keywords: [],
      custom_checks: []
    },
    pro_tip: "COUNT(DISTINCT paymentmethod) te dice cuántos gateways únicos hay — diferente a listarlos. Muy útil en GROUP BY reports.",
    error_messages: {
      no_table: "Falta FROM tblinvoices.",
      wrong_structure: "La estructura es: SELECT DISTINCT columna FROM tabla",
      missing_key: "Falta la keyword DISTINCT antes del nombre de columna."
    }
  },
];

// ────────────────────────────────────────────────
// Store: gestiona estado y localStorage
// ────────────────────────────────────────────────
export class TrainerStore {
  constructor() {
    this._load();
  }

  _load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.exercises   = data.exercises   || [...SEED_EXERCISES];
        this.completed   = new Set(data.completed || []);
        this.attempts    = data.attempts    || {};
        this.examHistory = data.examHistory || [];
        this.apiKey      = data.apiKey      || '';
      } else {
        this._reset();
      }
    } catch {
      this._reset();
    }
  }

  _reset() {
    this.exercises   = [...SEED_EXERCISES];
    this.completed   = new Set();
    this.attempts    = {};
    this.examHistory = [];
    this.apiKey      = '';
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        exercises:   this.exercises,
        completed:   [...this.completed],
        attempts:    this.attempts,
        examHistory: this.examHistory,
        apiKey:      this.apiKey,
      }));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }

  // Exercises
  getByLayer(layer) {
    return this.exercises.filter(e => e.layer === layer);
  }

  getAll() { return this.exercises; }

  addExercises(newExercises) {
    const existingIds = new Set(this.exercises.map(e => e.id));
    const added = newExercises.filter(e => !existingIds.has(e.id));
    this.exercises.push(...added);
    this.save();
    return added.length;
  }

  // Progress
  markCompleted(id) {
    this.completed.add(id);
    this.save();
  }

  isCompleted(id) { return this.completed.has(id); }

  getProgress() {
    const total = this.exercises.length;
    const done  = this.completed.size;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  getProgressByLayer(layer) {
    const exs  = this.getByLayer(layer);
    const done = exs.filter(e => this.completed.has(e.id)).length;
    return { total: exs.length, done };
  }

  // Attempts log
  logAttempt(exId, query, ok) {
    if (!this.attempts[exId]) this.attempts[exId] = [];
    this.attempts[exId].push({ ts: Date.now(), query: query.substring(0, 120), ok });
    this.save();
  }

  getAttempts(exId) { return this.attempts[exId] || []; }

  // Exam history
  saveExam(result) {
    this.examHistory.push({ ...result, ts: Date.now() });
    this.save();
  }

  // API key (stored locally, never sent anywhere but Anthropic)
  setApiKey(key) {
    this.apiKey = key;
    this.save();
  }

  getApiKey() { return this.apiKey; }

  // IDs existentes por layer — para evitar duplicados al generar
  getExistingIdsByLayer(layer) {
    return this.getByLayer(layer).map(e => e.id);
  }

  // Reset solo ejercicios generados (conserva seed + progress)
  clearGeneratedExercises() {
    const seedIds = new Set(SEED_EXERCISES.map(e => e.id));
    this.exercises = this.exercises.filter(e => seedIds.has(e.id));
    this.save();
  }
}
