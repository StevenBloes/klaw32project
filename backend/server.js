import express from "express";
import * as mariadb from "mariadb";
import cors from "cors";
import https from "https";
import fs from "fs";
import { generate_rhp_prescription } from "./services/generate_pdf_reports.js";
import { runQuery } from "./lib/db.js";
import { writeLog } from "./lib/logger.js";

import editRoutes from "./routes/editRoutes.js";
import safetyRoutes from "./routes/safetyRoutes.js"



const app = express();
app.use(express.json());

// for production only
app.use(cors());

// routes
app.use(editRoutes);
app.use("/safety", safetyRoutes);

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
};

app.get("/production_sheet", async (req, res) => {
  const id = req.query.id;

  const query = `
    SELECT
      info.production_id,
      info.customer_name,
      info.time_start,
      info.time_end,
      info.density,
      info.volume_done,
      info.en_done,
      info.weight_requested,
      info.weight_done,
      info.sap_delivery,
      info.comments,
      info.recipe_code,
      info.recipe_name,
      dosing.product_code,
      dosing.dosing_unit,
      dosing.dosing_preset,
      dosing.dosing_done,
      dosing.total_done,
      prod.product_name,
      prod.product_group,
      op.amount AS 'volume_requested',
      orders.customer,
      orders.order_reference,
      sap.sap_code,
      lab.measured_ph,
      lab.measured_ec,
      plan.transport,
      plan.expected_time,
      plan.expected_time_var,
      SUBTIME(plan.expected_time, plan.arrival_time) AS 'time_diff_arr',
      plan.arrival_time,
      SUBTIME(plan.departure_time, plan.arrival_time) AS 'time_diff_dep',
      plan.departure_time
    FROM
      batch_info AS info
    LEFT JOIN batch_dosing AS dosing ON dosing.production_id = info.production_id
    LEFT JOIN products AS prod ON prod.code_mixpro = dosing.product_code
    LEFT JOIN ordered_product_production AS pkey ON pkey.production_id = info.production_id
    LEFT JOIN ordered_products AS op ON op.id_ordered_product = pkey.ordered_product_id
    LEFT JOIN orders AS orders ON orders.order_id = op.order_id
    LEFT JOIN planning AS plan ON plan.idPlanning = orders.transport_id
    LEFT JOIN sap_recipes_codes AS sap ON sap.mixpro_code = info.recipe_code
    LEFT JOIN lab_results AS lab ON lab.production_id = info.production_id
    WHERE info.production_id = ? ;
  `;

  if (!id) {
    return res.status(400).json({ error: "Invalid input, id is missing"});
  }

  try {
    const response = await runQuery(query, [id]);
    res.json(response.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
})

app.get("/planning", async (req, res) => {
  let date = req.query.date; // read date from URL

  if (!date) {
    const today = new Date();
    date = today.toISOString().split("T")[0];
  }
  const query = `
    SELECT
      p.idPlanning,
      p.expected_time,
      p.transport,
      p.remarks,
      p.arrival_time,
      p.departure_time,
      p.link_spriet,
      p.expected_time_var,
      p.arrival_confirmation,
      o.order_id,
      o.order_reference,
      o.customer,
      o.remarks AS location,
      o.time_remarks,
      op.id_ordered_product,
      op.line,
      op.mixpro_code,
      op.amount,
      op.remarks AS op_remarks,
      op.production_code,
      d.density,
      c.sap_code
    FROM
      planning AS p
    INNER JOIN
      orders AS o ON o.transport_id = p.idPlanning
    INNER JOIN
      ordered_products AS op ON o.order_id = op.order_id
    LEFT JOIN
      (SELECT
        ROUND(AVG(density)) AS density,
        recipe_code
      FROM
        batch_info
      WHERE
        density > 0
      GROUP BY
        recipe_code) AS d ON op.mixpro_code = d.recipe_code
    LEFT JOIN
      sap_recipes_codes AS c ON op.mixpro_code = c.mixpro_code
    WHERE
      isplanned = 1 AND p.expected_date = ?
    ORDER BY
      ISNULL(p.link_spriet) ASC,
      p.link_spriet,
      p.transport NOT LIKE 'Braecke KW',
      p.transport NOT LIKE 'Debouvere',
      p.transport NOT LIKE 'Transdika',
      p.transport NOT LIKE 'Slabbinck C+R',
      p.transport NOT LIKE 'Slabbinck',
      p.transport NOT LIKE 'Terryn',
      p.transport NOT LIKE 'Johan',
      p.transport,
      ISNULL(p.expected_time),
      p.expected_time,
      p.idPlanning,
      op.id_ordered_product`;
  try {
    const response = await runQuery(query, [date]);
    res.json(response.rows);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/edit_delivery_comment/:id", async (req, res) => {
  const id = req.params.id;
  const new_value = req.body.new_value;

  if (!id || isNaN(new_value)){
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    await runQuery(
      " ? ? ;",
      [new_value, id]
    );
    res.json({ new_value: new_value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/edit_delivery_no/:id", async (req, res) => {
  const id = req.params.id;
  const value = req.body.value;

  if (!id || !isValidString(value)){
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const response = await runQuery(
      "UPDATE batch_info SET sap_delivery = ? WHERE production_id = ? ;",
      [value, id]
    );
    res.json({
      success: true,
      affectedRows: response.affectedRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/arrconfirm/:id", async (req, res) => {
  const id = req.params.id;
  const new_value = req.body.new_value;

  if (!id || isNaN(new_value)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    await runQuery(
      "UPDATE planning SET arrival_confirmation = ? WHERE idPlanning = ? ;",
      [new_value, id]
    );
    res.json({ new_value: new_value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/edit_prod/:id", async (req, res) => {
  const id = req.params.id;
  let new_value = req.body.new_value;

  if(!new_value || String(new_value).trim() === ""){
    new_value = null;
  }

  try {
    await runQuery("UPDATE ordered_products SET production_code = ? WHERE id_ordered_product = ? ",
      [new_value, id]
    );
    res.json({ new_value: new_value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" })
  }
})

app.post("/edit_arr/:id", async (req, res) => {
  const id = req.params.id;
  let new_value = req.body.new_value;

  if(!new_value || String(new_value).trim() === ""){
    new_value = null;
  }

  try {
    await runQuery(
      "UPDATE planning SET arrival_time = ? WHERE idPlanning = ? ",
      [new_value, id]
    );
    res.json({ new_value: new_value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" })
  }
});

app.post("/edit_dep/:id", async (req, res) => {
  const id = req.params.id;
  let new_value = req.body.new_value;

  if(!new_value || String(new_value).trim() === ""){
    new_value = null;
  }

  try {
    await runQuery(
      "UPDATE planning SET departure_time = ? WHERE idPlanning = ? ",
      [new_value, id]
    );
    res.json({ new_value: new_value });
  } catch (err) {
    res.status(500).json({ error: "Database error" })
  }
});

app.post("/generate_rhp_prescription", async (req, res) => {
  const isDownload = req.body.download;
  const shouldDownload = isDownload === "true";
  const recipe = req.body.rec;
  const pdfBuffer = await generate_rhp_prescription(recipe);

  res.setHeader("Content-Type", "application/pdf");
  if ( shouldDownload) {
    res.setHeader("Content-Disposition", `attachment; filename=rhp_prescription_${recipe}.pdf`);
  } else {
    res.setHeader("Content-Disposition", `inline; filename=rhp_prescription_${recipe}_preview.pdf`);
  }
  res.send(pdfBuffer);
});

app.get("/get_recipe_codes", async (req, res) => {
  const query = "SELECT DISTINCT sap_code FROM sap_recipes_codes INNER JOIN batch_info ON recipe_code = mixpro_code WHERE sap_code IS NOT NULL AND recipe_name IS NOT NULL;"

  try {
    const response = await runQuery(query);
    res.json(response.rows);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
});


const server = app.listen(3000, () => {
   console.log("API running on port 3000");
   writeLog({"type": "startup", "message": "Server/API running on port 3000"}, 'server_logs');
});

app.get("/planning_history/:interval", async (req, res) => {
  const interval = req.params.interval;
  const interval_array = [
    "AND p.expected_date >= DATE_SUB(DATE_FORMAT(now(), '%Y-%m-01'), INTERVAL 3 MONTH)",
    "AND YEAR(p.expected_date) >= YEAR(now()) - 1",
    "AND YEAR(p.expected_date) >= YEAR(now()) - 2",
    "AND YEAR(p.expected_date) >= YEAR(now()) - 3",
    ""];

  if (!interval){
    return res.status(400).json({ error: "Invalid input, is not defined" });
  }

  if (isNaN(interval)){
    return res.status(400).json({ error: "Invalid input, not a number" });
  }

  if(Number.isInteger(interval)){
    return res.status(400).json({ error: "Invalid input, an integer" });
  }

  if(interval > 4 || interval < 0){
    return res.status(400).json({ error: "Invalid input, should be 0, 1, 2, 3 or 4" });
  }

  const query = `
    SELECT
      date_format(p.expected_date, '%Y-%m-%d') AS 'expected_date',
      p.transport,
      date_format(p.arrival_time, '%H:%i') AS 'arrival_time',
      date_format(p.departure_time, '%H:%i') AS 'departure_time',
      o.order_reference,
      o.customer,
      op.mixpro_code,
      op.production_code,
      op.amount AS 'ordered_volume',
      bi.en_done AS 'delivered_volume',
      bi.recipe_name,
      bi.sap_delivery,
      c.sap_code
    FROM planning AS p
    LEFT JOIN orders AS o ON p.idPlanning = o.transport_id
    LEFT JOIN ordered_products AS op ON op.order_id = o.order_id
    LEFT JOIN batch_info AS bi ON op.production_code = bi.production_id
    LEFT JOIN sap_recipes_codes AS c ON op.mixpro_code = c.mixpro_code
    WHERE
      p.departure_time IS NOT NULL
      AND p.expected_date < '${new Date().toJSON().slice(0, 10)}'
      ${interval_array[interval]}
    ORDER BY
      p.expected_date DESC,
      p.departure_time ASC;`;

  try {
    const response = await runQuery(query);
    res.json(response.rows);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
});

/*
const server = https.createServer(options, app).listen(3000, () => {
   console.log("API running on port 3000");
   writeLog({"type": "startup", "message": "Server/API running on port 3000"}, 'server_logs');
});
*/

server.on("error", (err) => {
  console.log(err.message);
  writeLog({"type": "error", "message": err.message, "stack": err.stack}, 'server_logs');
});
