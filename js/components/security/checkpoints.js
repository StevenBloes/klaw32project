export const title = "KLA W32 - Checkpoints";

const VIEWMODE = 0;
const CREATEMODE = 1;
const EDITMODE = 2;

let MODE = VIEWMODE;

let loadedTemplateId;

const maps = {
  checkbox: {

  }
};

const inspectionType_tbl_cols = [
  { field: "name" },
  { field: "checkpoint_count" },
  { field: "active", map: "" }
];

const checkpoint_tbl_cols = [
  { field: "security_level" },
  { field: "description" },
  { field: "checkpoint_categorie" },
  { field: "checkpoint_area" },
  { field: "active", map: "" }
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

async function loadData(){

}

async function loadDetail(){

}

function clearForm(){

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

export function render(id) {
  return `
  <div class="insp-row">
    <div class="insp-col1 v-split">
      <div class="insp-row1">
        <div style="display: flex; justify-content: space-between;">
          <h3 class="work-panel-title">Inspectietypes (Templates)</h3>
          <button id="new-template-btn" class="new-btn logo-text-btn">+ Nieuw Inspectietype</button>
        </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Checkpoints</th>
                  <th>Actief</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>table_content</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between;">
            <h3 class="work-panel-title">Checkpoints</h3>
            <button id="new-checkpoint-btn" class="new-btn logo-text-btn">+ Nieuw checkpoint</button>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Checkpoint</th>
                  <th>Categorie</th>
                  <th>Locatie</th>
                  <th>Actief</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>table_content</td></tr>
              </tbody>
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
        <h3>Checkpoints</h3>
        <div class="table-container">
          <table>
            <thead>
              <th>SL</th>
              <th>Checkpoint</th>
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

  root.querySelector("#save-btn").onclick = async () => {
    await saveData(root);
  };

  root.querySelector("#cancel-btn").onclick = async () => {
    changeMode(VIEWMODE);
    if(loadedTemplateId){
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