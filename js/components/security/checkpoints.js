export const title = "KLA W32 - Checkpoints";

import { callApi } from "../../services/apiCalls.js";

const VIEWMODE = 0;
const CREATEMODE = 1;
const EDITMODE = 2;

let MODE = VIEWMODE;
let loadedTemplateId;

let checkpointData = [];
let templateData = [];

const maps = {
  checkbox: {
    0: { text: "\u2610", css: ["result-nok", "numeric-column"] },
    1: { text: "\u2611", css: ["result-ok", "numeric-column"] }
  }
};

const template_tbl_cols = [
  { field: "name" },
  { field: "checkpoint_count", cellcss: ["numeric-column"] },
  {
    field: "active", map: "checkbox", onclick: (row) => {
      row.active = row.active ? 0 : 1;
      renderTemplateTable();
    }
  }
];

const checkpoint_tbl_cols = [
  { field: "security_level" },
  { field: "description" },
  { field: "category" },
  { field: "area" },
  {
    field: "active", cellcss: ["numeric-column"], map: "checkbox", onclick: (row) => {
      row.active = row.active ? 0 : 1;
      renderCheckPointTable();
    }
  }
];

const frequencyTypes = [
  {
    frequency_type_id: 1,
    value: "NONE",
    description: "Geen"
  }, {
    frequency_type_id: 2,
    value: "DAY",
    description: "Dagen"
  }, {
    frequency_type_id: 3,
    value: "WEEK",
    description: "Weken"
  }, {
    frequency_type_id: 4,
    value: "MONTH",
    description: "Maanden"
  }
];

async function loadData(root) {
  templateData = await callApi("getTemplates");
  console.log(templateData);
  renderTemplateTable();

  checkpointData = await callApi("getCheckpoints");
  console.log(checkpointData);
  renderCheckPointTable();


}

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

function renderTemplateTable() {
  const templateTable = document.querySelector("#template-tbl");
  templateTable.innerHTML = "";

  templateData.forEach(item => {
    const row = document.createElement("tr");

    template_tbl_cols.forEach(column => {
      row.appendChild(createTableCell(item, column));
    })

    templateTable.appendChild(row);
  });
}

async function loadDetail() {

}

function clearForm() {

}

function changeMode(mode) {
  MODE = mode;

  const inputForm = document.querySelector("#input-form");

  inputForm.classList.toggle("edit-mode", (MODE === EDITMODE || MODE === CREATEMODE));
  inputForm.classList.toggle("view-mode", MODE === VIEWMODE);

  inputForm.querySelectorAll("input, textarea").forEach(el => el.readOnly = (MODE === VIEWMODE));
  document.querySelector("#cancel-btn").disabled = (MODE === VIEWMODE);
  inputForm.querySelector("#save-btn").disabled = (MODE === VIEWMODE);
  inputForm.querySelector("#edit-btn").disabled = (MODE === CREATEMODE || MODE === EDITMODE || (MODE === VIEWMODE && !loadedTemplateId));
  document.querySelector("#new-template-btn").disabled = (MODE === CREATEMODE || MODE === EDITMODE);

  renderCheckPointTable();
}

async function renderCheckpointInput() {
  const modal = document.querySelector("#modal-root");
  modal.classList.toggle("hidden");

  const modalContent = document.querySelector("#modal-content");

  modalContent.innerHTML = `
    <div>
      <h2 style="margin: 0em;">Nieuw Checkpunt</h2>
      <div style="margin: 0.5em; margin-bottom: 1em;">
        <div class="modal-input-field">
          <label>Naam</label>
          <input id="modal-description-fld" type="text" />
        </div>
        <div class="modal-input-field">
          <label>Categorie</label>
          <input id="modal-category-fld" type="text" />
        </div>
        <div class="modal-input-field">
          <label>Locatie</label>
          <input id="modal-area-fld" type="text" />
        </div>
        <div class="modal-input-field">
          <label>Opmerkingen</label>
          <textarea id="modal-remarks-fld"></textarea>
        </div>
        <div>
          <input id="modal-active-fld" checked type="checkbox" />
          <label for="modal-active-fld">Actief</label>
        </div>
      </div>
      <div style="display: flex; flex-direction: row; justify-content: space-between;">
        <button id="save-modal-btn" class="new-btn">Opslaan</button>
        <button id="cancel-modal-btn" class="cancel-btn">Annuleren</button>
      </div>
    </div>
  `;

  document.querySelector("#save-modal-btn").onclick = async () => {
    const bodyContent = {
      description: document.querySelector("#modal-description-fld").value,
      checkpoint_category_id: document.querySelector("#modal-category-fld").value,
      checkpoint_area_id: document.querySelector("#modal-area-fld").value,
      remarks: document.querySelector("#modal-remarks-fld").value,
      active: document.querySelector("#modal-active-fld").checked
    };

    console.log(bodyContent);
    /*
    const result = await callApi("bulkCreateCheckItems", {
      body: bodyContent
    });
    console.log(result);
*/
   // modalContent.innerHTML = "";
    modal.classList.toggle("hidden");
  };

  document.querySelector("#cancel-modal-btn").onclick = () => {
    modalContent.innerHTML = "";
    modal.classList.toggle("hidden");
  };
}

export function render(id) {
  return `
  <div class="insp-row">
    <div class="insp-col1 v-split">
      <div class="insp-row1">
        <div style="display: flex; justify-content: space-between;">
          <h3 class="work-panel-title">Inspectietypes &nbsp;</h3>
          <button id="new-template-btn" class="new-btn logo-text-btn">+ Nieuw Inspectietype</button>
        </div>
          <br>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Naam</th>
                  <th># Checkpunten</th>
                  <th>Actief</th>
                </tr>
              </thead>
              <tbody id="template-tbl"></tbody>
            </table>
          </div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between;">
            <h3 class="work-panel-title">Checkpunten</h3>
            <button id="new-checkpoint-btn" class="new-btn logo-text-btn">+ Nieuw checkpunt</button>
          </div>
          <br>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Checkpunt</th>
                  <th>Categorie</th>
                  <th>Locatie</th>
                  <th>Actief</th>
                </tr>
              </thead>
              <tbody id="checkpoint-tbl"></tbody>
            </table>
          </div>
        </div>
      </div>
      <div id="input-form" class="view-mode">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <h3 id="detail-title" class="work-panel-title">Inspectietype details</h3>
          <button id="edit-btn" class="action-btn logo-text-btn">&#9998; Bewerken</button>
        </div>
        <div class="input-fields" >
          <div class="field-column">
            <div class="field">
              <label>Naam</label>
              <input type="text" />
            </div>
            <div class="field">
              <label>Omschrijving</label>
              <input type="text" />
            </div>
            <div class="field">
              <label>In automatische planning opnemen</label>
              <input type="checkbox"/>
            </div>
            <div class="field">
              <label>Geplande uitvoeringsfrequentie</label>
              elke<input type="number" min="1" />
              <select>
                <option>Dag</option>
                <option>Week</option>
                <option>Maand</option>
              </select>
            </div>
            <div class="field">
              <label>Startdatum</label>
              <input type="date" />
            </div>
            <div class="field">
              <label>Versie</label>
            </div>
            <div>
              <label>Laatste update</label>
            </div>
          </div>
        </div>
        <h3>Checkpunten</h3>
        <div class="table-container">
          <table>
            <thead>
              <th>SL</th>
              <th>Checkpunt</th>
              <th>Categorie</th>
              <th>Location</th>
              <th>Actief</th>
            </thead>
            <tbody>
              <tr><td>table_content</td><tr>
            </tbody>
          </table>
        </div>
        <div style="margin: 2em 0em; display: flex; justify-content: space-between;">
        <div>
          <button id="save-btn" class="action-btn logo-text-btn">&#128190; Opslaan</button>
          <button id="cancel-btn" class="cancel-btn">Annuleren</button>
        </div>
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

  root.querySelector("#new-template-btn").onclick = async () => {
    if (MODE === VIEWMODE) {
      await clearForm(root);
      changeMode(CREATEMODE);
    }
  };

  root.querySelector("#new-checkpoint-btn").onclick = async () => {
    await renderCheckpointInput();
  };

  root.querySelector("#save-btn").onclick = async () => {
    await saveData(root);
  };

  root.querySelector("#cancel-btn").onclick = async () => {
    changeMode(VIEWMODE);
    if (loadedTemplateId) {
      await loadDetail(root, loadedTemplateId);
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