import Database from 'better-sqlite3';

const db = new Database('sqlite.db');

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prediction_inputs (
    prediction_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS prediction_outputs (
    prediction_id INTEGER NOT NULL,
    summary TEXT,
    confidence REAL,
    explanation TEXT,
    interventions TEXT,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chart_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chart_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chart_meta (
    chart_id INTEGER PRIMARY KEY,
    context TEXT,
    interpretation TEXT,
    image BLOB,
    FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE CASCADE
  );
`);

// Migration: add bayesian probability columns if missing
try {
  const cols: Array<{ name: string }> = db
    .prepare(`PRAGMA table_info(prediction_outputs)`) 
    .all() as any;
  const hasVan = cols.some(c => c.name === 'vancomycin_prob');
  const hasCef = cols.some(c => c.name === 'ceftaroline_prob');
  if (!hasVan) {
    db.exec(`ALTER TABLE prediction_outputs ADD COLUMN vancomycin_prob REAL`);
  }
  if (!hasCef) {
    db.exec(`ALTER TABLE prediction_outputs ADD COLUMN ceftaroline_prob REAL`);
  }
} catch {}

export function addPredictionToSqlite(predictionData: any) {
  const insertPrediction = db.prepare(`INSERT INTO predictions (type) VALUES (?)`);
  const insertInput = db.prepare(`INSERT INTO prediction_inputs (prediction_id, key, value) VALUES (?, ?, ?)`);
  const insertOutput = db.prepare(`INSERT INTO prediction_outputs (prediction_id, summary, confidence, explanation, interventions) VALUES (?, ?, ?, ?, ?)`);
  const updateBayesProbs = db.prepare(`UPDATE prediction_outputs SET vancomycin_prob = ?, ceftaroline_prob = ? WHERE prediction_id = ?`);
  const insertChart = db.prepare(`INSERT INTO charts (prediction_id, title) VALUES (?, ?)`);
  const insertChartData = db.prepare(`INSERT INTO chart_data (chart_id, name, value) VALUES (?, ?, ?)`);
  const insertChartMeta = db.prepare(`INSERT INTO chart_meta (chart_id, context, interpretation, image) VALUES (?, ?, ?, NULL)`);

  const tx = db.transaction(() => {
    const result = insertPrediction.run(predictionData.type);
    const predictionId = result.lastInsertRowid as number;

    const input = predictionData.input || {};
    Object.entries(input).forEach(([key, value]) => {
      const v = Array.isArray(value) ? value.join(', ') : String(value ?? '');
      insertInput.run(predictionId, key, v);
    });

    const output = predictionData.output || {};
    if (predictionData.type === 'bayesian') {
      const van = typeof output.vancomycinResistanceProbability === 'number' ? output.vancomycinResistanceProbability : null;
      const cef = typeof output.ceftarolineResistanceProbability === 'number' ? output.ceftarolineResistanceProbability : null;
      const conf = van != null && cef != null ? Math.max(0, Math.min(1, (van + cef) / 2)) : null;
      insertOutput.run(
        predictionId,
        null,
        conf,
        output.rationale ?? null,
        output.solution ?? null
      );
      updateBayesProbs.run(van, cef, predictionId);
    } else {
      insertOutput.run(
        predictionId,
        output.resistancePrediction ?? null,
        output.confidenceLevel ?? null,
        output.inDepthExplanation ?? null,
        output.suggestedInterventions ?? null
      );
    }

    const charts = output.charts || [];
    for (const chart of charts) {
      const chartRes = insertChart.run(predictionId, chart.title);
      const chartId = chartRes.lastInsertRowid as number;
      for (const point of chart.data || []) {
        insertChartData.run(chartId, point.name, point.value);
      }
      const ctx = chart.title.includes('Contribution')
        ? 'Relative contribution of named mutations to resistance risk, normalized to 0–1 under cautious interpretation.'
        : chart.title.includes('Co-occurrence')
        ? 'Frequency of mutation co-occurrence across isolates, normalized to 0–1.'
        : 'Quantitative visualization of model-derived signals, normalized to 0–1.';
      const interp = chart.title.includes('Contribution')
        ? 'Higher values indicate greater inferred influence of the mutation on resistance risk. Values are observational, not diagnostic.'
        : chart.title.includes('Co-occurrence')
        ? 'Higher values indicate mutations observed together more often across isolates. Association does not imply causation.'
        : 'Values represent normalized magnitudes and should be interpreted cautiously in context of other evidence.';
      insertChartMeta.run(chartId, ctx, interp);
    }

    return predictionId;
  });

  return tx();
}

function renderChartSvg(title: string, data: Array<{ name: string; value: number }>, chartId?: number) {
  const width = 640;
  const height = 360;
  const padding = { left: 60, right: 20, top: 30, bottom: 60 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = 1;
  const barW = Math.max(10, innerW / Math.max(1, data.length) - 10);
  let x = padding.left;
  const bars = data.map((d) => {
    const h = Math.max(0, Math.min(innerH, (d.value / max) * innerH));
    const bx = x;
    const by = height - padding.bottom - h;
    const label = d.name.length > 14 ? d.name.slice(0, 13) + '…' : d.name;
    x += barW + 10;
    return `\n<rect x="${bx}" y="${by}" width="${barW}" height="${h}" fill="#6e59f9" rx="4" />\n<text x="${bx + barW / 2}" y="${height - padding.bottom + 14}" font-size="10" text-anchor="middle" fill="#555">${label}</text>`;
  }).join('');
  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n<rect width="100%" height="100%" fill="#fff"/>\n<text x="${width/2}" y="${padding.top - 8}" font-size="14" text-anchor="middle" fill="#222">${title}</text>\n${chartId != null ? `<text x="${width - padding.right - 8}" y="${padding.top - 8}" font-size="12" text-anchor="end" fill="#666">Graph ID: ${chartId}</text>` : ''}\n<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#ccc"/>\n<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#ccc"/>\n<text x="${width/2}" y="${height - 12}" font-size="12" text-anchor="middle" fill="#333">Mutation / Feature</text>\n<text transform="translate(16 ${height/2}) rotate(-90)" font-size="12" text-anchor="middle" fill="#333">${title.includes('Contribution') ? 'Relative Contribution Score' : title.includes('Co-occurrence') ? 'Co-occurrence Frequency Across Isolates' : 'Score'}</text>\n${bars}\n</svg>`;
  return svg;
}

export function getGraphById(chartId: number) {
  const getChart = db.prepare(`SELECT c.id as id, c.title as title, c.prediction_id as prediction_id, m.context as context, m.interpretation as interpretation, m.image as image FROM charts c LEFT JOIN chart_meta m ON c.id = m.chart_id WHERE c.id = ?`);
  const getData = db.prepare(`SELECT name, value FROM chart_data WHERE chart_id = ?`);
  const row: any = getChart.get(chartId);
  if (!row) return null;
  const data = getData.all(chartId).map((d: any) => ({ name: d.name, value: d.value }));
  const imageSvg = row.image ? row.image.toString() : renderChartSvg(row.title, data, row.id);
  return {
    id: row.id,
    predictionId: row.prediction_id,
    title: row.title,
    context: row.context,
    interpretation: row.interpretation,
    imageSvg,
    data,
  };
}

export function listPredictions(limit: number = 10) {
  const rows: Array<{ id: number; type: string; created_at: string }> = db
    .prepare(`SELECT id, type, strftime('%Y-%m-%dT%H:%M:%SZ', created_at) AS created_at FROM predictions ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as any;

  const getInputs = db.prepare(`SELECT key, value FROM prediction_inputs WHERE prediction_id = ?`);
  const getOutput = db.prepare(`SELECT summary, confidence, explanation, interventions, vancomycin_prob, ceftaroline_prob FROM prediction_outputs WHERE prediction_id = ?`);
  const getCharts = db.prepare(`SELECT id, title FROM charts WHERE prediction_id = ?`);
  const getChartData = db.prepare(`SELECT name, value FROM chart_data WHERE chart_id = ?`);

  return rows.map(row => {
    const inputs = getInputs.all(row.id);
    const output: any = getOutput.get(row.id) || {};
    const charts = getCharts.all(row.id).map((c: any) => ({
      id: c.id,
      title: c.title,
      data: getChartData.all(c.id).map((d: any) => ({ name: d.name, value: d.value }))
    }));

    return {
      id: row.id,
      type: row.type,
      createdAt: row.created_at,
      input: Object.fromEntries(inputs.map((i: any) => [i.key, i.value])),
      output: output && (row.type === 'bayesian'
        ? {
            vancomycinResistanceProbability: output.vancomycin_prob,
            ceftarolineResistanceProbability: output.ceftaroline_prob,
            rationale: output.explanation,
            solution: output.interventions,
            confidenceLevel: output.confidence,
            charts,
          }
        : {
            resistancePrediction: output.summary,
            confidenceLevel: output.confidence,
            inDepthExplanation: output.explanation,
            suggestedInterventions: output.interventions,
            charts,
          }),
    };
  });
}
