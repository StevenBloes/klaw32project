export const title = "KLA W32 - Inspecties";

import { callApi } from "../../services/apiCalls.js";

const VIEWMODE = 0;
const CREATEMODE = 1;
const EDITMODE = 2;

let MODE = VIEWMODE;
let loadedInspectionId;
let checkDetailData;

const formatId = (prefix, value) => `${prefix}_${String(value).padStart(3, "0")}`;
const formatDate = (value) => `${(new Date(value)).toLocaleDateString("nl-BE")}`;


const maps = {
  securityLevel: {
    1: { text: "Niveau 1", css: "security-level-1" },
    2: { text: "Niveau 2", css: "security-level-2" },
    3: { text: "Niveau 3", css: "security-level-3" },
  },
  checkStatus: {
    PLANNED: { text: "Open", css: ["status-open"] },
    IN_PROGRESS: { text: "In behandeling", css: ["status-progress"] },
    DONE: { text: "Afgerond", css: ["status-closed"] },
  },
  deviationStatus: {
    OPEN: { text: "Open", css: ["status-open"] },
    ACTION_ASSIGNED: { text: "In behandeling", css: ["status-progress"] },
    AWAITING_VERIFICATION: { text: "In behandeling", css: ["status-verify"] },
    CLOSED: { text: "Afgesloten", css: ["status-closed"] }
  },
  severity: {
    LOW: { text: "Laag", css: ["severity-low"] },
    MEDIUM: { text: "Medium", css: ["severity-medium"] },
    HIGH: { text: "Hoog", css: ["severity-high"] }
  },
  checkResult: {
    0: { text: "NOK", css: ["result-nok", "numeric-column"] },
    1: { text: "OK", css: ["result-ok", "numeric-column"] }
  },
  deviationCount: {
    0: { css: ["result-ok", "numeric-column"] },
    default: { css: ["result-nok", "numeric-column"] }
  }
}

const checks_tbl_cols = [
  { field: "check_id", formatter: value => formatId("INS", value) },
  { field: "security_level", cellcss: "numeric-column" },
  { field: "inspection_date", formatter: value => formatDate(value) },
  { field: "type" },
  { field: "area" },
  { field: "performed_by" },
  { field: "deviation_count", map: "deviationCount" },
  { field: "check_status_value", map: "checkStatus", pillow: true }
];

const checkpoint_tbl_cols = [
  { field: "checkpoint_id", cellcss: "numeric-column" },
  { field: "security_level", cellcss: "numeric-column" },
  { field: "checkpoint_description" },
  { field: "result", map: "checkResult" },
  { field: "remarks" }
];

const deviation_tbl_cols = [
  { field: "deviation_id", title: "ID", formatter: value => formatId("AFW", value) },
  { field: "description", title: "Omschrijving" },
  { field: "severity", title: "Risico", map: "severity", pillow: true },
  { field: "status", title: "Status", map: "deviationStatus", pillow: true }
];

function createTableCell(rowData, column) {
  const cell = document.createElement("td");

  if (column.cellcss) {
    cell.classList.add(...column.cellcss);
  }

  let value = rowData[column.field];
  if (column.formatter) {
    value = column.formatter(value);
  }

  if (column.map) {
    const mapItem = maps[column.map][value] ?? maps[column.map]["default"];

    if (column.pillow) {
      const span = document.createElement("span");

      if (mapItem.css) {
        span.classList.add(...mapItem.css);
      }

      if (mapItem.text) {
        span.textContent = mapItem.text;
      } else {
        span.textContent = value;
      }

      cell.appendChild(span);
    } else {
      if (mapItem.css) {
        cell.classList.add(...mapItem.css);
      }

      if (mapItem.text) {
        cell.textContent = mapItem.text;
      } else {
        cell.textContent = value;
      }
    }
  } else {
    cell.textContent = value;
  }

  return cell;
}

async function loadData(root) {
  // create inspection table
  const table = root.querySelector("#inspection_tbl");
  table.innerHTML = "";

  try {
    // fetch the records data
    const checksList = await callApi("getChecksOverview");

    // insert records rows in inspection table
    checksList.forEach(item => {
      const row = document.createElement("tr");
      row.id = "INS_" + item.check_id;
      row.onclick = async () => {
        await loadDetail(root, item.check_id);
      };

      checks_tbl_cols.forEach(column => {
        row.appendChild(createTableCell(item, column));
      });

      table.appendChild(row);
    });
  } catch (e) {
    console.log(e);
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = checks_tbl_cols.length;
    cell.textContent = e;
    row.appendChild(cell);
    table.appendChild(row);
  }

}

async function loadDetail(root, id) {
  // only load detail data if the user is viewing data
  if (MODE !== VIEWMODE) {
    return;
  }

  try {
    // fetch inspection data
    checkDetailData = await callApi("getFullCheck", { params: id });

    // insert the fields
    root.querySelector("#detail-title").textContent = `${formatId("INS", id)} - Inspectie Rapport`;
    root.querySelector("#detail-id").value = `${formatId("INS", id)}`;
    root.querySelector("#detail-type").value = checkDetailData.check.type;
    root.querySelector("#detail-date").value = formatDate(checkDetailData.check.inspection_date);
    root.querySelector("#detail-time").value = checkDetailData.check.inspection_time;
    root.querySelector("#detail-location").value = checkDetailData.check.area;
    root.querySelector("#detail-executed-by").value = checkDetailData.check.performed_by;
    root.querySelector("#detail-function").value = "-";
    root.querySelector("#detail-security-level").value = checkDetailData.check.security_level;
    root.querySelector("#detail-remarks").value = checkDetailData.check.remarks;

    // update the table for checkpoints
    const checkpointTable = root.querySelector("#checkpoint-tbl");
    checkpointTable.innerHTML = "";

    checkDetailData.items.forEach(item => {
      const row = document.createElement("tr");

      checkpoint_tbl_cols.forEach(column => {
        row.appendChild(createTableCell(item, column));
      })

      checkpointTable.appendChild(row);
    });

    // update the deviations counter
    root.querySelector("#deviationCounter").textContent = checkDetailData.deviations.length;

    // update the table for deviations
    const deviationTable = root.querySelector("#deviation-tbl");
    deviationTable.innerHTML = "";

    checkDetailData.deviations.forEach(deviation => {
      const row = document.createElement("tr");

      deviation_tbl_cols.forEach(column => {
        row.appendChild(createTableCell(deviation, column));
      });

      deviationTable.appendChild(row);
    });

    loadedInspectionId = id;

  } catch (e) {
    console.log(e);
  }
}

async function saveData(root) {
  if (MODE === CREATEMODE) {
    const result = await callApi("createCheck", {
      body: {
        inspection_date: root.querySelector("#detail-date").value,
        inspection_time: root.querySelector("#detail-time").value,
        type: root.querySelector("#detail-type").value,
        area: root.querySelector("#detail-location").value,
        performed_by: root.querySelector("#detail-executed-by").value,
        security_level: root.querySelector("#detail-security-level").value,
        remarks: root.querySelector("#detail-remarks").value
      }
    });
    console.log(result);

    loadData(root);
  }

  changeMode(VIEWMODE);
}

function changeMode(mode) {
  MODE = mode;

  const inputForm = document.querySelector("#input-form");

  inputForm.classList.toggle("edit-mode", (MODE === EDITMODE || MODE === CREATEMODE));
  inputForm.classList.toggle("view-mode", MODE === VIEWMODE);

  inputForm.querySelectorAll("input, textarea").forEach(el => el.readOnly = (MODE === VIEWMODE));
  inputForm.querySelector("#save-btn").disabled = (MODE === VIEWMODE);
  document.querySelector("#new-inspection-btn").disabled = (MODE === CREATEMODE || MODE === EDITMODE);
}

export function render(id) {
  return `
    <div class="insp-row">
    <div class="insp-col1">
    <div style="display: flex; justify-content: space-between;">
      <h3 class="work-panel-title">Uitgevoerde Inspecties</h3>
      <button id="new-inspection-btn" class="new-btn">+ Nieuwe Inspectie</button>
    </div>
    <div>filters</div>
    <div class="table-container">
    <table id="inspection-tbl">
      <thead>
        <tr>
          <th>ID</th>
          <th class="numeric-column">SL</th>
          <th>Datum</th>
          <th>Type</th>
          <th>Plaats</th>
          <th>Uitgevoerd door</th>
          <th class="numeric-column">Afwijkingen</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="inspection_tbl">
      </tbody>
    </table>
    </div>
    </div>
    <div id="input-form" class="view-mode">
      <h3 id="detail-title" class="work-panel-title">Inspectie Rapport</h3>
      <div class="input-fields">
        <div class="field-column">
          <div class="field">
            <label>Inspectie ID</label>
            <input id="detail-id"/>
          </div>
          <div class="field">
            <label>Type</label>
            <input id="detail-type"/>
          </div>
          <div class="field">
            <label>Datum</label>
            <input id="detail-date"/>
          </div>
          <div class="field">
            <label>Tijdstip</label>
            <input id="detail-time"/>
          </div>
        </div>
        <div class="field-column">
          <div class="field">
            <label>Locatie</label>
            <input id="detail-location"/>
          </div>
          <div class="field">
            <label>Uitgevoerd door</label>
            <input id="detail-executed-by"/>
          </div>
          <div class="field">
            <label>Functie</label>
            <input id="detail-function"/>
          </div>
          <div class="field">
            <label>Security Level</label>
            <input id="detail-security-level"/>
          </div>
        </div>
      </div>
      <div style="width: 100%">
        <label style="vertical-align: top;">Opmerkingen</label>
        <textarea id="detail-remarks"></textarea>
      </div>
      <h4>Checkpoints</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th class="numeric-column">SL</th>
              <th>Checkpoint</th>
              <th class="numeric-column">Resultaat</th>
              <th>Opmerking</th>
            </tr>
          </thead>
          <tbody id="checkpoint-tbl"></tbody>
        </table>
      </div>
      <h4>Waargenomen Afwijkingen (<span id="deviationCounter"></span>)</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Omschrijving</th>
              <th>Risico</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="deviation-tbl"></tbody>
        </table>
      </div>
      <div style="margin: 2em 0em; display: flex; justify-content: space-between;">
        <div>
          <button id="save-btn" class="action-btn">Opslaan</button>
        </div>
        <button class="new-btn">+ Nieuwe Afwijking</button>
      </div>
    </div>
    </div>
    
  `;
}

export async function init(root, id) {
  await loadData(root);

  if (id) {
    await loadDetail(root, id);
  }

  const inputForm = root.querySelector("#input-form");
  inputForm.querySelectorAll("input, textarea").forEach(el => el.readOnly = (MODE === VIEWMODE));

  root.querySelector("#new-inspection-btn").onclick = () => {
    if (MODE === VIEWMODE) {
      changeMode(CREATEMODE);
    }
  };

  root.querySelector("#save-btn").onclick = async () => {
    await saveData(root);
  };

  changeMode(VIEWMODE);
}

export function destroy() {

}
