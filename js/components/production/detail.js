let data;

let bulkTable;
let fertTable;
let liquidTable;
let otherTable

let bulkTBody;
let fertTBody;
let liquidTBody;
let otherTBody

async function loadData(id) {
    document.title = `LOADING... - ${id}`;

    try {
        const response = await fetch(
            `http://192.168.28.132:3000/production_sheet?id=${id}`
        );

        if (!response.ok) {
            console.error("HTTP ERROR:", response.status, response.statusText);
            throw new Error("Server returned " + response.status);
        } else {
            data = await response.json();
            document.title = `Productie - ${id}/${data[0].sap_code}`;
            fillInfo();
            fillTables();
        }
    } catch (err) {
        console.error("FETCH ERROR:", err);
        document.title = `ERROR - ${id}`;
        throw new Error("Server returned " + response.status);
    }
}

function fillInfo() {
    console.log(data[0]);
    document.getElementById("order").innerHTML = data[0].order_reference;
    document.getElementById("delivery").innerHTML = data[0].sap_delivery;
    document.getElementById("customer").innerHTML = data[0].customer;
    document.getElementById("recSAP").innerHTML = data[0].sap_code;
    document.getElementById("recMixPro").innerHTML = data[0].recipe_code;
    document.getElementById("recName").innerHTML = data[0].recipe_name;
    document.getElementById("volumeA").innerHTML = data[0].volume_requested + "0 EN-m³";
    document.getElementById("volumeK").innerHTML = data[0].volume_done + " m³";
    document.getElementById("volumeD").innerHTML = data[0].en_done + " EN-m³";
    document.getElementById("weightA").innerHTML = data[0].weight_requested + " ton";
    document.getElementById("weightD").innerHTML = data[0].weight_done + " ton";
    document.getElementById("density").innerHTML = data[0].density + " kg/EN-m³";
    document.getElementById("remarks").innerHTML = String(data[0].comments).replaceAll("$D$A", "<br>");
    document.getElementById("timeStart").innerHTML = dateTimeFormatter(data[0].time_start);
    document.getElementById("timeEnd").innerHTML = dateTimeFormatter(data[0].time_end);
    document.getElementById("measuredPH").innerHTML = data[0].measured_ph ? data[0].measured_ph : "N/B";
    document.getElementById("measuredEC").innerHTML = data[0].measured_ec ? data[0].measured_ec + " µS/cm" : "N/B";
    /* 
    // Not necesarry but possibility exists to add expected, arrival, departure and wait times to production sheets
    document.getElementById("timeExpected").innerHTML = data[0].expected_time ? timeFormatter(data[0].expected_time) : data[0].expected_time_var;
    document.getElementById("timeArrival").innerHTML = timeFormatter(data[0].arrival_time) + ` <span style="opacity: 25%;">(${timeToMinutes(data[0].time_diff_arr)} min)</span>`;
    document.getElementById("timeDeparture").innerHTML = timeFormatter(data[0].departure_time) + ` <span style="opacity: 25%;">(${timeToMinutes(data[0].time_diff_dep)} min)</span>`;
    document.getElementById("timeCompensation").innerHTML = data[0].order_reference;
    */
}

function fillTables() {

    let bCount = 0;
    let fCount = 0;
    let lCount = 0;
    let oCount = 0;

    bulkTBody.innerHTML = "";
    fertTBody.innerHTML = "";
    liquidTBody.innerHTML = "";
    otherTBody.innerHTML = "";

    data.map((row, i, arr) => {
        const tr = document.createElement("tr");

        let td_bunker = document.createElement("td");
        td_bunker.innerHTML = row.dosing_unit;
        let td_product = document.createElement("td");
        td_product.innerHTML = row.product_name;
        let td_setpoint = document.createElement("td");
        td_setpoint.innerHTML = row.dosing_preset;
        let td_avg = document.createElement("td");
        td_avg.innerHTML = row.dosing_done;
        let td_total = document.createElement("td");
        td_total.innerHTML = row.total_done;

        tr.appendChild(td_bunker);
        tr.appendChild(td_product);
        tr.appendChild(td_setpoint);
        tr.appendChild(td_avg);
        tr.appendChild(td_total);

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

    if(bCount === 0){
      bulkTable.style.display = "none";
    }
    if(fCount === 0){
      fertTable.style.display = "none";
    }
    if(lCount === 0){
      liquidTable.style.display = "none";
    }
    if(oCount === 0){
      otherTable.style.display = "none";
    }
}

function dateTimeFormatter(dateTimeStamp) {

    const formatter = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    return formatter.format(new Date(dateTimeStamp));
}

function timeFormatter(timeStamp) {
  return timeStamp.slice(0, 5);
}

function timeToMinutes(timeStamp) {
  let sign = 1;
  if (timeStamp.startsWith("-")){
    sign = -1;
    timeStamp = timeStamp.slice(1);
  }

  const [hours, minutes, seconds] = timeStamp.split(":").map(Number);
  return sign * (hours * 60 + minutes + (seconds ? seconds / 60 : 0));
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

    loadData(id);
}

export function destroy() {

}