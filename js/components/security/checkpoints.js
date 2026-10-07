export const title = "KLA W32 - Checkpoints";

import { callApi } from "../../services/apiCalls.js";

const VIEWMODE = 0;
const CREATEMODE = 1;
const EDITMODE = 2;

let MODE = VIEWMODE;
let loadedTemplateId;

let checkpointData = [];
let templateData = [];
let referenceData = [];
let templateDetailData = [];
let templateDetailCheckpoints = [];

const formatDate = (value) => `${(new Date(value)).toLocaleDateString("nl-BE")}`;
const formatDateInput = (value) => new Date(value);

let maps = {
  checkbox: {
    0: { text: "\u2610", css: ["unchecked-cell"] },
    1: { text: "\u2611", css: ["checked-cell"] }
  }
};

const template_tbl_cols = [
  { field: "name" },
  { field: "checkpoint_count", cellcss: ["numeric-column"] },
  {
    field: "active", map: "checkbox", onclick: (row) => {
      callApi("updateTemplateActive", { params: row.inspection_template_id, body: { active: row.active ? 0 : 1 } });
      row.active = row.active ? 0 : 1;
      renderTemplateTable();
    }
  }
];

const checkpoint_tbl_cols = [
  { field: "description" },
  { field: "category" },
  { field: "area" },
  {
    field: "active", map: "checkbox", onclick: (row) => {
      callApi("updateCheckpointActive", { params: row.checkpoint_id, body: { active: row.active ? 0 : 1 } });
      row.active = row.active ? 0 : 1;
      renderCheckPointTable();
    }
  },
  {
    field: "", default: "✎", cellcss: ["numeric-column", "edit-pencil"], onclick: (row) => {
      console.log(`Edit Checkpoint: ${row.checkpoint_id} | ${row.description}`);
      renderCheckpointInput(row.checkpoint_id);
    }
  }
];

const template_checkpoint_tbl_cols = [
  { field: "description" },
  { field: "checkpoint_category_id", map: "categories" },
  { field: "checkpoint_area_id", map: "areas" },
  { field: "required", map: "checkbox"}
];

async function loadData() {
  templateData = await callApi("getTemplates");
  //console.log(templateData);
  renderTemplateTable();

  checkpointData = await callApi("getCheckpoints");
  //console.log(checkpointData);
  renderCheckPointTable();

  referenceData = await callApi("getReferenceValues");
  //console.log(referenceData);
  maps = {...maps, 
    categories: Object.fromEntries(new Map(referenceData["categories"].map(category => [category.checkpoint_category_id, { text: category.value }]))),
    areas: Object.fromEntries(new Map(referenceData["areas"].map(area => [area.checkpoint_area_id, { text: area.value }])))
  }
}

async function saveData(root) {

  const bodyContent = {
    name: root.querySelector("#template-name-fld").value,
    description: root.querySelector("#template-desc-fld").value,
    frequency_value: root.querySelector("#frequency-value-fld").value === "" ?
      0 :
      root.querySelector("#frequency-value-fld").value,
    frequency_type_id: root.querySelector("#planned-cb").checked ?
      root.querySelector("#frequency-type-fld").value :
      referenceData["frequencyTypes"].filter(type => (type.value === "NONE"))[0].frequency_type_id,
    anchor_date: root.querySelector("#anchor-date-fld").value === "" ? null : root.querySelector("#anchor-date-fld").value
  };

  if (MODE === CREATEMODE) {
    const result = await callApi("createTemplate", { body: bodyContent });
    console.log(bodyContent);
    console.log(result);
  } else if (MODE === EDITMODE) {
    await callApi("updateTemplate", { params: loadedTemplateId, body: bodyContent });
    const res = await callApi("updateTemplateCheckpoints", {params: loadedTemplateId, body: {checkpoints: templateDetailCheckpoints}});
    console.log(res);
  }

  loadData(root);
  changeMode(VIEWMODE);
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
      console.log(maps);
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

    row.onclick = () => {
      loadDetail(item.inspection_template_id);
    }

    template_tbl_cols.forEach(column => {
      row.appendChild(createTableCell(item, column));
    })

    templateTable.appendChild(row);
  });
}

async function loadDetail(id) {
  // only load detail data if the user is viewing data
  if (MODE !== VIEWMODE) {
    return;
  }

  templateDetailData = await callApi("getTemplate", { params: id });

  document.querySelector("#template-name-fld").value = templateDetailData["template"].name;
  document.querySelector("#template-desc-fld").value = templateDetailData["template"].description;
  document.querySelector("#frequency-type-fld").value = templateDetailData["template"].frequency_type_id;
  document.querySelector("#frequency-value-fld").value = templateDetailData["template"].frequency_value;
  if (templateDetailData["template"].anchor_date) {
    document.querySelector("#anchor-date-fld").valueAsDate = formatDateInput(templateDetailData["template"].anchor_date);
  } else {
    document.querySelector("#anchor-date-fld").value = "";
  }

  if (referenceData["frequencyTypes"].filter(type => (type.frequency_type_id === templateDetailData["template"].frequency_type_id))[0].value === "NONE") {
    document.querySelector("#frequency-input").classList.add("hidden");
    document.querySelector("#planned-cb").checked = false;
  } else {
    document.querySelector("#frequency-input").classList.remove("hidden");
    document.querySelector("#planned-cb").checked = true;
  }

  renderTemplateCheckpointTable();

  loadedTemplateId = id;
  changeMode(VIEWMODE);
};

function renderTemplateCheckpointTable(){
  const templateTable = document.querySelector("#template-checkpoint-table");
  templateTable.innerHTML = "";

  if(templateDetailData.checkpoints){
    templateDetailData.checkpoints.forEach((cp) => {
      const row = document.createElement("tr");
      template_checkpoint_tbl_cols.forEach((column) => {
        row.appendChild(createTableCell(cp, column));
      });
      
      templateTable.appendChild(row);
    });
  }
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
  document.querySelector("#add-checkpoint-btn").disabled = (MODE === VIEWMODE);

  document.querySelector("#planned-cb").style.disabled = (MODE === VIEWMODE);
  document.querySelector("#planned-cb").style.pointerEvents = MODE === CREATEMODE || MODE === EDITMODE ? 'auto' : 'none';
  document.querySelector("#planned-cb-lbl").style.pointerEvents = MODE === CREATEMODE || MODE === EDITMODE ? 'auto' : 'none';
  document.querySelector("#frequency-type-fld").style.pointerEvents = MODE === CREATEMODE || MODE === EDITMODE ? 'auto' : 'none';

  renderCheckPointTable();
}

async function renderCheckpointInput(id = 0) {
  const modal = document.querySelector("#modal-root");
  modal.classList.toggle("hidden");

  const modalContent = document.querySelector("#modal-content");

  modalContent.innerHTML = `
    <div>
      <h2 style="margin: 0em;">${id === 0 ? "Nieuw" : "Wijzig"} Checkpoint</h2>
      <div style="margin: 0.5em; margin-bottom: 1em;">
        <div class="modal-input-field">
          <label>Naam</label>
          <input id="modal-description-fld" type="text" />
        </div>
        <div class="modal-input-field">
          <label>Categorie</label>
          <select id="modal-category-fld" type="text" ></select>
        </div>
        <div class="modal-input-field">
          <label>Locatie</label>
          <select id="modal-area-fld" type="text" ></select>
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

  // set dropdown values for checkpoint category
  const categoryFld = document.querySelector("#modal-category-fld");
  referenceData["categories"].forEach(category => {
    const option = document.createElement("option");
    option.value = category.checkpoint_category_id;
    option.innerText = category.value;
    categoryFld.appendChild(option);
  });

  // set dropdown values for checkpoint area
  const areaFld = document.querySelector("#modal-area-fld");
  referenceData["areas"].forEach(area => {
    const option = document.createElement("option");
    option.value = area.checkpoint_area_id;
    option.innerText = area.value;
    areaFld.appendChild(option);
  });

  // create save option for checkpoint
  document.querySelector("#save-modal-btn").onclick = async () => {
    const bodyContent = {
      description: document.querySelector("#modal-description-fld").value,
      checkpoint_category_id: document.querySelector("#modal-category-fld").value,
      checkpoint_area_id: document.querySelector("#modal-area-fld").value,
      remarks: document.querySelector("#modal-remarks-fld").value,
      active: document.querySelector("#modal-active-fld").checked
    };

    if (id === 0) {
      const result = await callApi("createCheckpoint", {
        body: bodyContent
      });
    } else {
      const result = await callApi("updateCheckpoint", {
        params: id,
        body: bodyContent
      });
    }

    loadData();
    modal.classList.toggle("hidden");
  };

  // set the fields in case or edit-mode
  if (id !== 0) {
    const checkpoint = checkpointData.filter((checkpoint => checkpoint.checkpoint_id === id))[0];

    console.log(checkpoint);

    document.querySelector("#modal-description-fld").value = checkpoint.description;
    document.querySelector("#modal-category-fld").value = checkpoint.checkpoint_category_id;
    document.querySelector("#modal-area-fld").value = checkpoint.checkpoint_area_id;
    document.querySelector("#modal-remarks-fld").value = checkpoint.remarks;
    document.querySelector("#modal-active-fld").checked = checkpoint.active;
  }

  document.querySelector("#cancel-modal-btn").onclick = () => {
    modalContent.innerHTML = "";
    modal.classList.toggle("hidden");
  };
}

async function renderCheckpointSelectionTable() {
  const modal = document.querySelector("#modal-root");
  modal.classList.toggle("hidden");

  const modalContent = document.querySelector("#modal-content");

  templateDetailCheckpoints = templateDetailData.checkpoints;

  modalContent.innerHTML = `
      <h2 style="margin: 0em;">Selecteer Checkpoints</h2>
      <div id="checkpoint_modal_list" style="margin: 0.5em; margin-bottom: 1em;">
      </div>
      <div style="display: flex; flex-direction: row; justify-content: space-between;">
        <button id="save-modal-btn" class="new-btn">Opslaan</button>
        <button id="cancel-modal-btn" class="cancel-btn">Annuleren</button>
      </div>
  `;

  const checkpointList = document.querySelector("#checkpoint_modal_list");

  checkpointData.forEach((checkpoint) => {
    const div = document.createElement("div");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.id = `modal_check_${checkpoint.checkpoint_id}`;
    checkbox.value = checkpoint.checkpoint_id;

    try {
      if (templateDetailData.checkpoints.filter((cp) => {
        return cp.checkpoint_id === checkpoint.checkpoint_id;
      }).length > 0) {
        checkbox.checked = true;
      }
    } catch (err) {
      console.log(err.message);
    }

    label.textContent = checkpoint.description;
    label.htmlFor = checkbox.id;

    checkbox.onchange = () => {
      if (!checkbox.checked) {
        templateDetailCheckpoints = templateDetailCheckpoints.filter((cp) => { return cp.checkpoint_id !== checkpoint.checkpoint_id; });
      } else {
        templateDetailCheckpoints.push({
          active: checkpoint.active,
          checkpoint_area_id: checkpoint.checkpoint_area_id,
          checkpoint_category_id: checkpoint.checkpoint_category_id,
          checkpoint_id: checkpoint.checkpoint_id,
          description: checkpoint.description,
          remarks: checkpoint.remarks,
          required: 1,
          sort_order: 1
        });
      }
    }

    div.appendChild(label);
    div.appendChild(checkbox);
    checkpointList.appendChild(div);
  });

  document.querySelector("#save-modal-btn").onclick = () => {
    templateDetailData.checkpoints = templateDetailCheckpoints;
    renderTemplateCheckpointTable();
    modalContent.innerHTML = "";
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
    <div class="insp-col1 v-split" style="min-width: 40%">
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
                  <th class="numeric-column"># Checkpoints</th>
                  <th class="numeric-column">Actief</th>
                </tr>
              </thead>
              <tbody id="template-tbl"></tbody>
            </table>
          </div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between;">
            <h3 class="work-panel-title">Checkpoints</h3>
            <button id="new-checkpoint-btn" class="new-btn logo-text-btn">+ Nieuw checkpoint</button>
          </div>
          <br>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Checkpoint</th>
                  <th>Categorie</th>
                  <th>Locatie</th>
                  <th class="numeric-column">Actief</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="checkpoint-tbl"></tbody>
            </table>
          </div>
        </div>
      </div>
      <div id="input-form" class="view-mode" style="min-width: 40%">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <h3 id="detail-title" class="work-panel-title">Inspectietype details</h3>
          <button id="edit-btn" class="action-btn logo-text-btn">&#9998; Bewerken</button>
        </div>
        <h3>Basisgegevens</h3>
        <div>
          <label style="width: 6em;">Naam</label>
          <input id="template-name-fld" type="text" />
          <br>
          <label style="width: 6em;">Omschrijving</label>
          <input id="template-desc-fld" type="text" />
        </div>
        <h3>Planning & Uitvoering</h3>
        <div>
          <input id="planned-cb" type="checkbox"/>
          <label id="planned-cb-lbl" for="planned-cb">In automatische planning opnemen</label>
        </div>
        <div id="frequency-input" style="padding-top: 1em;" class="hidden">
          <label style="display: block;">Geplande uitvoeringsfrequentie</label>
          <div>
            <input id="frequency-value-fld" type="number" min="1" />
            <select id="frequency-type-fld">
            </select>
            <br>
          </div>
          <label style="display: block;">Startdatum</label>
          <input id="anchor-date-fld" type="date" />
        </div>      
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <h3>Checkpoints</h3>
          <button id="add-checkpoint-btn" class="new-btn logo-text-btn">+ Checkpoints wijzigen</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <th>Checkpoint</th>
              <th>Categorie</th>
              <th>Location</th>
              <th class="numeric-column">Verplicht</th>
            </thead>
            <tbody id="template-checkpoint-table">
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
  await loadData();

  if (id) {
    await loadDetail(root, id);
  }

  const inputForm = root.querySelector("#input-form");
  inputForm.querySelectorAll("input, textarea").forEach(el => el.readOnly = (MODE === VIEWMODE));

  inputForm.querySelector("#planned-cb").onclick = () => {
    inputForm.querySelector("#frequency-input").classList.toggle("hidden");
  };

  // set dropdown values for frequency type field
  const frequencyTypeFld = document.querySelector("#frequency-type-fld");
  referenceData["frequencyTypes"].forEach(type => {
    const option = document.createElement("option");
    option.value = type.frequency_type_id;
    option.innerText = type.display_name;
    frequencyTypeFld.appendChild(option);
  });

  root.querySelector("#new-template-btn").onclick = async () => {
    if (MODE === VIEWMODE) {
      await clearForm(root);
      changeMode(CREATEMODE);
    }
  };

  root.querySelector("#new-checkpoint-btn").onclick = async () => {
    await renderCheckpointInput();
  };

  root.querySelector("#add-checkpoint-btn").onclick = async () => {
    await renderCheckpointSelectionTable();
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