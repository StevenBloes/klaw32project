import { runQuery } from "../lib/db.js";

// mapping for SQL table and columns, along with the expected data type
const updateMap = Object.freeze({
  delivery_no: {
    table: "batch_info",
    column: "sap_delivery",
    idColumn: "production_id",
    type: "string",
  },
  arrival: {
    table: "planning",
    column: "arrival_time",
    idColumn: "idPlanning",
    type: "time",
  },
  departure: {
    table: "planning",
    column: "departure_time",
    idColumn: "idPlanning",
    type: "time",
  },
  production_id: {
    table: "ordered_products",
    column: "production_code",
    idColumn: "id_ordered_product",
    type: "string",
  },
  arrconfirm: {
    table: "planning",
    column: "arrival_confirmation",
    idColumn: "idPlanning",
    type: "number",
  },
  order_time_remark: {
    table: "orders",
    column: "time_remarks",
    idColumn: "order_id",
    type: "string",
  },
});

export const updateField = async ({ type, id, value }) => {
  // Validation
  if (!updateMap.hasOwnProperty(type)) {
    throw new Error("INVALID_TYPE");
  }

  const config = updateMap[type];

  if (!id || isNaN(id)) {
    throw new Error("INVALID_ID");
  }

  if (value === "" || value === undefined) {
    value = null;
  }

  switch (config.type) {
    case "number":
      if (value !== null && isNaN(value)) {
        throw new Error("INVALID_NUMBER");
      }
      break;

    case "time":
      if (value !== null) {
        const digits = value.replace(/\D/g, ""); // keep numbers only

        if (digits.length < 3 || digits.length > 4) {
          throw new Error("INVALID_TIME");
        }

        let h, m;

        if (digits.length === 3) {
          h = digits.slice(0, 1);
          m = digits.slice(1);
        } else {
          h = digits.slice(0, 2);
          m = digits.slice(2);
        }

        if (h > 23 || m > 59) {
          throw new Error("INVALID_TIME");
        }

        value = `${h.padStart(2, "0")}:${m}`;
      }
      break;

    case "string":
      if (value !== null && typeof value !== "string") {
        throw new Error("INVALID_STRING");
      }
      break;
  }

  if (typeof value === "string" && value.length > 255) {
    throw new Error("VALUE_TOO_LONG");
  }

  // Execute the query in MariaDB
  const query = `
    UPDATE \`${config.table}\`
    SET \`${config.column}\` = ?
    WHERE \`${config.idColumn}\` = ?
  `;

  const result = await runQuery(query, [value, id]);

  return {
    affectedRows: result.affectedRows,
    value,
  };
};
