export const title = "KLA W32 - Productie Planning";

// Global constants
let date = new Date();

let rootEl;

let bannerLabel;
let planningTable;
let layer;

const PROD_MODE = 0;
const RECEP_MODE = 1;

// for load table loop
let timeoutId = null;
let destroyed = false;

// default the view to the production view
let view_mode = parseInt(getFromLocalStorage('view_mode') ? getFromLocalStorage('view_mode') : PROD_MODE);

let isEditing = false;
let prev_text = "";

let total = 0;
let l1_counter = 0;
let l2_counter = 0;
let l3_counter = 0;
let bb_counter = 0;

let count = 0;

/*************************************************************************
* Local storage: getter, setter and delete functions for local storage 
* Can be used without a server
*************************************************************************/
// extract a value
function getFromLocalStorage(name) {
  return localStorage.getItem(name);
}

// set a value
function saveToLocalStorage(name, value) {
  localStorage.setItem(name, value);
}

// delete a value
function deleteFromLocalStorage(name) {
  localStorage.removeItem(name);
}


// change view
function changeView(root) {
  if (view_mode === PROD_MODE) {
    view_mode = RECEP_MODE;
  } else {
    view_mode = PROD_MODE;
  }

  root.classList.toggle("recep-mode", view_mode === RECEP_MODE);

  saveToLocalStorage("view_mode", view_mode);
  loadPlanning();
}

// increase date
function subDay() {
  date.setUTCDate(date.getDate() - 1);
  bannerLabel.innerHTML = "Planning " + date.toISOString().substring(0, 10);
  loadPlanning();
}

// decrease date
function addDay() {
  date.setUTCDate(date.getDate() + 1);
  bannerLabel.innerHTML = "Planning " + date.toISOString().substring(0, 10);
  loadPlanning();
}

// select date from a datepicker
function selectDay() {
  const picker = document.getElementById("datePicker");
  picker.showPicker();
  picker.addEventListener("change", () => {
    date = new Date(picker.value);
    bannerLabel.innerHTML = "Planning " + date.toISOString().substring(0, 10);
    loadPlanning();
  });
}

// adjust arrival confirmation
function incrementConfirmation(id, current_value) {
  let new_value = 0;
  if (current_value < 2) {
    new_value = current_value + 1;
  } else {
    new_value = 0;
  }
  fetch(`http://192.168.28.132:3000/arrconfirm/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_value })
  })
    .then(res => res.json())
    .then(data => { loadPlanning(); })
    .catch(err => console.error(err));
}

// save production code
function save_production_code(id, new_value) {
  // add leading zero if not typed and if string is not empty
  if (!String(new_value).startsWith(0) && String(new_value).trim() !== "") {
    new_value = "0" + String(new_value).trim();
  }
  fetch(`http://192.168.28.132:3000/edit_prod/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_value })
  })
    .then(res => res.json())
    .then(data => { loadPlanning(); })
    .catch(err => console.error(err));
}

// check time format
function check_time_format(value) {

}

// save arrival time
function save_arrival(id, new_value) {
  fetch(`http://192.168.28.132:3000/edit_arr/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_value })
  })
    .then(res => res.json())
    .then(data => { loadPlanning(); })
    .catch(err => console.error(err));
}

// save departure time
function save_departure(id, new_value) {
  fetch(`http://192.168.28.132:3000/edit_dep/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_value })
  })
    .then(res => res.json())
    .then(data => { loadPlanning(); })
    .catch(err => console.error(err));
}

// load table data
async function loadPlanning() {
  try {
    const response = await fetch(
      "http://192.168.28.132:3000/planning?date=" + encodeURIComponent(date.toISOString().substring(0, 10))
    );

    if (!response.ok) {
      console.error("HTTP ERROR:", response.status, response.statusText);
      throw new Error("Server returned " + response.status);
    } else {
      const data = await response.json();

      l1_counter = 0;
      l2_counter = 0;
      l3_counter = 0;
      bb_counter = 0;
      total = data.length;

      count = data
        .filter(row => row.arrival_time && row.arrival_confirmation === 0 && !row.departure_time)
        .length;

      let transport = "";
      let transport_link = "";

      planningTable.innerHTML = "";
      data.map((row, i, arr) => {
        const tr = document.createElement("tr");
        if (view_mode === PROD_MODE) {
          tr.ondblclick = () => incrementConfirmation(row.idPlanning, row.arrival_confirmation);
        }
        // set color of row (yellow = arrived, green = confirmed, blue = finished)
        if (row.arrival_time !== null) {
          if (row.departure_time !== null) {
            tr.style.color = "#6666";
          } else {
            if (row.arrival_confirmation === 0) {
              tr.style.backgroundColor = "#FFFF55";
            } else if (row.arrival_confirmation === 1) {
              tr.style.backgroundColor = "#BBEEAAAA";
            } else if (row.arrival_confirmation === 2) {
              tr.style.backgroundColor = "#AACCFFAA";
            }
          }
        }
        // set empty rows between truck drivers
        if (transport) {
          if (row.link_spriet) {
            if (row.link_spriet === transport_link) {
              transport = row.transport;
            } else {
              transport = row.transport;
              transport_link = row.link_spriet;
              const empty = document.createElement("tr");
              empty.style.backgroundColor = "#DDE5";
              if (view_mode === PROD_MODE) {
                empty.innerHTML = `<td colspan="12">&nbsp;</td>`;
              } else {
                empty.innerHTML = `<td colspan="14">&nbsp;</td>`;
              }
              planningTable.appendChild(empty);
            }
          } else {
            if (row.transport === transport) {
              transport = row.transport;
            } else {
              transport = row.transport;
              transport_link = row.link_spriet;
              const empty = document.createElement("tr");
              empty.style.backgroundColor = "#DDE5";
              if (view_mode === PROD_MODE) {
                empty.innerHTML = `<td colspan="12">&nbsp;</td>`;
              } else {
                empty.innerHTML = `<td colspan="14">&nbsp;</td>`;
              }
              planningTable.appendChild(empty);
            }
          }
        } else {
          transport = row.transport;
          if (row.link_spriet) {
            transport_link = row.link_spriet;
          }
        }
        // create cells and apply extra styling if necessary
        let td_expected = document.createElement("td");
        td_expected.innerHTML = row.expected_time ? String(row.expected_time).substring(0, 5) : "";
        let td_line = document.createElement("td");
        td_line.innerHTML = row.line;
        let td_transport = document.createElement("td");
        td_transport.innerHTML = row.transport;
        let td_order = document.createElement("td");
        td_order.innerHTML = row.order_reference;
        let td_customer = document.createElement("td");
        td_customer.innerHTML = row.customer;
        // if transport_id is the same as the previous or next row apply a red border to the cell
        if (i < arr.length - 1) {
          if (row.idPlanning === arr[i + 1].idPlanning) {
            td_customer.style.borderLeft = "red 2px solid";
            td_customer.style.borderRight = "red 2px solid";
            if (i > 0) {
              if (row.idPlanning !== arr[i - 1].idPlanning) {
                td_customer.style.borderTop = "red 2px solid";
              }
            } else {
              td_customer.style.borderTop = "red 2px solid";
            }
          }
        }
        if (i > 0) {
          if (row.idPlanning === arr[i - 1].idPlanning) {
            td_customer.style.borderLeft = "red 2px solid";
            td_customer.style.borderRight = "red 2px solid";
            if (i < arr.length - 1) {
              if (row.idPlanning !== arr[i + 1].idPlanning) {
                td_customer.style.borderBottom = "red 2px solid";
              }
            } else {
              td_customer.style.borderBottom = "red 2px solid";
            }
          }
        }
        let td_location = document.createElement("td");
        if (view_mode === PROD_MODE) {
          td_location.innerHTML = row.location.replace(/^\d{4,5}\s+/, "").trim();
        } else {
          td_location.innerHTML = row.location.trim();
        }
        let td_mixpro = document.createElement("td");
        td_mixpro.innerHTML = row.mixpro_code;
        td_mixpro.dataset.tip = "Verwachte densiteit " + row.density + " kg/EN-m³";
        let td_sap = document.createElement("td");
        td_sap.classList.add("hideable_column");
        td_sap.innerHTML = row.sap_code;
        let td_amount = document.createElement("td");
        td_amount.innerHTML = row.amount;
        let td_op_remarks = document.createElement("td");
        if (String(row.op_remarks).toUpperCase().includes("BIO") && row.departure_time === null) {
          td_op_remarks.style.color = "#FF0000";
          td_op_remarks.style.backgroundColor = "#FBB5";
        }
        td_op_remarks.innerHTML = row.op_remarks;
        let td_time_remarks = document.createElement("td");
        td_time_remarks.innerHTML = row.time_remarks;
        let td_production_code = document.createElement("td");
        td_production_code.classList.add("hideable_column");
        td_production_code.contentEditable = "true";
        td_production_code.innerHTML = row.production_code;
        td_production_code.setAttribute("idPlanning", row.id_ordered_product);
        td_production_code.addEventListener("focusin", (e) => {
          const el = document.activeElement;
          prev_text = el.innerHTML;
          isEditing = true;
        });
        td_production_code.addEventListener("focusout", (e) => {
          isEditing = false;
        });
        td_production_code.addEventListener('keydown', (e) => {
          const el = document.activeElement;
          if (e.key === "Enter") {
            e.preventDefault();
            save_production_code(el.getAttribute("idPlanning"), el.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape") {
            el.innerHTML = prev_text;
            isEditing = false;
          }
        });

        // create arrival time cell
        let td_arrival = document.createElement("td");
        td_arrival.contentEditable = "true";
        td_arrival.innerHTML = row.arrival_time ? String(row.arrival_time).substring(0, 5) : "";
        td_arrival.setAttribute("idPlanning", row.idPlanning);
        td_arrival.addEventListener("focusin", (e) => {
          const el = document.activeElement;
          prev_text = el.innerHTML;
          isEditing = true;
        });
        td_arrival.addEventListener("focusout", (e) => {
          isEditing = false;
        });
        td_arrival.addEventListener('keydown', (e) => {
          const el = document.activeElement;
          if (e.key === "Enter") {
            e.preventDefault();
            save_arrival(el.getAttribute("idPlanning"), el.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape") {
            el.innerHTML = prev_text;
            isEditing = false;
          }
        });
        // create departure time cell
        let td_departure = document.createElement("td");
        td_departure.contentEditable = "true";
        td_departure.innerHTML = row.departure_time ? String(row.departure_time).substring(0, 5) : "";
        td_departure.setAttribute("idPlanning", row.idPlanning);
        td_departure.addEventListener("focusin", (e) => {
          const el = document.activeElement;
          prev_text = el.innerHTML;
          isEditing = true;
        });
        td_departure.addEventListener("focusout", (e) => {
          isEditing = false;
        });
        td_departure.addEventListener('keydown', (e) => {
          const el = document.activeElement;
          if (e.key === "Enter") {
            e.preventDefault();
            save_departure(el.getAttribute("idPlanning"), el.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape") {
            el.innerHTML = prev_text;
            isEditing = false;
          }
        });
        // append cells to row
        tr.appendChild(td_expected);
        tr.appendChild(td_line);
        tr.appendChild(td_transport);
        tr.appendChild(td_order);
        tr.appendChild(td_customer);
        tr.appendChild(td_location);
        tr.appendChild(td_mixpro);
        tr.appendChild(td_sap);
        tr.appendChild(td_amount);
        tr.appendChild(td_op_remarks);
        tr.appendChild(td_time_remarks);
        tr.appendChild(td_production_code);
        tr.appendChild(td_arrival);
        tr.appendChild(td_departure);
        // add tooltip with density to row
        let div = document.createElement("div");
        div.classList.add("tip");
        if (i >= data.length - 2) {
          div.style.top = "-170%";
        }
        div.innerHTML = "Verwachte densiteit " + row.density + " kg/EN-m³";
        td_mixpro.classList.add("tooltip");
        td_mixpro.appendChild(div);
        // append row to table
        planningTable.appendChild(tr);
        // count lines
        if (row.line == 1) {
          l1_counter = l1_counter + 1;
        } else if (row.line == 2) {
          l2_counter = l2_counter + 1;
        } else if (row.line == 3) {
          l3_counter = l3_counter + 1;
        } else if (row.line === 'BB') {
          bb_counter = bb_counter + 1;
        }
      });
    }
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}

// loop for loading table
function loop() {
  if (destroyed) {
    return;
  }
  if (!isEditing) {
    loadPlanning();

    if (count > 0) {
      bannerLabel.classList.add("pulse");
    } else {
      bannerLabel.classList.remove("pulse");
    }

    bannerLabel.innerHTML = "Planning " + date.toISOString().substring(0, 10) + " <small>(<small>Totaal: " + total +
      " => L1: " + l1_counter +
      " | L2: " + l2_counter +
      " | L3: " + l3_counter +
      " | BB: " + bb_counter +
      "</small>)</small>";
  }
  timeoutId = setTimeout(loop, 7500); // schedule next run
}


// SVG with animated eye and arrows 
function getEyeButton() {
  return `<svg 
    id='view-mode-btn' class='banner-btn' title="Verander tabel" width="85mm" height="85mm" viewBox="0 0 85 85" xmlns="http://www.w3.org/2000/svg">
      <title>Wijzig Modus</title>
      <style>
        svg { 
          transform-origin: 50% 50%; cursor: pointer;
        }
        #arrows *, #eye * {
          stroke: #06460b;
          transition: stroke 0.3s ease;
        }
        @keyframes openIris {
          0%   { stroke: #06460b; }
          100% { stroke: #96a69b; stroke-width: 1.5; }
        }
        @keyframes closeIris {
          0%   { stroke: #96a69b; stroke-width: 1.5; }
          100% { stroke: #06460b; stroke-width: 2; }
        }
        @keyframes openEye {
          0%   { stroke-width: 4; }
          100% { stroke-width: 3; }
        }
        @keyframes closeEye {
          0%   { stroke-width: 3; }
          100% { stroke-width: 4; }
        }
        @keyframes openPupil {
          0%   { stroke-width: 4; }
          100% { stroke-width: 1; }
        }
        svg #pupil { 
          animation: closeEye 0.6s ease forwards; 
        }
        svg #iris { 
          animation: closeIris 0.6s ease forwards; 
        }
        svg #outer { 
          animation: closeEye 0.6s ease forwards; 
        }
        svg:hover #eye #pupil { 
          animation: openPupil 0.6s ease forwards; 
        }
        svg:hover #eye #iris { 
          animation: openIris 0.6s ease forwards; 
        }
        svg:hover #eye #outer { 
          animation: openEye 0.6s ease forwards; 
        }
        </style>
        <g id="layer1">
          <rect
            x="0" y="0"
            width="85" height="85"
            fill="transparent"
            pointer-events="all"
            id="clickArea"
          />
          <g id="eye">
            <path id="outer"
              d="M17.25 43.30C35.18 19.40 48.63 21.08 66.88 42.63 52.57 63.19 30.51 62.46 17.25 43.30Z"
              fill="#fff" stroke-width="4.36" stroke-linecap="square" stroke-linejoin="round"/>
            <ellipse id="iris"
              cx="42.0" cy="42.0" rx="12.0" ry="12.0"
              fill="#10a31d" fill-opacity="0.52" stroke-width="2.22"/>
            <ellipse id="pupil"
              cx="42.0" cy="42.0" rx="7.50" ry="7.5"
              fill="#06470b" stroke-width="2.22"/>
            <ellipse id="light"
              cx="39.81" cy="39.82" rx="3.0" ry="3.5"
              fill="#fff" fill-opacity="0.65" stroke-width="2.22"/>
          </g>
          <g id="arrows">
            <!-- see Excel for calculations -->
            <path id="arrow_1_tail"
              d="M 11.9 31.1A 32 32 0 0 1 73.5 36.4"
              fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
            <path id="arrow_2_tail"
              d="M 72.1 52.9A 32 32 0 0 1 10.5 47.6"
              fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline id="arrow_1_head"
              points="20.8 28.8, 11.9 31.1, 8.9 21.3"
              fill="none" stroke-width="7.29" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline id="arrow_2_head"
              points="63.2 55.2, 72.1 52.9, 75.1 62.7"
              fill="none" stroke-width="7.29" stroke-linecap="round" stroke-linejoin="round"/>
            <animateTransform
              id="spin"
              attributeName="transform"
              type="rotate"
              from="0 40 40"
              to="-180 42 42"
              dur="0.2s"
              begin="layer1.click"
              fill="remove"/>
          </g>
        </g>
      </svg>`
}

export function render() {
  return `
    <div class="view">
      <div class="banner">
        <button class="banner-btn" id="sub-date-btn" title="Vorige"><</button>
        <div class="banner-btn drop-btn" onclick="">&#128437;
		      <div class="drop-panel">
		        <div class="drop-item">Huidige Planning</div>
			      <div class="drop-item">Nieuwe Planning</div>
			      <div class="drop-item">Benodigdheden</div>
			      <div class="drop-item">Historiek</div>
		      </div>
		    </div>
        <div id='banner-label' class='banner-label'>Productie Planning</div>
        ${getEyeButton()}
        <button class='banner-btn' id="change-date-btn" title="Selecteer datum" style="margin-left:0px; padding-left:0px;">&#128198;</button>
        <input type='date' id='datePicker' style='display: none;'>
        <button class='banner-btn' id="add-date-btn" title="Volgende">></button>
      </div>
      <div class='table-container'>
            <table>
              <thead>
                <tr>
                  <th>Uur</th>
                  <th>Lijn</th>
                  <th>Transporteur</th>
                  <th>Order</th>
                  <th>Klant</th>
                  <th>Plaats</th>
                  <th>MixPro</th>
				          <th class="hideable_column">SAP</th>
                  <th>EN-m³</th>
                  <th>Opmerking product</th>
                  <th>Opmerking levering</th>
				          <th class="hideable_column">Productie</th>
                  <th>Aankomst</th>
                  <th>Vertrek</th>
                </tr>
              </thead>
              <tbody id='planning-table'>
                <tr>
                  <td colspan=13 rowspan=2 style="color: grey; height:2em;">
                    Check the connection to the database
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
		</div>
    </div>
  `;
}

export function init(root) {
  rootEl = root;
  destroyed = false;

  bannerLabel = root.querySelector("#banner-label");
  planningTable = root.querySelector("#planning-table");
  layer = root.querySelector(".tooltip-layer");

  root.classList.toggle("recep-mode", view_mode === RECEP_MODE);

  root.querySelector("#sub-date-btn").onclick = () => { subDay() };
  root.querySelector("#view-mode-btn").onclick = () => { changeView(rootEl) };
  root.querySelector("#change-date-btn").onclick = () => { selectDay() };
  root.querySelector("#add-date-btn").onclick = () => { addDay() };

  loop();
}

export function destroy() {
  destroyed = true;
  clearTimeout(timeoutId);
}