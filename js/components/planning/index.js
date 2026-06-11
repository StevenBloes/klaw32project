export const title = "KLA W32 - Productie Planning";

import { TableEditor } from "../table/TableEditor.js";
import * as localStorage from "../../utils/localStorage.js";
import { callApi } from "../../services/apiCalls.js";
import { getCalendarButton } from "../svg/calendar.js";
import { getEyeButton } from "../svg/eyeSwitch.js";

// Global constants
let date = new Date();

let rootEl;
let activeEl;

let bannerLabel;
let planningTable;
let layer;

const PROD_MODE = 0;
const RECEP_MODE = 1;

// for load table loop
let timeoutId = null;
let destroyed = false;

// default the view to the production view
let view_mode = parseInt(localStorage.get('view_mode') ? localStorage.get('view_mode') : PROD_MODE);

let isEditing = false;
let prev_text = "";

let total = 0;
let l1_counter = 0;
let l2_counter = 0;
let l3_counter = 0;
let bb_counter = 0;

let count = 0;

// change view
function changeView(root) {
  if (view_mode === PROD_MODE) {
    view_mode = RECEP_MODE;
  } else {
    view_mode = PROD_MODE;
  }

  root.classList.toggle("recep-mode", view_mode === RECEP_MODE);

  localStorage.save("view_mode", view_mode);
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

// function to set current Element that is edited
function setEditingElement() {
  activeEl = document.activeElement;
  prev_text = activeEl.innerHTML;
  isEditing = true;
}

/*************************************************************************
* Functions for edit request to the server
*************************************************************************/
async function incrementConfirmation(id, current_value) {
  let value = 0;
  if (current_value < 2) {
    value = current_value + 1;
  } else {
    value = 0;
  }
  try {
    await callApi("updateArrivalConfirmation", { params: id, body: { value: value } });
    loadPlanning();
  } catch (error) {
    console.error(error);
  }
}

async function save_order_time_remark(id, value) {
  try {
    await callApi("updateOrderTimeRemark", { params: id, body: { value: value } });
    loadPlanning();
  } catch (error) {
    console.error(error);
  }
}

async function save_production_code(id, value) {
  // add leading zero if not typed and if string is not empty
  if (!String(value).startsWith(0) && String(value).trim() !== "") {
    value = "0" + String(value).trim();
  }
  try {
    await callApi("updateProductionId", { params: id, body: { value: value } });
    loadPlanning();
  } catch (error) {
    console.error(error);
  }
}

async function save_arrival(id, value) {
  try {
    await callApi("updateArrival", { params: id, body: { value: value } });
    loadPlanning();
  } catch (error) {
    console.error(error);
  }
}

async function save_departure(id, value) {
  try {
    await callApi("updateDeparture", { params: id, body: { value: value } });
    loadPlanning();
  } catch (error) {
    console.error(error);
  }
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
    } else if (response.status === 403) {
      return;
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
        td_time_remarks.contentEditable = "true";
        td_time_remarks.innerHTML = row.time_remarks;
        td_time_remarks.setAttribute("order_id", row.order_id);
        td_time_remarks.addEventListener("focusin", (e) => {
          setEditingElement();
        });
        td_time_remarks.addEventListener("focusout", (e) => {
          save_order_time_remark(activeEl.getAttribute("order_id"), activeEl.innerHTML.replace("<br>", ""));
          isEditing = false;
        });
        td_time_remarks.addEventListener('keydown', (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save_order_time_remark(activeEl.getAttribute("order_id"), activeEl.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape") {
            activeEl.innerHTML = prev_text;
            isEditing = false;
          }
        });
        let td_production_code = document.createElement("td");
        td_production_code.classList.add("hideable_column");
        td_production_code.contentEditable = "true";
        td_production_code.innerHTML = row.production_code;
        td_production_code.setAttribute("idPlanning", row.id_ordered_product);
        td_production_code.addEventListener("focusin", (e) => {
          setEditingElement();
        });
        td_production_code.addEventListener("focusout", (e) => {
          save_production_code(activeEl.getAttribute("idPlanning"), activeEl.innerHTML.replace("<br>", ""));
          isEditing = false;
        });
        td_production_code.addEventListener('keydown', (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save_production_code(activeEl.getAttribute("idPlanning"), activeEl.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape") {
            activeEl.innerHTML = prev_text;
            isEditing = false;
          }
        });

        // create arrival time cell
        let td_arrival = document.createElement("td");
        td_arrival.contentEditable = "true";
        td_arrival.innerHTML = row.arrival_time ? String(row.arrival_time).substring(0, 5) : "";
        td_arrival.setAttribute("idPlanning", row.idPlanning);
        td_arrival.addEventListener("focusin", (e) => {
          setEditingElement();
        });
        td_arrival.addEventListener("focusout", (e) => {
          save_arrival(activeEl.getAttribute("idPlanning"), activeEl.innerHTML.replace("<br>", ""));
          isEditing = false;
        });
        td_arrival.addEventListener('keydown', (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save_arrival(activeEl.getAttribute("idPlanning"), activeEl.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape") {
            activeEl.innerHTML = prev_text;
            isEditing = false;
          }
        });
        // create departure time cell
        let td_departure = document.createElement("td");
        td_departure.contentEditable = "true";
        td_departure.innerHTML = row.departure_time ? String(row.departure_time).substring(0, 5) : "";
        td_departure.setAttribute("idPlanning", row.idPlanning);
        td_departure.addEventListener("focusin", (e) => {
          setEditingElement();
        });
        td_departure.addEventListener("focusout", (e) => {
          save_departure(activeEl.getAttribute("idPlanning"), activeEl.innerHTML.replace("<br>", ""));
          isEditing = false;
        });
        td_departure.addEventListener('keydown', (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save_departure(activeEl.getAttribute("idPlanning"), activeEl.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape") {
            activeEl.innerHTML = prev_text;
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
        if (i >= data.length - 3) {
          div.style.top = "-170%";
        }
        div.innerHTML = row.density ? "Verwachte densiteit " + row.density + " kg/EN-m³<br>Verwachte gewicht " + Math.round((row.density * row.amount) / 100) / 10 + " ton" : "Nieuw recept";
        td_mixpro.classList.add("tooltip");
        td_mixpro.appendChild(div);
        // add tooltip for extra actions
        let control = document.createElement("div");
        control.classList.add("tip");
        if (i >= data.length - 3) {
          control.style.top = "-170%";
        }
        if ((row.id_ordered_product % 250) === 0) {
          control.innerHTML = "<u>Controle:</u><br>Volumemeetsysteem<br>LABO";
          td_arrival.classList.add("tooltip", "volume-control-td");
          td_arrival.style.border = "2px solid red";
          //td_arrival.appendChild(control);
        } else if ((row.id_ordered_product % 30) === 0) {
          control.innerHTML = "<u>Controle:</u><br>Weging bij Huys";
          td_arrival.classList.add("tooltip", "weight-control-td");
          td_arrival.style.border = "2px solid orange";
          //td_arrival.appendChild(control);
        } else if ((row.id_ordered_product % 10) === 0 && row.transport.indexOf("vaeke") < 0 && row.transport.indexOf("raecke") < 0 && row.transport.indexOf("bouvere") < 0 && row.transport.indexOf("eDeCe") < 0 && row.transport.indexOf("labbinck") < 0) {
          control.innerHTML = "<u>Controle:</u><br>Laadruimte";
          td_arrival.classList.add("tooltip", "cleaning-control-td");
          td_arrival.style.border = "2px solid blue";
          //td_arrival.appendChild(control);
        }
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
    // update bannerlabel
    bannerLabel.innerHTML = "Planning " + date.toISOString().substring(0, 10) + " <small>(<small>Totaal: " + total +
      " => L1: " + l1_counter +
      " | L2: " + l2_counter +
      " | L3: " + l3_counter +
      " | BB: " + bb_counter +
      "</small>)</small>";
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
  }
  timeoutId = setTimeout(loop, 10000); // schedule next run
}

export function render() {
  return `
    <div class="view" id="child-outlet">
      <div class="banner">
        <button class="banner-btn" id="sub-date-btn" title="Vorige"><</button>
        <div class="banner-btn drop-btn" onclick="">&#128437;
		      <div class="drop-panel">
		        <div id="curr-planning-btn" class="drop-item" style="color:grey">Huidige Planning</div>
			      <div id="new-planning-btn" class="drop-item">Nieuwe Planning</div>
			      <div id="needed-supplies-btn" class="drop-item">Benodigdheden</div>
			      <div id="history-btn" class="drop-item">Historiek</div>
		      </div>
		    </div>
        <div id='banner-label' class='banner-label'>Productie Planning</div>
        ${getEyeButton()}
        ${getCalendarButton()}
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

  root.querySelector("#curr-planning-btn").onclick = () => { window.location.hash = "#/planning/"; };
  root.querySelector("#new-planning-btn").onclick = () => { window.location.hash = "#/planning/new"; };
  root.querySelector("#needed-supplies-btn").onclick = () => { window.location.hash = "#/planning/supplies"; };
  root.querySelector("#history-btn").onclick = () => { window.location.hash = "#/planning/history"; };

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