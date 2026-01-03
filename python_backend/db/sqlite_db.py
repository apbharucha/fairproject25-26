"""SQLite database operations for predictions and charts."""
import sqlite3
import json
from typing import Dict, List, Optional, Any
from datetime import datetime


class SQLiteDB:
    """SQLite database manager for predictions."""
    
    def __init__(self, db_path: str = None):
        import os
        if db_path is None:
            # Use project root directory - go up from python_backend/db/ to project root
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # current_dir is python_backend/db/, so go up twice to get project root
            project_root = os.path.dirname(os.path.dirname(current_dir))
            db_path = os.path.join(project_root, "sqlite.db")
            # Ensure directory exists
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = os.path.abspath(db_path)  # Use absolute path
        self._init_db()
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get a database connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _init_db(self):
        """Initialize database tables."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Create tables
        cursor.executescript("""
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
                vancomycin_prob REAL,
                ceftaroline_prob REAL,
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
        """)
        
        # Migration: add bayesian probability columns if missing
        try:
            cursor.execute("PRAGMA table_info(prediction_outputs)")
            cols = [row[1] for row in cursor.fetchall()]
            if 'vancomycin_prob' not in cols:
                cursor.execute("ALTER TABLE prediction_outputs ADD COLUMN vancomycin_prob REAL")
            if 'ceftaroline_prob' not in cols:
                cursor.execute("ALTER TABLE prediction_outputs ADD COLUMN ceftaroline_prob REAL")
        except Exception:
            pass
        
        conn.commit()
        conn.close()
    
    def add_prediction(self, prediction_data: Dict[str, Any]) -> int:
        """Add a prediction to the database."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Insert prediction
            cursor.execute("INSERT INTO predictions (type) VALUES (?)", (prediction_data['type'],))
            prediction_id = cursor.lastrowid
            
            # Insert inputs
            input_data = prediction_data.get('input', {})
            for key, value in input_data.items():
                if isinstance(value, list):
                    value = ', '.join(str(v) for v in value)
                else:
                    value = str(value) if value is not None else ''
                cursor.execute(
                    "INSERT INTO prediction_inputs (prediction_id, key, value) VALUES (?, ?, ?)",
                    (prediction_id, key, value)
                )
            
            # Insert output
            output = prediction_data.get('output', {})
            if prediction_data['type'] == 'bayesian':
                van = output.get('vancomycinResistanceProbability')
                cef = output.get('ceftarolineResistanceProbability')
                conf = None
                if van is not None and cef is not None:
                    conf = max(0, min(1, (van + cef) / 2))
                
                cursor.execute(
                    """INSERT INTO prediction_outputs 
                       (prediction_id, summary, confidence, explanation, interventions, vancomycin_prob, ceftaroline_prob) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (
                        prediction_id,
                        None,
                        conf,
                        output.get('rationale'),
                        output.get('solution'),
                        van,
                        cef
                    )
                )
            else:
                cursor.execute(
                    """INSERT INTO prediction_outputs 
                       (prediction_id, summary, confidence, explanation, interventions) 
                       VALUES (?, ?, ?, ?, ?)""",
                    (
                        prediction_id,
                        output.get('resistancePrediction'),
                        output.get('confidenceLevel'),
                        output.get('inDepthExplanation'),
                        output.get('suggestedInterventions')
                    )
                )
            
            # Insert charts
            charts = output.get('charts', [])
            for chart in charts:
                cursor.execute(
                    "INSERT INTO charts (prediction_id, title) VALUES (?, ?)",
                    (prediction_id, chart['title'])
                )
                chart_id = cursor.lastrowid
                
                # Insert chart data
                for point in chart.get('data', []):
                    cursor.execute(
                        "INSERT INTO chart_data (chart_id, name, value) VALUES (?, ?, ?)",
                        (chart_id, point['name'], point['value'])
                    )
                
                # Insert chart meta
                context = None
                interpretation = None
                if 'Contribution' in chart['title']:
                    context = 'Relative contribution of named mutations to resistance risk, normalized to 0–1 under cautious interpretation.'
                    interpretation = 'Higher values indicate greater inferred influence of the mutation on resistance risk. Values are observational, not diagnostic.'
                elif 'Co-occurrence' in chart['title']:
                    context = 'Frequency of mutation co-occurrence across isolates, normalized to 0–1.'
                    interpretation = 'Higher values indicate mutations observed together more often across isolates. Association does not imply causation.'
                else:
                    context = 'Quantitative visualization of model-derived signals, normalized to 0–1.'
                    interpretation = 'Values represent normalized magnitudes and should be interpreted cautiously in context of other evidence.'
                
                cursor.execute(
                    "INSERT INTO chart_meta (chart_id, context, interpretation, image) VALUES (?, ?, ?, NULL)",
                    (chart_id, context, interpretation)
                )
            
            conn.commit()
            return prediction_id
        finally:
            conn.close()
    
    def get_graph_by_id(self, chart_id: int) -> Optional[Dict[str, Any]]:
        """Get a graph/chart by ID."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT c.id, c.title, c.prediction_id, m.context, m.interpretation, m.image
                FROM charts c
                LEFT JOIN chart_meta m ON c.id = m.chart_id
                WHERE c.id = ?
            """, (chart_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            # Get chart data
            cursor.execute("SELECT name, value FROM chart_data WHERE chart_id = ?", (chart_id,))
            data = [{'name': r['name'], 'value': r['value']} for r in cursor.fetchall()]
            
            # Generate SVG if no image stored
            image_svg = row['image']
            if not image_svg:
                image_svg = self._render_chart_svg(row['title'], data, row['id'])
            
            return {
                'id': row['id'],
                'predictionId': row['prediction_id'],
                'title': row['title'],
                'context': row['context'],
                'interpretation': row['interpretation'],
                'imageSvg': image_svg if isinstance(image_svg, str) else image_svg.decode('utf-8'),
                'data': data
            }
        finally:
            conn.close()
    
    def list_predictions(self, limit: int = 10) -> List[Dict[str, Any]]:
        """List recent predictions."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, type, strftime('%Y-%m-%dT%H:%M:%SZ', created_at) AS created_at
                FROM predictions
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            
            results = []
            for row in rows:
                pred_id = row['id']
                
                # Get inputs
                cursor.execute("SELECT key, value FROM prediction_inputs WHERE prediction_id = ?", (pred_id,))
                inputs = {r['key']: r['value'] for r in cursor.fetchall()}
                
                # Get output
                cursor.execute("""
                    SELECT summary, confidence, explanation, interventions, vancomycin_prob, ceftaroline_prob
                    FROM prediction_outputs
                    WHERE prediction_id = ?
                """, (pred_id,))
                output_row = cursor.fetchone()
                
                # Get charts
                cursor.execute("SELECT id, title FROM charts WHERE prediction_id = ?", (pred_id,))
                charts = []
                for chart_row in cursor.fetchall():
                    cursor.execute("SELECT name, value FROM chart_data WHERE chart_id = ?", (chart_row['id'],))
                    charts.append({
                        'id': chart_row['id'],
                        'title': chart_row['title'],
                        'data': [{'name': r['name'], 'value': r['value']} for r in cursor.fetchall()]
                    })
                
                output = {}
                if output_row:
                    if row['type'] == 'bayesian':
                        output = {
                            'vancomycinResistanceProbability': output_row['vancomycin_prob'],
                            'ceftarolineResistanceProbability': output_row['ceftaroline_prob'],
                            'rationale': output_row['explanation'],
                            'solution': output_row['interventions'],
                            'confidenceLevel': output_row['confidence'],
                            'charts': charts
                        }
                    else:
                        output = {
                            'resistancePrediction': output_row['summary'],
                            'confidenceLevel': output_row['confidence'],
                            'inDepthExplanation': output_row['explanation'],
                            'suggestedInterventions': output_row['interventions'],
                            'charts': charts
                        }
                
                results.append({
                    'id': pred_id,
                    'type': row['type'],
                    'createdAt': row['created_at'],
                    'input': inputs,
                    'output': output
                })
            
            return results
        finally:
            conn.close()
    
    def _render_chart_svg(self, title: str, data: List[Dict[str, Any]], chart_id: Optional[int] = None) -> str:
        """Render a chart as SVG."""
        width = 640
        height = 360
        padding = {'left': 60, 'right': 20, 'top': 30, 'bottom': 60}
        inner_w = width - padding['left'] - padding['right']
        inner_h = height - padding['top'] - padding['bottom']
        max_val = 1
        bar_w = max(10, inner_w / max(1, len(data)) - 10)
        
        x = padding['left']
        bars = []
        for d in data:
            h = max(0, min(inner_h, (d['value'] / max_val) * inner_h))
            bx = x
            by = height - padding['bottom'] - h
            label = d['name'][:13] + '…' if len(d['name']) > 14 else d['name']
            bars.append(f"""
<rect x="{bx}" y="{by}" width="{bar_w}" height="{h}" fill="#6e59f9" rx="4" />
<text x="{bx + bar_w / 2}" y="{height - padding['bottom'] + 14}" font-size="10" text-anchor="middle" fill="#555">{label}</text>""")
            x += bar_w + 10
        
        chart_id_text = (f"<text x=\"{width - padding['right'] - 8}\" y=\"{padding['top'] - 8}\" font-size=\"12\" text-anchor=\"end\" fill=\"#666\">Graph ID: {chart_id}</text>") if chart_id else ""
        
        svg = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<rect width="100%" height="100%" fill="#fff"/>
<text x="{width/2}" y="{padding['top'] - 8}" font-size="14" text-anchor="middle" fill="#222">{title}</text>
{chart_id_text}
<line x1="{padding['left']}" y1="{height - padding['bottom']}" x2="{width - padding['right']}" y2="{height - padding['bottom']}" stroke="#ccc"/>
<line x1="{padding['left']}" y1="{padding['top']}" x2="{padding['left']}" y2="{height - padding['bottom']}" stroke="#ccc"/>
<text x="{width/2}" y="{height - 12}" font-size="12" text-anchor="middle" fill="#333">Mutation / Feature</text>
<text transform="translate(16 {height/2}) rotate(-90)" font-size="12" text-anchor="middle" fill="#333">{'Relative Contribution Score' if 'Contribution' in title else 'Co-occurrence Frequency Across Isolates' if 'Co-occurrence' in title else 'Score'}</text>
{''.join(bars)}
</svg>'''
        return svg


# Global database instance
_db_instance: Optional[SQLiteDB] = None

def get_db() -> SQLiteDB:
    """Get the global database instance."""
    global _db_instance
    if _db_instance is None:
        _db_instance = SQLiteDB()
    return _db_instance

