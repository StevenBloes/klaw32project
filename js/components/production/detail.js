import * as dateTimeUtils from "../../utils/formatUtils.js";
import { callApi } from "../../services/apiCalls.js";
import { createTableCell } from "../table/tableCell.js"

let data;

let bulkTable;
let fertTable;
let liquidTable;
let otherTable

let bulkTBody;
let fertTBody;
let liquidTBody;
let otherTBody

async function loadData(id, root) {
  document.title = `LOADING... - ${id}`;

  try {
    data = await callApi("getProductionDetail", { params: id, body: {} });
    if (!data || data.length === 0) {
      return;
    } else {
      document.title = `Productie - ${id}/${data[0].sap_code}`;
      fillInfo(root);
      fillTables();
    }
  } catch (error) {
    console.error(error);
    document.title = `ERROR - ${id}`;
  }
}

function fillInfo(root) {
  root.querySelector("#order").textContent = data[0].order_reference;
  root.querySelector("#delivery").textContent = data[0].sap_delivery;
  root.querySelector("#customer").textContent = data[0].customer;
  root.querySelector("#recSAP").textContent = data[0].sap_code;
  root.querySelector("#recMixPro").textContent = data[0].recipe_code;
  root.querySelector("#recName").textContent = data[0].recipe_name;
  root.querySelector("#volumeA").textContent = data[0].volume_requested + "0 EN-m³";
  root.querySelector("#volumeK").textContent = data[0].volume_done + " m³";
  root.querySelector("#volumeD").textContent = data[0].en_done + " EN-m³";
  root.querySelector("#weightA").textContent = data[0].weight_requested + " ton";
  root.querySelector("#weightD").textContent = data[0].weight_done + " ton";
  root.querySelector("#density").textContent = data[0].density + " kg/EN-m³";
  root.querySelector("#remarks").innerHTML = String(data[0].comments).replaceAll("$D$A", "<br>");
  root.querySelector("#timeStart").textContent = dateTimeUtils.dateTimeFormatter(data[0].time_start);
  root.querySelector("#timeEnd").textContent = dateTimeUtils.dateTimeFormatter(data[0].time_end);
  root.querySelector("#measuredPH").textContent = data[0].measured_ph ? data[0].measured_ph : "N/B";
  root.querySelector("#measuredEC").textContent = data[0].measured_ec ? data[0].measured_ec + " µS/cm" : "N/B";
  root.querySelector("#timeExpected").textContent = data[0].expected_time ? dateTimeUtils.timeFormatter(data[0].expected_time) : data[0].expected_time_var;
  root.querySelector("#timeArrival").innerHTML = `${dateTimeUtils.timeFormatter(data[0].arrival_time)}&emsp;<span style="opacity: 40%; color: ${dateTimeUtils.timeToMinutes(data[0].time_diff_arr) > 0 ? "green" : "red"};">${dateTimeUtils.timeToMinutes(data[0].time_diff_arr)} min</span>`;
  root.querySelector("#timeDeparture").innerHTML = `${dateTimeUtils.timeFormatter(data[0].departure_time)}&emsp;<span style="opacity: 40%; color: ${dateTimeUtils.timeToMinutes(data[0].time_diff_dep) < 120 ? "green" : "red"};">${dateTimeUtils.timeToMinutes(data[0].time_diff_dep)} min</span>`;
  root.querySelector("#timeCompensation").textContent = data[0].expected_time ? dateTimeUtils.timeFormatter(data[0].expected_time) : "0 min";
}

function createRow(row) {
  const tr = document.createElement("tr");
  tr.appendChild(createTableCell(row.dosing_unit));
  tr.appendChild(createTableCell(row.product_name));
  tr.appendChild(createTableCell(row.dosing_preset));
  tr.appendChild(createTableCell(row.dosing_done));
  tr.appendChild(createTableCell(row.total_done));

  return tr;
}

function fillTables() {

  let bCount = 0;
  let fCount = 0;
  let lCount = 0;
  let oCount = 0;

  bulkTBody.textContent = "";
  fertTBody.textContent = "";
  liquidTBody.textContent = "";
  otherTBody.textContent = "";

  data.forEach(row => {
    const tr = createRow(row);

    if (row.product_group === "bulk") {
      bulkTBody.appendChild(tr);
      bCount = bCount + 1;
    } else if (row.product_group === "fertilizer") {
      fertTBody.appendChild(tr);
      fCount = fCount + 1;
    } else if (row.product_group === "liquid") {
      liquidTBody.appendChild(tr);
      lCount = lCount + 1;
    } else {
      otherTBody.appendChild(tr);
      oCount = oCount + 1;
    }
  });

  if (bCount === 0) {
    bulkTable.style.display = "none";
  }
  if (fCount === 0) {
    fertTable.style.display = "none";
  }
  if (lCount === 0) {
    liquidTable.style.display = "none";
  }
  if (oCount === 0) {
    otherTable.style.display = "none";
  }
}

export function render(id) {
  return `
    <div class="detail-layout">
    <div class="table-container detail-layout-left">
    <h2>Productie info</h2>
    <div class="info-row">
      <div class="info-item">Bestelling n°:</div>
      <div id="order"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Levering n°:</div>
      <div id="delivery"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Batch n°:</div>
      <div>${id}</div>
    </div>
    <br>
    <div class="info-row">
      <div class="info-item">Klant:</div>
      <div id="customer"></div>
    </div>
    <br>
    <div class="info-row">
      <div class="info-item">Recept SAP:</div>
      <div id="recSAP"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Recept MixPro:</div>
      <div id="recMixPro"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Receptomschrijving:</div>
      <div id="recName"></div>
    </div>
    <br>
    <div class="info-row">
      <div class="info-item">Gewenst volume:</div>
      <div id="volumeA"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Kalibratiemaat:</div>
      <div id="volumeK"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Geproduceerd volume:</div>
      <div id="volumeD" class="highlight-yellow"></div>
    </div>
    <br>
    <div class="info-row">
      <div class="info-item">Gewenst tonnage:</div>
      <div id="weightA"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Geproduceerd tonnage:</div>
      <div id="weightD"></div>
    </div>
    <br>
    <div class="info-row">
      <div class="info-item">Soortelijke massa:</div>
      <div id="density"></div>
    </div>
    <br>
    <div class="info-row">
      <div class="info-item">Opmerkingen:</div>
      <div id="remarks"></div>
    </div>
    <br>
    <div class="info-row">
      <div class="info-item">Productie start:</div>
      <div id="timeStart"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Productie einde:</div>
      <div id="timeEnd"></div>
    </div>
    <div style="display: none;">
    <br>
    <div class="info-row">
      <div class="info-item">Verwachte uur:</div>
      <div id="timeExpected"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Aankomst uur:</div>
      <div id="timeArrival"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Vertrek uur:</div>
      <div id="timeDeparture"></div>
    </div>
    <div class="info-row">
      <div class="info-item">Wachttijd: <span>(?)</span></div>
      <div id="timeCompensation"></div>
    </div>
    </div>
    </div>
    <div class="detail-layout-right">
    <div  class="table-container detail-layout-inner">
    <h2 style="width: 98%;">
      Doseringen 
      <span style="font-size: 0.8em; border: solid black 1px; border-radius: 2px; padding: 0em 1em; float: right;">
        Lijn ${String(id).charAt(1)}
      </span>
    </h2>
    <div id="bulk-table" class="table-container" style="width: 98%; margin-bottom: 1em;">
      <table>
        <thead>
          <tr><th colspan="5" style="background: #F5E9AE; color: #111111;">Grondstoffen</th></tr>
          <tr>
            <th style="background: #FCF7DE; color: #111111;">Bunker</th>
            <th style="background: #FCF7DE; color: #111111;">Productnaam</th>
            <th style="background: #FCF7DE; color: #111111;">Setpoint</th>
            <th style="background: #FCF7DE; color: #111111;">Gemiddelde</th>
            <th style="background: #FCF7DE; color: #111111;">Totaal</th>
          </tr>
        </thead>
        <tbody id="bulk-tbody"></tbody>
      </table>
    </div>
    <div id="fertilizer-table" class="table-container" style="width: 98%; margin-bottom: 1em;">
      <table>
        <thead>
          <tr><th colspan="5" style="background: #C0F0C0; color: #111111;">Meststoffen/Additieven</th></tr>
          <tr>
            <th style="background: #DEFDE0; color: #111111;">Bunker</th>
            <th style="background: #DEFDE0; color: #111111;">Productnaam</th>
            <th style="background: #DEFDE0; color: #111111;">Setpoint</th>
            <th style="background: #DEFDE0; color: #111111;">Gemiddelde</th>
            <th style="background: #DEFDE0; color: #111111;">Totaal</th>
          </tr>
        </thead>
        <tbody id="fertilizer-tbody"></tbody>
      </table>
    </div>
    <div id="liquid-table" class="table-container" style="width: 98%; margin-bottom: 1em;">
      <table>
        <thead>
          <tr><th colspan="5" style="background: #D0E0FF; color: #111111;">Vloeistoffen</th></tr>
          <tr>
            <th style="background: #DFEFFF; color: #111111;">Bunker</th>
            <th style="background: #DFEFFF; color: #111111;">Productnaam</th>
            <th style="background: #DFEFFF; color: #111111;">Setpoint</th>
            <th style="background: #DFEFFF; color: #111111;">Gemiddelde</th>
            <th style="background: #DFEFFF; color: #111111;">Totaal</th>
          </tr>
        </thead>
        <tbody id="liquid-tbody"></tbody>
      </table>
    </div>
    <div id="other-table" class="table-container" style="width: 98%; margin-bottom: 1em;">
      <table>
        <thead>
          <tr><th colspan="5" style="background: #FFD0DF; color: #111111;">Andere</th></tr>
          <tr>
            <th style="background: #FFE0E0; color: #111111;">Bunker</th>
            <th style="background: #FFE0E0; color: #111111;">Productnaam</th>
            <th style="background: #FFE0E0; color: #111111;">Setpoint</th>
            <th style="background: #FFE0E0; color: #111111;">Gemiddelde</th>
            <th style="background: #FFE0E0; color: #111111;">Totaal</th>
          </tr>
        </thead>
        <tbody id="other-tbody"></tbody>
      </table>
    </div>
    </div>
    <div class="table-container detail-layout-inner" style="margin-top: 0.5em;">
    <h2>Metingen</h2>
    <div class="info-row">
      <div class="info-item" style="min-width: 6em;">Gemeten pH:</div>
      <div id="measuredPH"></div>
    </div>
    <div class="info-row">
      <div class="info-item" style="min-width: 6em;">Gemeten EC:</div>
      <div id="measuredEC"></div>
    </div>
    </div>
    </div>
    </div>
  `;
}

export function init(root, id) {
  bulkTable = root.querySelector("#bulk-table");
  fertTable = root.querySelector("#fertilizer-table");
  liquidTable = root.querySelector("#liquid-table");
  otherTable = root.querySelector("#other-table");

  bulkTBody = root.querySelector("#bulk-tbody");
  fertTBody = root.querySelector("#fertilizer-tbody");
  liquidTBody = root.querySelector("#liquid-tbody");
  otherTBody = root.querySelector("#other-tbody");

  loadData(id, root);
}

export function destroy() {

}