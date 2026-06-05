export const title = "KLA W32 - Productie Planning - Geschiedenis";

let currentSize = parseInt(getFromLocalStorage('hist_size') ? getFromLocalStorage('hist_size') : 0);;
const sizes = ["#m3-btn", "#y1-btn", "#y2-btn", "#y3-btn", "#all-btn"];

let tableBody;
let data;
let filtered_data;

let activeEl;
let prev_text;
let isEditing = false;
let controller = null;

let sort_keys = []; // array of sort keys

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


// function to set data size
function setTableSize(root, size) {
  if (size !== currentSize) {
    root.querySelector(sizes[currentSize]).classList.toggle("active");
    root.querySelector(sizes[size]).classList.toggle("active");
    saveToLocalStorage('hist_size', size);
    currentSize = size;
    tableBody.innerHTML = `<tr><td colspan=13 rowspan=2 style="color: grey; height:2em;">Connecting and retrieving data from the Database ...</td></tr>`
    updateTable();
  }
}

// function to extract production codes and remove splitters
function normalizeProductionCodes(input) {
    // Extract numeric parts only
    const parts = input.match(/\d+/g);
    if (!parts || parts.length === 0) return [];

    const fullCodes = [];
    const base = parts[0];

    fullCodes.push(base);

    for (let i = 1; i < parts.length; i++) {
        let part = parts[i];

        // If shorter → append missing front digits
        if (part.length < base.length) {
            const prefix = base.slice(0, base.length - part.length);
            part = prefix + part;
        }

        fullCodes.push(part);
    }

    return fullCodes;
}


// function to set current Element that is edited
function setEditingElement() {
  activeEl = document.activeElement;
  prev_text = activeEl.innerHTML;
  isEditing = true;
}

// function to save edited delivery code
function saveDeliveryCode(id, value) {
  if (prev_text !== value) {
    fetch(`http://192.168.28.132:3000/edit_delivery_no/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value })
    })
      .then(res => res.json())
      .then(data => { console.log(`Delivery ${value} for ${id} saved to database.`); })
      .catch(err => console.error(err));
  } else {
    console.log("no change");
  }
}

// function to export the filtered and sorted data to an Excel file
async function exportXLSX() {
  const table = document.querySelector("table");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");

  // Extract headers + rows in compact form
  const headers = [...table.querySelectorAll("thead th")].map(th => th.innerText.trim());
  const rows = [...tableBody.querySelectorAll("tbody tr")].map(tr => {
    const cells = [...tr.querySelectorAll("td")];
    return cells.map(td => String(td.textContent ?? "").replace(/\s+/g, " ").trim());
  });

  // Add Excel Table directly
  sheet.addTable({
    name: "ResultTable",
    ref: "A1",
    headerRow: true,
    style: { theme: "TableStyleMedium9", showRowStripes: true },
    columns: headers.map(h => ({ name: h })),
    rows
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "results.xlsx";
  a.click();
}

// debounce function to delay input fields to allow for longer keystrokes before applying filters
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  }
}

function applyFilters() {
  filtered_data = data.filter(row => {
    const reference = (row.order_reference ?? "").toString().toLowerCase().includes(document.getElementById("ref-fld").value.toLowerCase());
    //const delivery = (row.sap_delivery ?? "").toString().toLowerCase().includes(document.getElementById("ref-fld").value.toLowerCase());
    const production_code = (row.production_code ?? "").toString().toLowerCase().includes(document.getElementById("prod-fld").value.toLowerCase());
    const customer = (row.customer ?? "").toString().toLowerCase().includes(document.getElementById("customer-fld").value.toLowerCase());
    const sap = (row.sap_code ?? "").toString().toLowerCase().includes(document.getElementById("sap-fld").value.toLowerCase());
    const mixpro = (row.mixpro_code ?? "").toString().toLowerCase().includes(document.getElementById("mixpro-fld").value.toLowerCase());
    const recipe_name = (row.recipe_name ?? "").toString().toLowerCase().includes(document.getElementById("rname-fld").value.toLowerCase());

    return reference && production_code && customer && sap && mixpro && recipe_name;
  });

  applySorting();
}

/* 
adds sort key to sort key array 
when the key is already present change it to the next value
start with ascending, followed by descending, followed by remove the sort key
*/
function setSortKey(i) {
  const el = document.querySelector(`[data-sort-key=${i}]`);
  let keys_found = sort_keys.filter((key, index) => key.name === i)
  if (keys_found.length > 0) {
    let asc = keys_found[0].asc;
    sort_keys = sort_keys.filter(key => key.name !== i);
    if (asc) {
      sort_keys.unshift({ 'name': i, 'asc': false });
      el.className = 'sort-desc-th';
    } else {
      el.className = 'sortable-th';
    }
  } else {
    sort_keys.unshift({ 'name': i, 'asc': true });
    el.className = 'sort-asc-th';
  }

  applySorting();
}

function applySorting() {
  let sorted_rows;
  if (sort_keys.length < 1) {
    drawTable(filtered_data);
  } else {
    let sorted_data = filtered_data.sort((a, b) => {
      for (const col of sort_keys) {
        let result;
        result = String(a[col.name]).localeCompare(String(b[col.name]));
        if (result !== 0) {
          return col.asc ? result : -result;
        }
      }
      return 0;
    });
    drawTable(sorted_data);
  }
}

function drawTable(data) {
  tableBody.innerHTML = "";
  data.map((row, i, arr) => {
    // create new row
    const tr = document.createElement("tr");

    // create cells
    let td_date = document.createElement("td");
    td_date.innerHTML = row.expected_date;
    let td_ref = document.createElement("td");
    td_ref.innerHTML = row.order_reference;
    let td_deli = document.createElement("td");
    td_deli.innerHTML = row.sap_delivery;
    td_deli.contentEditable = "true";
    td_deli.setAttribute("idProduction", row.production_code);
    td_deli.addEventListener("focusin", (e) => {
      setEditingElement();
    });
    td_deli.addEventListener("focusout", (e) => {
      saveDeliveryCode(activeEl.getAttribute("idProduction"), activeEl.innerHTML.replace("<br>", ""));
      isEditing = false;
    });
    td_deli.addEventListener('keydown', (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveDeliveryCode(activeEl.getAttribute("idProduction"), activeEl.innerHTML.replace("<br>", ""));
        isEditing = false;
      } else if (e.key === "Escape") {
        activeEl.innerHTML = prev_text;
        isEditing = false;
      }
    });
    let td_prod = document.createElement("td");
    let prod_link = document.createElement("a"); // create hyperlink to production sheet
    prod_link.innerHTML = row.production_code;
    prod_link.href = "#";
    prod_link.addEventListener("click", (e) => {
      e.preventDefault();
      const codes = normalizeProductionCodes(row.production_code);
      codes.forEach(code => {
        window.open(`#/production/detail/${code}`, "_blank", "noopener,noreferrer")
      })
    })
    prod_link.target = "_blank";
    prod_link.rel = "noopener noreferrer";
    td_prod.appendChild(prod_link);
    let td_customer = document.createElement("td");
    td_customer.innerHTML = row.customer;
    let td_mixpro = document.createElement("td");
    td_mixpro.innerHTML = row.mixpro_code;
    let td_sap = document.createElement("td");
    td_sap.innerHTML = row.sap_code;
    let td_recipe_name = document.createElement("td");
    td_recipe_name.innerHTML = row.recipe_name;
    let td_en_asked = document.createElement("td");
    td_en_asked.innerHTML = row.ordered_volume;
    let td_en_delivered = document.createElement("td");
    td_en_delivered.innerHTML = row.delivered_volume;
    let td_transport = document.createElement("td");
    td_transport.innerHTML = row.transport;
    let td_arrival = document.createElement("td");
    td_arrival.innerHTML = row.arrival_time;
    let td_departure = document.createElement("td");
    td_departure.innerHTML = row.departure_time;

    //append cells to row
    tr.appendChild(td_date);
    tr.appendChild(td_ref);
    tr.appendChild(td_deli);
    tr.appendChild(td_prod);
    tr.appendChild(td_customer);
    tr.appendChild(td_sap);
    tr.appendChild(td_mixpro);
    tr.appendChild(td_recipe_name);
    tr.appendChild(td_en_asked);
    tr.appendChild(td_en_delivered);
    tr.appendChild(td_transport);
    tr.appendChild(td_arrival);
    tr.appendChild(td_departure);

    // append row to table
    tableBody.appendChild(tr);
  });
}

async function updateTable() {
  try {

    if (controller) {
      controller.abort();
    }

    controller = new AbortController();
    const signal = controller.signal;

    const response = await fetch(
      `http://192.168.28.132:3000/planning_history/${currentSize}`,
      { signal }
    );

    if (!response.ok) {
      tableBody.innerHTML = `<tr>
            <td colspan=13 rowspan=2 style="color: orange; font-weight: 800; height:2em;">
              <u>HTTP ERROR</u><br>Server returned ${response.status}: ${response.statusText}
            </td>
          </tr>`
      throw new Error("Server returned " + response.status);
    } else {
      data = await response.json();
      applyFilters();
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Request cancelled");
    } else {
      console.error("FETCH ERROR:", err);
    }
  }
}

function getExcelSymbol() {

}

export function render() {
  return `
    <div class="banner">
      <div class="banner-btn drop-btn" onclick="">&#128437;
		    <div class="drop-panel">
		      <div id="curr-planning-btn" class="drop-item">Huidige Planning</div>
		      <div id="new-planning-btn" class="drop-item">Nieuwe Planning</div>
		      <div id="needed-supplies-btn" class="drop-item">Benodigdheden</div>
		      <div id="history-btn" class="drop-item" style="color:grey">Historiek</div>
		    </div>
		  </div>
      <div id="banner-label" class="banner-label">Productie Planning Historiek</div>
      <div id="m3-btn" class="banner-btn">3M</div>
      <div id="y1-btn" class="banner-btn">1Y</div>
      <div id="y2-btn" class="banner-btn">2Y</div>
      <div id="y3-btn" class="banner-btn">3Y</div>
      <div id="all-btn" class="banner-btn">ALL</div>
    </div>
    <div class="filters-container" >
      <h2 style="margin-bottom: 0.1em;">FILTERS</h2>
      <div class="horizontal-flex">
        <div class="search-container">
          <label for="ref-fld">Referentie</label>
          <input class='search-fld' type="text" placeholder="Referentie" id="ref-fld">
        </div>
        <div class="search-container">
          <label for="prod-fld">Productie code</label>
          <input class='search-fld' type="text" placeholder="Productie code" id="prod-fld">
        </div>
        <div class="search-container">
          <label for="customer-fld">Klantnaam</label>
          <input class='search-fld' type="text" placeholder="Klantnaam" id="customer-fld">
        </div>
        <div class="search-container">
          <label for="sap-fld">Recept SAP</label>
          <input class='search-fld' type="text" placeholder="Recept SAP" id="sap-fld">
        </div>
        <div class="search-container">
          <label for="mixpro-fld">Recept Mixpro</label>
          <input class='search-fld' type="text" placeholder="Recept MixPro" id="mixpro-fld">
        </div>
        <div class="search-container">
          <label for="rname-fld">Receptnaam</label>
          <input class='search-fld' type="text" placeholder="Recept omschrijving" id="rname-fld">
        </div>
        <input type="image" src="img/save_as_excel.svg" class="to-excel-btn" title="Export to Excel">
      </div>
    </div>
    <div style="height: 83vh;">
      <div class='table-container'>
        <table>
          <thead>
            <tr>
              <th class="sortable-th" data-sort-key="expected_date">Datum</th>
              <th class="sortable-th" data-sort-key="order_reference">Referentie</th>
              <th class="sortable-th" data-sort-key="sap_delivery">Levering</th>
              <th class="sortable-th" data-sort-key="production_code">Productie</th>
              <th class="sortable-th" data-sort-key="customer">Klant</th>
              <th class="sortable-th" data-sort-key="sap_code">SAP nr.</th>
              <th class="sortable-th" data-sort-key="mixpro_code">MixPro nr.</th>
              <th class="sortable-th" data-sort-key="recipe_name">Recept naam</th>
				      <th>EN-m³ Gepland</th>
              <th>EN-m³ Geladen</th>
              <th class="sortable-th" data-sort-key="transport">Transporteur</th>
              <th class="sortable-th" data-sort-key="arrival_time">Aankomst</th>
              <th class="sortable-th" data-sort-key="departure_time">Vertrek</th>
            </tr>
          </thead>
        <tbody id='table'>
          <tr>
            <td colspan=13 rowspan=2 style="color: grey; height:2em;">
              Connecting and retrieving data from the Database ...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `;
}


export function init(root) {

  tableBody = root.querySelector("#table");

  root.querySelector("#curr-planning-btn").onclick = () => { window.location.hash = "#/planning/"; };
  root.querySelector("#new-planning-btn").onclick = () => { window.location.hash = "#/planning/new"; };
  root.querySelector("#needed-supplies-btn").onclick = () => { window.location.hash = "#/planning/supplies"; };
  root.querySelector("#history-btn").onclick = () => { window.location.hash = "#/planning/history"; };

  root.querySelector(".to-excel-btn").onclick = () => { exportXLSX(); };

  root.querySelector(sizes[currentSize]).classList.toggle("active");
  root.querySelector("#m3-btn").onclick = e => { setTableSize(root, 0); };
  root.querySelector("#y1-btn").onclick = e => { setTableSize(root, 1); };
  root.querySelector("#y2-btn").onclick = e => { setTableSize(root, 2); };
  root.querySelector("#y3-btn").onclick = e => { setTableSize(root, 3); };
  root.querySelector("#all-btn").onclick = e => { setTableSize(root, 4); };

  const filters = root.querySelectorAll(".search-fld");
  filters.forEach(filter => {
    filter.addEventListener("input", debounce(applyFilters, 200));
  });

  const sorters = root.querySelectorAll(".sortable-th");
  sorters.forEach(sorter => {
    sorter.onclick = () => { setSortKey(sorter.dataset.sortKey); };
  });

  updateTable();
}

export function destroy() {

}