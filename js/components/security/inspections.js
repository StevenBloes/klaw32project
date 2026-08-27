export const title = "KLA W32 - Inspecties";

const VIEWMODE = 0;
const CREATEMODE = 1;
const EDITMODE = 2;

let MODE = 0;

const SAMPLE_DATA = [
  {
    id: 1,
    type: "Dagelijks",
    date: "2026-08-23",
    time: "09:38",
    location: "Productiehal",
    executedBy: "S. Bloes",
    function: "Kwaliteitsmedewerker",
    deviationCount: 1,
    securityLevel: 1,
    status: "Voltooid",
    remarks: "Dagelijkse rondgang, controle productie."
  }, {
    id: 2,
    type: "Wekelijks",
    date: "2026-08-24",
    time: "11:23",
    location: "Volle Perimeter",
    executedBy: "S. Bloes",
    function: "Kwaliteitsmedewerker",
    deviationCount: 2,
    securityLevel: 1,
    status: "Voltooid",
    remarks: "Wekelijkse rondgang, uitgebreide controle van de toegangscontrole."
  }, {
    id: 3,
    type: "Dagelijks",
    date: "2026-08-26",
    time: "10:24",
    location: "Productiehal",
    executedBy: "S. Bloes",
    function: "Kwaliteitsmedewerker",
    deviationCount: 0,
    securityLevel: 1,
    status: "Voltooid",
    remarks: "Dagelijkse rondgang door productie."
  }
];

const table_columns = ["id", ["date", "time"], "type", "location", "executedBy", "deviationCount", "status"];


function loadData(root) {

  /* still needs fetch request to API for actual data */

  const table = root.querySelector("#inspection_tbl");

  SAMPLE_DATA.forEach(item => {

    const row = document.createElement("tr");
    row.id = "INS_" + item.id;
    row.onclick = () => {
      loadDetail(root, item.id);
    };

    table_columns.forEach(column => {
      const cell = document.createElement("td");

      if (column === "id") {
        cell.innerHTML = `INS_${String(item[column]).padStart(3, "0")}`;
      } else {
        cell.innerHTML = Array.isArray(column) ? column.map(col => item[col]).join(" ") : item[column];
      }

      if (column === "deviationCount") {
        if (item[column] > 0) {
          cell.classList.add("bold-red-txt", "numeric-column");
        } else {
          cell.classList.add("bold-green-txt", "numeric-column");
        }
      }


      row.appendChild(cell);
    });

    table.appendChild(row);
  });
}

function loadDetail(root, id) {
  if (MODE !== VIEWMODE) {
    return;
  }

  root.querySelector("#detail-title").innerHTML = `INS_${String(id).padStart(3, "0")} - Inspectie Details`;

  root.querySelector("#detail-id").value = `INS_${String(id).padStart(3, "0")}`;
  root.querySelector("#detail-type").value = SAMPLE_DATA.filter((key) => key.id === id)[0].type;
  root.querySelector("#detail-date").value = SAMPLE_DATA.filter((key) => key.id === id)[0].date;
  root.querySelector("#detail-time").value = SAMPLE_DATA.filter((key) => key.id === id)[0].time;
  root.querySelector("#detail-location").value = SAMPLE_DATA.filter((key) => key.id === id)[0].location;
  root.querySelector("#detail-executed-by").value = SAMPLE_DATA.filter((key) => key.id === id)[0].executedBy;
  root.querySelector("#detail-function").value = SAMPLE_DATA.filter((key) => key.id === id)[0].function;
  root.querySelector("#detail-security-level").value = SAMPLE_DATA.filter((key) => key.id === id)[0].securityLevel;
  root.querySelector("#detail-remarks").value = SAMPLE_DATA.filter((key) => key.id === id)[0].remarks;
}

function changeMode(mode){
  MODE = mode;

  const inputForm = document.querySelector("#input-form");

  inputForm.querySelector("#mode-btn").innerHTML = MODE === VIEWMODE ? "Wijzigen" : "Opslaan";

  inputForm.classList.toggle("edit-mode", MODE === EDITMODE);
  inputForm.classList.toggle("view-mode", MODE !== EDITMODE);

  inputForm.querySelectorAll("input, textarea").forEach(el => el.readOnly = (MODE === VIEWMODE ));
}

export function render(id) {
  return `
    <div class="insp-row">
    <div class="insp-col1">
    <h3 class="work-panel-title">Uitgevoerde Inspecties</h3>
    <div>filters</div>
    <div class="table-container">
    <table id="inspection-tbl">
      <thead>
        <tr>
          <th>ID</th>
          <th>Datum</th>
          <th>Type</th>
          <th>Plaats</th>
          <th>Uitgevoerd door</th>
          <th class="numeric-column">Bevindingen</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="inspection_tbl">
      </tbody>
    </table>
    </div>
    </div>
    <div id="input-form" class="view-mode">
      <h3 id="detail-title" class="work-panel-title">Inspectie Details</h3>
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
      <div>
        <label style="vertical-align: top;">Opmerkingen</label>
        <textarea id="detail-remarks"></textarea>
      </div>
      <h4>Checkpoints</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Checkpoint</th>
              <th class="numeric-column">Result</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody id="checkpoint-tbl">
            <tr>
              <td>1</td>
              <td>Perimeter hek intact</td>
              <td class="numeric-column bold-green-txt">OK</td>
              <td>-</td>            
            </tr>
            <tr>
              <td>2</td>
              <td>Logboek bezoeker compleet</td>
              <td class="numeric-column bold-red-txt">NOK</td>
              <td>Chauffeur niet aangemeld</td>            
            </tr>
            <tr>
              <td>3</td>
              <td>Signalisatie goed zichtbaar</td>
              <td class="numeric-column bold-green-txt">OK</td>
              <td>-</td>            
            </tr>
          </tbody>
        </table>
      </div>
      <h4>Waargenomen Afwijkingen (1)</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Omschrijving</th>
              <th>Prioriteit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="deviation-tbl">
            <tr>
              <td>FIN_0001</td>
              <td>Chauffeur niet aangemeld</td>
              <td>Medium</td>
              <td>Open</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin: 2em 0em;"><button id="mode-btn">Wijzigen</button></div>
    </div>
    </div>
    
  `;
}

export function init(root, id) {
  loadData(root);

  const inputForm = root.querySelector("#input-form");
  inputForm.querySelectorAll("input, textarea").forEach(el => el.readOnly = (MODE === VIEWMODE ));

  root.querySelector("#mode-btn").onclick = () => {
    if ( MODE === EDITMODE ) {
      changeMode(VIEWMODE);
    } else if (MODE === VIEWMODE) {
      changeMode(EDITMODE);
    }
  };
}

export function destroy() {

}
