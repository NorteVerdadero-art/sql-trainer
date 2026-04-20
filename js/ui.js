// ============================================================
// ui.js — Renders y eventos de la interfaz
// ============================================================

import { LAYERS } from './generator.js';
import { WHMCS_SCHEMA } from '../data/schema.js';

// ────────────────────────────────────────────────
// renderExerciseCard
// ────────────────────────────────────────────────
export function renderExerciseCard(ex, store, { examMode = false, onSubmit, onHint, onSolution } = {}) {
  const prefix = examMode ? 'exam_' : '';
  const isDone  = store.isCompleted(ex.id);
  const attempts = store.getAttempts(ex.id);
  const layerColor = LAYERS[ex.layer]?.color || '#888';

  const el = document.createElement('div');
  el.className = 'ex-card';
  el.id = `card_${prefix}${ex.id}`;
  el.innerHTML = `
    <div class="ex-header">
      <span class="ex-num">${ex.id}</span>
      <span class="ex-title">${ex.title}</span>
      <span class="badge-layer" style="color:${layerColor}; background:${layerColor}22; border:1px solid ${layerColor}44;">${ex.concept}</span>
      ${isDone && !examMode ? '<span class="done-badge">✓</span>' : ''}
    </div>
    <div class="ex-body">
      <p class="ex-question">${ex.question}</p>
      <div class="explainer">
        <div class="explainer-label">📖 Concepto</div>
        <div class="explainer-text">${ex.explanation}</div>
      </div>
      <div class="editor-wrap">
        <div class="editor-bar">
          <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
          <span class="editor-file">query.sql</span>
          ${attempts.length > 0 ? `<span class="attempt-count">${attempts.length} intento${attempts.length > 1 ? 's' : ''}</span>` : ''}
        </div>
        <textarea
          class="sql-input"
          id="inp_${prefix}${ex.id}"
          spellcheck="false"
          autocomplete="off"
          placeholder="-- Escribe tu query aquí&#10;SELECT ..."
        ></textarea>
      </div>
      <div class="btn-row">
        <button class="btn btn-run" data-id="${ex.id}" data-prefix="${prefix}">▶ Ejecutar</button>
        <button class="btn btn-hint" data-id="${ex.id}" data-prefix="${prefix}">💡 Pista</button>
        ${!examMode ? `<button class="btn btn-solution" data-id="${ex.id}">Ver solución</button>` : ''}
      </div>
      <div class="feedback" id="fb_${prefix}${ex.id}"></div>
    </div>`;

  // Wire up events
  el.querySelector('.btn-run').addEventListener('click', () => onSubmit?.(ex, prefix));
  el.querySelector('.btn-hint').addEventListener('click', () => onHint?.(ex, prefix));
  if (!examMode) el.querySelector('.btn-solution')?.addEventListener('click', () => onSolution?.(ex));

  return el;
}

// ────────────────────────────────────────────────
// Feedback helpers
// ────────────────────────────────────────────────
export function showFeedback(fbEl, type, title, body, extra = '') {
  fbEl.className = `feedback ${type} show`;
  fbEl.innerHTML = `
    <div class="fb-title">${title}</div>
    <div class="fb-body">${body}</div>
    ${extra}`;
}

export function showSuccessFeedback(fbEl, ex) {
  showFeedback(fbEl, 'ok', '✓ Correcto', `
    Identificaste correctamente el concepto <code>${ex.concept}</code>.
    <br><br>
    <strong>Tip pro:</strong> ${ex.pro_tip}
  `);
}

export function showErrorFeedback(fbEl, message) {
  showFeedback(fbEl, 'err', '✗ Revisa tu query', message);
}

export function showHintFeedback(fbEl, ex) {
  showFeedback(fbEl, 'hint', '💡 Pista', `
    Estructura sugerida:<br>
    <code style="display:block;margin-top:6px;padding:8px;background:var(--bg);border-radius:4px;font-size:12px;">${ex.hint}</code>
  `);
}

export function showSolutionFeedback(fbEl, ex) {
  showFeedback(fbEl, 'hint', '📋 Solución', `
    Estudia la estructura, luego reproúcela sin mirar:
    <pre class="solution-pre">${ex.solution}</pre>
  `);
}

// ────────────────────────────────────────────────
// Progress widgets
// ────────────────────────────────────────────────
export function renderProgressBar(store) {
  const { total, done, pct } = store.getProgress();
  return { total, done, pct };
}

export function renderLayerProgress(layerNum, store) {
  const { total, done } = store.getProgressByLayer(layerNum);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, pct };
}

// ────────────────────────────────────────────────
// Schema renderer
// ────────────────────────────────────────────────
export function renderSchemaTable(tableData) {
  const cols = tableData.columns.map(c => {
    const flags = [];
    if (c.pk) flags.push('<span class="col-pk">PK</span>');
    if (c.fk) flags.push(`<span class="col-fk">→${c.fk}</span>`);
    return `<div class="schema-row">
      <span class="col-name">${c.name}</span>
      <span class="col-type">${c.type}</span>
      <span class="col-flags">${flags.join('')}</span>
      <span class="col-note">${c.note || ''}</span>
    </div>`;
  }).join('');

  return `<div class="schema-card">
    <div class="schema-header">
      <span class="schema-tname">${tableData.name}</span>
      <span class="schema-talias">${tableData.alias}</span>
      <span class="schema-trows">${tableData.rows_estimate}</span>
    </div>
    <div class="schema-cols">${cols}</div>
  </div>`;
}

// ────────────────────────────────────────────────
// Exam score render
// ────────────────────────────────────────────────
export function renderExamScore(result) {
  const { correct, total, pct, wrongExercises } = result;
  const color = pct >= 80 ? '#3ecf8e' : pct >= 60 ? '#f7c94b' : '#e85d5d';
  const msg = pct === 100 ? '¡Perfecto — dominio total!'
    : pct >= 80 ? '¡Muy sólido! Sigue así.'
    : pct >= 60 ? 'Bien encaminado, sigue practicando.'
    : 'Repasa las capas con más errores.';

  const r = 50, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const wrongHtml = wrongExercises.length === 0 ? '' : `
    <div class="wrong-list">
      <div class="wrong-title">Ejercicios a repasar:</div>
      ${wrongExercises.map(ex => `
        <div class="wrong-item">
          <div class="wrong-ex-title">${ex.title}</div>
          <div class="wrong-ex-concept">${ex.concept}</div>
          <pre class="wrong-solution">${ex.solution}</pre>
        </div>`).join('')}
    </div>`;

  return `
    <div class="score-wrap">
      <div class="score-ring">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--dim)" stroke-width="8"/>
          <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="8"
            stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}"
            stroke-linecap="round" transform="rotate(-90 60 60)"/>
        </svg>
        <div class="score-num" style="color:${color}">${pct}%</div>
      </div>
      <div class="score-label">${correct}/${total} correctas</div>
      <div class="score-msg">${msg}</div>
      ${wrongHtml}
    </div>`;
}

// ────────────────────────────────────────────────
// Toast notifications
// ────────────────────────────────────────────────
export function showToast(message, type = 'info') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
