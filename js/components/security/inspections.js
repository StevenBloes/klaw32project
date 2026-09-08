export const title = "KLA W32 - Inspecties";

import { callApi } from "../../services/apiCalls.js";

const VIEWMODE = 0;
const CREATEMODE = 1;
const EDITMODE = 2;

let MODE = VIEWMODE;
let loadedInspectionId;
let checkDetailData = [];
let checkpointData = [];
let deviationData = [];

const formatId = (prefix, value) => `${prefix}_${String(value).padStart(3, "0")}`;
const formatDate = (value) => `${(new Date(value)).toLocaleDateString("nl-BE")}`;
const formatDateInput = (value) => new Date(value);
const formatTime = (value) => `${`${String(value).split(":")[0]}:${String(value).split(":")[1]}`}`;


const maps = {
  securityLevel: {
    1: { text: "Niveau 1", css: "security-level-1" },
    2: { text: "Niveau 2", css: "security-level-2" },
    3: { text: "Niveau 3", css: "security-level-3" },
  },
  inspectionStatus: {
    PLANNED: { text: "Gepland", css: ["status-open"] },
    IN_PROGRESS: { text: "In behandeling", css: ["status-progress"] },
    COMPLETED: { text: "Afgerond", css: ["status-closed"] },
    OVERDUE: { text: "Over tijd", css: ["status-overdue"] },
    CANCELLED: { text: "Afgelast", css: ["status-cancelled"] }
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
    1: { text: "NOK", css: ["result-nok", "numeric-column"] },
    2: { text: "OK", css: ["result-ok", "numeric-column"] },
    3: { text: "?", css:["result-pending", "numeric-column"]},
    4: { text: "Afgelast", css:["result-cancelled", "numeric-column"]},
    5: { text: "?", css:["result-pending", "numeric-column"]}
  },
  deviationCount: {
    0: { css: ["result-ok", "numeric-column"] },
    default: { css: ["result-nok", "numeric-column"] }
  }
}

const checks_tbl_cols = [
  { field: "inspection_id", formatter: value => formatId("INS", value) },
  { field: "security_level", cellcss: "numeric-column" },
  { field: "completed_at", formatter: value => value ? formatDate(value) : "-" },
  { field: "template_name" },
 // { field: "area" },
  { field: "completed_by", formatter: value => value ? value : "-" },
  { field: "checkpoint_count", cellcss: "numeric-column", default: 0 },
  { field: "deviation_count", map: "deviationCount", default: 0 },
  { field: "status", map: "inspectionStatus", pillow: true }
];

const checkpoint_tbl_cols = [
  { field: "checkpoint_id", cellcss: "numeric-column" },
  { field: "security_level", cellcss: "numeric-column", default: "1" },
  { field: "checkpoint_description" },
  {
    field: "result", map: "checkResult", default: "3", onclick: (row) => {
      if (MODE === CREATEMODE || MODE === EDITMODE) {
        row.result = row.result ? 0 : 1;
        renderCheckPointTable();
      }
    }
  },
  { field: "remarks", default: "-", editable: true }
];

const deviation_tbl_cols = [
  { field: "deviation_id", title: "ID", formatter: value => formatId("AFW", value) },
  { field: "description", title: "Omschrijving" },
  { field: "severity", title: "Risico", map: "severity", pillow: true },
  { field: "status", title: "Status", map: "deviationStatus", pillow: true }
];

function createTableCell(rowData, column) {

  const cell = document.createElement("td");

  if (column.editable && MODE !== VIEWMODE) {
    cell.contentEditable = true;

    cell.addEventListener("focusin", (e) => {
      cell.dataset.originalValue = cell.textContent;
    });

    cell.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        cell.textContent = cell.dataset.originalValue ?? "";
        cell.blur();
      }
    });

    cell.addEventListener("blur", (e) => {
      rowData[column.field] = cell.textContent;
    });
  }


  if (column.cellcss) {
    cell.classList.add(...column.cellcss);
  }

  if (column.onclick) {
    cell.onclick = () => column.onclick(rowData);
  }

  let value = rowData[column.field] ?? column.default;

  if (column.formatter) {
    value = column.formatter(value);
  }

  if (column.map) {
    try {
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
    } catch (e) {
      console.log(e.message);
      console.log(column);
      console.log(value);
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
    const checksList = await callApi("getInspectionList");

    // insert records rows in inspection table
    checksList.forEach(item => {
      const row = document.createElement("tr");
      row.id = "INS_" + item.inspection_id;
      row.onclick = async () => {
        await loadDetail(root, item.inspection_id);
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
    checkDetailData = await callApi("getInspection", { params: id });

    console.log(checkDetailData);

    const inspectionData = checkDetailData.inspection;
    checkpointData = checkDetailData.items;
    deviationData = checkDetailData.deviations;

    // insert the fields
    root.querySelector("#detail-title").textContent = `${formatId("INS", id)} - Inspectie Rapport`;
    root.querySelector("#detail-id").value = `${formatId("INS", id)}`;
    root.querySelector("#detail-type").value = inspectionData.template_name;
    root.querySelector("#detail-date").valueAsDate = formatDateInput(inspectionData.completed_at);
    root.querySelector("#detail-time").value = `${formatTime(inspectionData.completed_at)}`;
    root.querySelector("#detail-location").value = "-";
    root.querySelector("#detail-executed-by").value = inspectionData.completed_by;
    root.querySelector("#detail-function").value = "-";
    root.querySelector("#detail-security-level").value = "1";
    root.querySelector("#detail-remarks").value = inspectionData.remarks;

    // update the table for checkpoints
    renderCheckPointTable();
    
    if(deviationData){
      // update the deviations counter
      root.querySelector("#deviationCounter").textContent = deviationData.length;

      // update the table for deviations
      renderDeviationTable();
    }

    loadedInspectionId = id;
    document.querySelector("#edit-btn").disabled = (MODE === CREATEMODE || MODE === EDITMODE || (MODE === VIEWMODE && loadedInspectionId === null));

  } catch (e) {
    console.log(e);
  }
}

function renderCheckPointTable() {
  const checkpointTable = document.querySelector("#checkpoint-tbl");
  checkpointTable.innerHTML = "";

  checkpointData.forEach(item => {
    const row = document.createElement("tr");

    checkpoint_tbl_cols.forEach(column => {
      row.appendChild(createTableCell(item, column));
    })

    checkpointTable.appendChild(row);
  });
}

function renderDeviationTable() {
  if(!deviationTable){
    return;
  }
  const deviationTable = document.querySelector("#deviation-tbl");
  deviationTable.innerHTML = "";

  deviationData.forEach(deviation => {
    const row = document.createElement("tr");

    deviation_tbl_cols.forEach(column => {
      row.appendChild(createTableCell(deviation, column));
    });

    deviationTable.appendChild(row);
  });
}

async function clearForm(root) {
  loadedInspectionId = null;

  root.querySelector("#detail-title").textContent = `Inspectie Rapport`;
  root.querySelector("#detail-id").value = "";
  root.querySelector("#detail-type").value = "";
  root.querySelector("#detail-date").valueAsDate = new Date();
  root.querySelector("#detail-time").value = `${(new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  root.querySelector("#detail-location").value = "";
  root.querySelector("#detail-executed-by").value = "";
  root.querySelector("#detail-function").value = "";
  root.querySelector("#detail-security-level").value = "";
  root.querySelector("#detail-remarks").value = "";

  checkpointData = await callApi("getCheckpoints");

  checkpointData.forEach(checkpoint => {
    checkpoint_tbl_cols.forEach(column => {
      const cell = createTableCell(checkpoint, column);

      if (!checkpoint[column.field]) {
        // check if cell content exist in map (sometimes it's rendered as something different)
        if (column.map) {
          if (column.map[cell.textContent]) {
            checkpoint[column.field] = cell.textContent;
          } else {
            checkpoint[column.field] = column.default;
          }
        } else {
          checkpoint[column.field] = cell.textContent;
        }
      }
    });
  });

  renderCheckPointTable();

  // clear the table for deviations
  const deviationTable = root.querySelector("#deviation-tbl");
  deviationTable.innerHTML = "";
}

async function saveData(root) {
  const bodyContent = {
    inspection_date: root.querySelector("#detail-date").value,
    inspection_time: root.querySelector("#detail-time").value,
    type: root.querySelector("#detail-type").value,
    area: root.querySelector("#detail-location").value,
    performed_by: root.querySelector("#detail-executed-by").value,
    security_level: root.querySelector("#detail-security-level").value,
    remarks: root.querySelector("#detail-remarks").value
  };

  if (MODE === CREATEMODE) {
    const result = await callApi("createCheck", {
      body: bodyContent
    });
    console.log(result);
    if (result.success) {
      checkpointData.forEach(element => {
        element["check_id"] = result.check_id;
      });
      const result2 = await callApi("bulkCreateCheckItems", {
        body: { items: checkpointData }
      });
      console.log(result2);
    }
  } else if (MODE === EDITMODE) {
    const result = await callApi("updateCheck", {
      params: loadedInspectionId,
      body: bodyContent
    });
    console.log(result);
    if (result.success) {
      const result2 = await callApi("bulkUpdateCheckItems", {
        body: { items: checkpointData }
      });
      console.log(result2);
    }
  }

  loadData(root);
  changeMode(VIEWMODE);
}

function changeMode(mode) {
  MODE = mode;

  const inputForm = document.querySelector("#input-form");

  inputForm.classList.toggle("edit-mode", (MODE === EDITMODE || MODE === CREATEMODE));
  inputForm.classList.toggle("view-mode", MODE === VIEWMODE);

  inputForm.querySelectorAll("input, textarea").forEach(el => el.readOnly = (MODE === VIEWMODE));
  document.querySelector("#cancel-btn").disabled = (MODE === VIEWMODE);
  inputForm.querySelector("#save-btn").disabled = (MODE === VIEWMODE);
  inputForm.querySelector("#new-deviation-btn").disabled = (MODE === VIEWMODE);
  inputForm.querySelector("#edit-btn").disabled = (MODE === CREATEMODE || MODE === EDITMODE || (MODE === VIEWMODE && !loadedInspectionId));
  document.querySelector("#new-inspection-btn").disabled = (MODE === CREATEMODE || MODE === EDITMODE);

  renderCheckPointTable();
}

export function render(id) {
  return `
    <div class="insp-row">
    <div class="insp-col1">
    <div style="display: flex; justify-content: space-between;">
      <h3 class="work-panel-title">Uitgevoerde Inspecties</h3>
      <button id="new-inspection-btn" class="new-btn logo-text-btn">+ Nieuwe Inspectie</button>
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
          <th>Uitgevoerd door</th>
          <th class="numeric-column">#Checkpunten</th>
          <th class="numeric-column">#Afwijkingen</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="inspection_tbl">
      </tbody>
    </table>
    </div>
    </div>
    <div id="input-form" class="view-mode">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h3 id="detail-title" class="work-panel-title">Inspectie Rapport</h3>
        <button id="edit-btn" class="action-btn logo-text-btn">&#9998; Bewerken</button>
      </div>
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
            <input type="date" id="detail-date" required/>
          </div>
          <div class="field">
            <label>Tijdstip</label>
            <input type="time" id="detail-time"/>
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
          <button id="save-btn" class="action-btn logo-text-btn">&#128190; Opslaan</button>
          <button id="cancel-btn" class="cancel-btn">Annuleren</button>
        </div>
        <button id="new-deviation-btn" class="new-btn logo-text-btn">+ Nieuwe Afwijking</button>
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

  root.querySelector("#new-inspection-btn").onclick = async () => {
    if (MODE === VIEWMODE) {
      await clearForm(root);
      changeMode(CREATEMODE);
    }
  };

  root.querySelector("#save-btn").onclick = async () => {
    await saveData(root);
  };

  root.querySelector("#cancel-btn").onclick = async () => {
    changeMode(VIEWMODE);
    if(loadedInspectionId){
      await loadDetail(root, loadedInspectionId);
    } else {
      await clearForm(root);
    }
  };

  root.querySelector("#edit-btn").onclick = async () => {
    changeMode(EDITMODE);
  };

  clearForm(root);
  changeMode(VIEWMODE);
}

export function destroy() {

}
