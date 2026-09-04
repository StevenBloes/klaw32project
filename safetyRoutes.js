import express from 'express';
import { runQuery } from '../db/database.js';

const router = express.Router();

/*************************************************************
 * CHECKPOINTS
 *************************************************************/

// Get all checkpoints
router.get('/checkpoints', async (req, res) => {
  try {
    const result = await runQuery(`
      SELECT *
      FROM checkpoint
      ORDER BY description
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get checkpoint by id
router.get('/checkpoints/:id', async (req, res) => {
  try {
    const result = await runQuery(`
      SELECT *
      FROM checkpoint
      WHERE checkpoint_id = ?
    `, [req.params.id]);

    res.json(result.rows[0] ?? null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create checkpoint
router.post('/checkpoints', async (req, res) => {
  try {
    const {
      checkpoint_category_id,
      checkpoint_area_id,
      description,
      remarks,
      active
    } = req.body;

    const result = await runQuery(`
      INSERT INTO checkpoint
      (
        checkpoint_category_id,
        checkpoint_area_id,
        description,
        remarks,
        active
      )
      VALUES (?, ?, ?, ?, ?)
    `, [
      checkpoint_category_id,
      checkpoint_area_id,
      description,
      remarks,
      active
    ]);

    res.status(201).json({
      checkpoint_id: result.insertId
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update checkpoint
router.put('/checkpoints/:id', async (req, res) => {
  try {

    const {
      checkpoint_category_id,
      checkpoint_area_id,
      description,
      remarks,
      active
    } = req.body;

    await runQuery(`
      UPDATE checkpoint
      SET
        checkpoint_category_id = ?,
        checkpoint_area_id = ?,
        description = ?,
        remarks = ?,
        active = ?
      WHERE checkpoint_id = ?
    `, [
      checkpoint_category_id,
      checkpoint_area_id,
      description,
      remarks,
      active,
      req.params.id
    ]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/*************************************************************
 * INSPECTION TEMPLATES
 *************************************************************/

// Get templates
router.get('/inspection-templates', async (req, res) => {
  try {

    const result = await runQuery(`
      SELECT *
      FROM inspection_template
      ORDER BY name
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get template details including checkpoints
router.get('/inspection-templates/:id', async (req, res) => {
  try {

    const template = await runQuery(`
      SELECT *
      FROM inspection_template
      WHERE inspection_template_id = ?
    `, [req.params.id]);

    const checkpoints = await runQuery(`
      SELECT
        txc.id,
        txc.sort_order,
        txc.required,
        c.*
      FROM inspection_template_x_checkpoint txc
      INNER JOIN checkpoint c
        ON c.checkpoint_id = txc.checkpoint_id
      WHERE txc.inspection_template_id = ?
      ORDER BY txc.sort_order
    `, [req.params.id]);

    res.json({
      template: template.rows[0],
      checkpoints: checkpoints.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create template
router.post('/inspection-templates', async (req, res) => {

  try {

    const {
      frequency_type_id,
      name,
      description,
      frequency_value,
      anchor_date,
      active,
      version
    } = req.body;

    const result = await runQuery(`
      INSERT INTO inspection_template
      (
        frequency_type_id,
        name,
        description,
        frequency_value,
        anchor_date,
        active,
        version,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      frequency_type_id,
      name,
      description,
      frequency_value,
      anchor_date,
      active,
      version
    ]);

    res.status(201).json({
      inspection_template_id: result.insertId
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update template
router.put('/inspection-templates/:id', async (req, res) => {

  try {

    const {
      frequency_type_id,
      name,
      description,
      frequency_value,
      anchor_date,
      active,
      version
    } = req.body;

    await runQuery(`
      UPDATE inspection_template
      SET
        frequency_type_id = ?,
        name = ?,
        description = ?,
        frequency_value = ?,
        anchor_date = ?,
        active = ?,
        version = ?,
        updated_at = NOW()
      WHERE inspection_template_id = ?
    `, [
      frequency_type_id,
      name,
      description,
      frequency_value,
      anchor_date,
      active,
      version,
      req.params.id
    ]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/*************************************************************
 * TEMPLATE CHECKPOINTS
 *************************************************************/

// Add checkpoint to template
router.post('/inspection-templates/:id/checkpoints', async (req, res) => {

  try {

    const {
      checkpoint_id,
      sort_order,
      required
    } = req.body;

    const result = await runQuery(`
      INSERT INTO inspection_template_x_checkpoint
      (
        checkpoint_id,
        inspection_template_id,
        sort_order,
        required
      )
      VALUES (?, ?, ?, ?)
    `, [
      checkpoint_id,
      req.params.id,
      sort_order,
      required
    ]);

    res.status(201).json({
      id: result.insertId
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update template checkpoint
router.put('/template-checkpoints/:id', async (req, res) => {

  try {

    const {
      sort_order,
      required
    } = req.body;

    await runQuery(`
      UPDATE inspection_template_x_checkpoint
      SET
        sort_order = ?,
        required = ?
      WHERE id = ?
    `, [
      sort_order,
      required,
      req.params.id
    ]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/*************************************************************
 * INSPECTIONS
 *************************************************************/

// Get inspections
router.get('/inspections', async (req, res) => {

  try {

    const result = await runQuery(`
      SELECT *
      FROM inspection
      ORDER BY planned_date DESC
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get inspection + items
router.get('/inspections/:id', async (req, res) => {

  try {

    const inspection = await runQuery(`
      SELECT *
      FROM inspection
      WHERE inspection_id = ?
    `, [req.params.id]);

    const items = await runQuery(`
      SELECT *
      FROM inspection_item
      WHERE inspection_id = ?
      ORDER BY sort_order
    `, [req.params.id]);

    res.json({
      inspection: inspection.rows[0],
      items: items.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/*************************************************************
 * CREATE INSPECTION
 * Copies checkpoints from template
 *************************************************************/

router.post('/inspections', async (req, res) => {

  try {

    const {
      inspection_template_id,
      planned_date,
      recorded_by
    } = req.body;

    const template = await runQuery(`
      SELECT *
      FROM inspection_template
      WHERE inspection_template_id = ?
    `, [inspection_template_id]);

    const templateData = template.rows[0];

    const inspectionResult = await runQuery(`
      INSERT INTO inspection
      (
        inspection_template_id,
        template_name,
        template_version,
        inspection_status_id,
        planned_date,
        recorded_at,
        recorded_by
      )
      VALUES
      (?, ?, ?, 1, ?, NOW(), ?)
    `, [
      templateData.inspection_template_id,
      templateData.name,
      templateData.version,
      planned_date,
      recorded_by
    ]);

    const inspectionId = inspectionResult.insertId;

    const checkpoints = await runQuery(`
      SELECT
        c.checkpoint_id,
        c.description,
        ca.value AS area_name,
        cc.value AS category_name,
        txc.required,
        txc.sort_order
      FROM inspection_template_x_checkpoint txc
      INNER JOIN checkpoint c
        ON c.checkpoint_id = txc.checkpoint_id
      INNER JOIN checkpoint_area ca
        ON ca.checkpoint_area_id = c.checkpoint_area_id
      INNER JOIN checkpoint_category cc
        ON cc.checkpoint_category_id = c.checkpoint_category_id
      WHERE txc.inspection_template_id = ?
      ORDER BY txc.sort_order
    `, [inspection_template_id]);

    for (const cp of checkpoints.rows) {

      await runQuery(`
        INSERT INTO inspection_item
        (
          inspection_id,
          checkpoint_id,
          checkpoint_description,
          checkpoint_category,
          checkpoint_area,
          required,
          sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        inspectionId,
        cp.checkpoint_id,
        cp.description,
        cp.category_name,
        cp.area_name,
        cp.required,
        cp.sort_order
      ]);
    }

    res.status(201).json({
      inspection_id: inspectionId
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/*************************************************************
 * UPDATE INSPECTION ITEM RESULT
 *************************************************************/

router.put('/inspection-items/:id', async (req, res) => {

  try {

    const {
      result,
      remarks
    } = req.body;

    await runQuery(`
      UPDATE inspection_item
      SET
        result = ?,
        remarks = ?
      WHERE inspection_item_id = ?
    `, [
      result,
      remarks,
      req.params.id
    ]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;