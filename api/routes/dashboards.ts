import { Router, type Request, type Response } from 'express';
import { db } from '../db/database.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM dashboards ORDER BY is_default DESC, created_at DESC');
    const dashboards = stmt.all();

    res.json({
      success: true,
      data: dashboards,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const dashboardStmt = db.prepare('SELECT * FROM dashboards WHERE id = ?');
    const dashboard = dashboardStmt.get(Number(id));

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found',
      });
    }

    const widgetsStmt = db.prepare('SELECT * FROM dashboard_widgets WHERE dashboard_id = ? ORDER BY position_y, position_x');
    const widgets = widgetsStmt.all(Number(id));

    res.json({
      success: true,
      data: {
        ...dashboard,
        widgets,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/', (req: Request, res: Response) => {
  const { name, description, is_default } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO dashboards (name, description, is_default)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(name, description || '', is_default ? 1 : 0);

    const dashboardStmt = db.prepare('SELECT * FROM dashboards WHERE id = ?');
    const dashboard = dashboardStmt.get(result.lastInsertRowid as number);

    res.status(201).json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, layout_config } = req.body;

  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (layout_config !== undefined) {
      fields.push('layout_config = ?');
      values.push(typeof layout_config === 'string' ? layout_config : JSON.stringify(layout_config));
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(Number(id));

      const stmt = db.prepare(`UPDATE dashboards SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }

    const dashboardStmt = db.prepare('SELECT * FROM dashboards WHERE id = ?');
    const dashboard = dashboardStmt.get(Number(id));

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleteWidgets = db.prepare('DELETE FROM dashboard_widgets WHERE dashboard_id = ?');
    deleteWidgets.run(Number(id));

    const stmt = db.prepare('DELETE FROM dashboards WHERE id = ?');
    const result = stmt.run(Number(id));

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found',
      });
    }

    res.json({
      success: true,
      message: 'Dashboard deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id/widgets', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare('SELECT * FROM dashboard_widgets WHERE dashboard_id = ? ORDER BY position_y, position_x');
    const widgets = stmt.all(Number(id));

    res.json({
      success: true,
      data: widgets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/:id/widgets', (req: Request, res: Response) => {
  const { id } = req.params;
  const { widget_type, title, config, position_x, position_y, width, height } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO dashboard_widgets (dashboard_id, widget_type, title, config, position_x, position_y, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      Number(id),
      widget_type,
      title,
      config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null,
      position_x || 0,
      position_y || 0,
      width || 6,
      height || 4
    );

    const widgetStmt = db.prepare('SELECT * FROM dashboard_widgets WHERE id = ?');
    const widget = widgetStmt.get(result.lastInsertRowid as number);

    res.status(201).json({
      success: true,
      data: widget,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id/widgets/:widgetId', (req: Request, res: Response) => {
  const { id, widgetId } = req.params;
  const { title, config, position_x, position_y, width, height } = req.body;

  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      fields.push('title = ?');
      values.push(title);
    }
    if (config !== undefined) {
      fields.push('config = ?');
      values.push(typeof config === 'string' ? config : JSON.stringify(config));
    }
    if (position_x !== undefined) {
      fields.push('position_x = ?');
      values.push(position_x);
    }
    if (position_y !== undefined) {
      fields.push('position_y = ?');
      values.push(position_y);
    }
    if (width !== undefined) {
      fields.push('width = ?');
      values.push(width);
    }
    if (height !== undefined) {
      fields.push('height = ?');
      values.push(height);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(Number(widgetId));
      values.push(Number(id));

      const stmt = db.prepare(`UPDATE dashboard_widgets SET ${fields.join(', ')} WHERE id = ? AND dashboard_id = ?`);
      stmt.run(...values);
    }

    const widgetStmt = db.prepare('SELECT * FROM dashboard_widgets WHERE id = ?');
    const widget = widgetStmt.get(Number(widgetId));

    res.json({
      success: true,
      data: widget,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id/widgets/batch/update', (req: Request, res: Response) => {
  const { id } = req.params;
  const { widgets } = req.body;

  try {
    const updateMany = db.transaction(() => {
      for (const widget of widgets) {
        const stmt = db.prepare(`
          UPDATE dashboard_widgets
          SET position_x = ?, position_y = ?, width = ?, height = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND dashboard_id = ?
        `);
        stmt.run(widget.position_x, widget.position_y, widget.width, widget.height, widget.id, Number(id));
      }
    });

    updateMany();

    const widgetsStmt = db.prepare('SELECT * FROM dashboard_widgets WHERE dashboard_id = ? ORDER BY position_y, position_x');
    const updatedWidgets = widgetsStmt.all(Number(id));

    res.json({
      success: true,
      data: updatedWidgets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id/widgets/:widgetId', (req: Request, res: Response) => {
  const { id, widgetId } = req.params;

  try {
    const stmt = db.prepare('DELETE FROM dashboard_widgets WHERE id = ? AND dashboard_id = ?');
    const result = stmt.run(Number(widgetId), Number(id));

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found',
      });
    }

    res.json({
      success: true,
      message: 'Widget deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
