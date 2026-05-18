// Global constants
let date = new Date();
const banner_label = document.getElementById('banner_label');
const planning_table = document.getElementById('planning_table');
const layer = document.querySelector(".tooltip-layer");

const PROD_MODE = 0;
const RECEP_MODE = 1; 

// default the view to the production view
let view_mode = parseInt(getFromLocalStorage('view_mode') ? getFromLocalStorage('view_mode') : PROD_MODE);

if(view_mode === RECEP_MODE){
	document.getElementById('th_sap').style.display = "table-cell";
	document.getElementById('th_production').style.display = "table-cell";
} else {
	document.getElementById('th_sap').style.display = "none";
	document.getElementById('th_production').style.display = "none";
}

let isEditing = false;
let prev_text = "";

let total = 0;
let l1_counter = 0;
let l2_counter = 0;
let l3_counter = 0;
let bb_counter = 0;

let count = 0;

/*************************************************************************
* COOKIES: getter, setter and delete functions for cookies 
* Use only when using a server
*************************************************************************/
// extract a cookie
function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name){
		return decodeURIComponent(value);
	}
  }
  return null;
}

// set a cookie
function setCookie(name, value) {
  const days = 3;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();

  document.cookie = `${name}=${value}; ${expires}; SameSite=Lax; path=/U:/Quality%20Management%20KD%20Brugge/00_CODE/Planning.html;`;
}

// delete a cookie
function deleteCookie(name){
  document.cookie = `${name}=""; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; path=/U:/Quality%20Management%20KD%20Brugge/00_CODE/Planning.html;`;
}

/*************************************************************************
* Local storage: getter, setter and delete functions for local storage 
* Can be used without a server
*************************************************************************/
// extract a value
function getFromLocalStorage(name){
	return localStorage.getItem(name);
}

// set a value
function saveToLocalStorage(name, value){
	localStorage.setItem(name, value);
}

// delete a value
function deleteFromLocalStorage(name){
	localStorage.removeItem(name);
}


// change view
function changeView(){
  if(view_mode === PROD_MODE){
    view_mode = RECEP_MODE;
	document.getElementById('th_sap').style.display = "table-cell";
	document.getElementById('th_production').style.display = "table-cell";
  } else {
    view_mode = PROD_MODE;
	document.getElementById('th_sap').style.display = "none";
	document.getElementById('th_production').style.display = "none";
  }
  
  saveToLocalStorage("view_mode", view_mode);
  loadPlanning();
}

// increase date
function subDay(){
  date.setUTCDate(date.getDate() - 1);
  banner_label.innerHTML = "Planning " + date.toISOString().substring(0, 10);
  loadPlanning();
}

// decrease date
function addDay(){
  date.setUTCDate(date.getDate() + 1);
  banner_label.innerHTML = "Planning " + date.toISOString().substring(0, 10);
  loadPlanning();
}

// select date from a datepicker
function selectDay(){
  const picker = document.getElementById("datePicker");
  picker.showPicker();
  picker.addEventListener("change", () => {
    date = new Date(picker.value);
    banner_label.innerHTML = "Planning " + date.toISOString().substring(0, 10);
    loadPlanning();
  });
}

// adjust arrival confirmation
function incrementConfirmation(id, current_value){
  let new_value = 0;
  if( current_value < 2){
    new_value = current_value + 1;
  } else {
    new_value = 0;
  }
  fetch(`http://192.168.28.132:3000/arrconfirm/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({ new_value })
  })
  .then(res => res.json())
  .then(data => { loadPlanning(); })
  .catch(err => console.error(err));
}

// save production code
function save_production_code(id, new_value){
  // add leading zero if not typed and if string is not empty
  if(!String(new_value).startsWith(0) && String(new_value).trim() !== ""){
	  new_value = "0" + String(new_value).trim();
  }
  fetch(`http://192.168.28.132:3000/edit_prod/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({ new_value })
  })
  .then(res => res.json())
  .then(data => { loadPlanning(); })
  .catch(err => console.error(err));
}

// check time format
function check_time_format(value){
	
}

// save arrival time
function save_arrival(id, new_value){
  fetch(`http://192.168.28.132:3000/edit_arr/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({ new_value })
  })
  .then(res => res.json())
  .then(data => { loadPlanning(); })
  .catch(err => console.error(err));
}

// save departure time
function save_departure(id, new_value){
  fetch(`http://192.168.28.132:3000/edit_dep/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({ new_value })
  })
  .then(res => res.json())
  .then(data => { loadPlanning(); })
  .catch(err => console.error(err));
}

// load the data for the planning
async function loadPlanning(){	
  try{
    const response = await fetch(
      "http://192.168.28.132:3000/planning?date=" + encodeURIComponent(date.toISOString().substring(0, 10))
    );

    if(!response.ok) {
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
        .filter(row => row.arrival_time && row.arrival_confirmation === 0)
        .length;

      let transport = "";
      let transport_link = "";

      planning_table.innerHTML = "";
      data.map((row, i, arr) => {
        const tr = document.createElement("tr");
		if(view_mode === PROD_MODE){
		  tr.ondblclick = () => incrementConfirmation(row.idPlanning, row.arrival_confirmation);	
		}
        // set color of row (yellow = arrived, green = confirmed, blue = finished)
        if(row.arrival_time !== null){
          if(row.departure_time !== null){
            tr.style.color = "#6666";
          } else {
            if(row.arrival_confirmation === 0){
              tr.style.backgroundColor = "#FFFF55";  
            } else if(row.arrival_confirmation === 1){
              tr.style.backgroundColor = "#BBEEAAAA";  
            } else if(row.arrival_confirmation === 2){
              tr.style.backgroundColor = "#AACCFFAA";
            }
          }
        }
        // set empty rows between truck drivers
        if(transport){
          if(row.link_spriet){
            if(row.link_spriet === transport_link){
              transport = row.transport;
            } else {
              transport = row.transport;
              transport_link = row.link_spriet;
              const empty = document.createElement("tr");
              empty.style.backgroundColor = "#DDE5";
			  if(view_mode === PROD_MODE){
                empty.innerHTML = `<td colspan="12">&nbsp;</td>`;
			  } else {
				empty.innerHTML = `<td colspan="14">&nbsp;</td>`;
			  }
              planning_table.appendChild(empty);
            }
          } else {
            if( row.transport === transport){
              transport = row.transport;
            } else {
              transport = row.transport;
              transport_link = row.link_spriet;
              const empty = document.createElement("tr");
              empty.style.backgroundColor = "#DDE5";
              if(view_mode === PROD_MODE){
                empty.innerHTML = `<td colspan="12">&nbsp;</td>`;
			  } else {
				empty.innerHTML = `<td colspan="14">&nbsp;</td>`;
			  }
              planning_table.appendChild(empty);
            }
          }
        } else {
          transport = row.transport;
          if(row.link_spriet){
            transport_link = row.link_spriet;
          }
        }
        // create cells and apply extra styling if necessary
        td_expected = document.createElement("td");
        td_expected.innerHTML = row.expected_time ? String(row.expected_time).substring(0, 5) : "";
        td_line = document.createElement("td");
        td_line.innerHTML = row.line;
        td_transport = document.createElement("td");
        td_transport.innerHTML = row.transport;
        td_order = document.createElement("td");
        td_order.innerHTML = row.order_reference;
        td_customer = document.createElement("td");
        td_customer.innerHTML = row.customer;
        // if transport_id is the same as the previous or next row apply a red border to the cell
        if(i < arr.length-1){
          if(row.idPlanning === arr[i + 1].idPlanning){
            td_customer.style.borderLeft = "red 2px solid";
            td_customer.style.borderRight = "red 2px solid";
            if(i > 0){
              if(row.idPlanning !== arr[i - 1].idPlanning){
                td_customer.style.borderTop = "red 2px solid";
              } 
            } else {
              td_customer.style.borderTop = "red 2px solid";
            }
          }
        }
        if(i > 0){
          if(row.idPlanning === arr[i - 1].idPlanning){
            td_customer.style.borderLeft = "red 2px solid";
            td_customer.style.borderRight = "red 2px solid";
            if(i < arr.length-1){
              if(row.idPlanning !== arr[i + 1].idPlanning){
                td_customer.style.borderBottom = "red 2px solid";
              }
            } else {
              td_customer.style.borderBottom = "red 2px solid";
            }
          }
        }
        td_location = document.createElement("td");
        if(view_mode === PROD_MODE){
          td_location.innerHTML = row.location.replace(/^\d{4,5}\s+/, "").trim();
        } else {
          td_location.innerHTML = row.location.trim();
        }
        td_mixpro = document.createElement("td");
        td_mixpro.innerHTML = row.mixpro_code;
        td_mixpro.dataset.tip = "Verwachte densiteit " + row.density + " kg/EN-m³";
		td_sap = document.createElement("td");
		td_sap.innerHTML = row.sap_code;
        td_amount = document.createElement("td");
        td_amount.innerHTML = row.amount;
        td_op_remarks = document.createElement("td");
		if(String(row.op_remarks).toUpperCase().includes("BIO") && row.departure_time === null){
		  td_op_remarks.style.color = "#FF0000";
		  td_op_remarks.style.backgroundColor = "#FBB5";
		}
        td_op_remarks.innerHTML = row.op_remarks;
        td_time_remarks = document.createElement("td");
        td_time_remarks.innerHTML = row.time_remarks;
		// create production code cell
		if(view_mode === RECEP_MODE){
			td_production_code = document.createElement("td");
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
          if (e.key === "Enter"){
            e.preventDefault();
            save_production_code(el.getAttribute("idPlanning"), el.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape"){
            el.innerHTML = prev_text;
            isEditing = false;
          }
        });
		}
        // create arrival time cell
        td_arrival = document.createElement("td");
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
          if (e.key === "Enter"){
            e.preventDefault();
            save_arrival(el.getAttribute("idPlanning"), el.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape"){
            el.innerHTML = prev_text;
            isEditing = false;
          }
        });
        // create departure time cell
        td_departure = document.createElement("td");
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
          if (e.key === "Enter"){
            e.preventDefault();
            save_departure(el.getAttribute("idPlanning"), el.innerHTML.replace("<br>", ""));
            isEditing = false;
          } else if (e.key === "Escape"){
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
		if(view_mode === RECEP_MODE){
			tr.appendChild(td_sap);
		}
        tr.appendChild(td_amount);
        tr.appendChild(td_op_remarks);
        tr.appendChild(td_time_remarks);
		if(view_mode === RECEP_MODE){
			tr.appendChild(td_production_code);
		}
        tr.appendChild(td_arrival);
        tr.appendChild(td_departure);
        // add tooltip with density to row
        div = document.createElement("div");
        div.classList.add("tip");
		if(i >= data.length - 2){
		  div.style.top = "-170%";
		}
        div.innerHTML = "Verwachte densiteit " + row.density + " kg/EN-m³";
        td_mixpro.classList.add("tooltip");
        td_mixpro.appendChild(div);
        // append row to table
        planning_table.appendChild(tr);
        // count lines
        if(row.line == 1){
          l1_counter = l1_counter + 1;
        } else if(row.line == 2){
          l2_counter = l2_counter + 1;
        } else if(row.line == 3){
          l3_counter = l3_counter + 1;
        } else if(row.line === 'BB'){
          bb_counter = bb_counter + 1;
        } 
      });
    }
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}

function loop() {
  //console.log(new Date().toISOString());
  if(!isEditing){
    loadPlanning();
	
	if(count > 0){
		banner_label.classList.add("pulse");
	} else {
		banner_label.classList.remove("pulse");
	}
	
    banner_label.innerHTML = "Planning " + date.toISOString().substring(0, 10) + " <small>(<small>Totaal: " + total + 
      " => L1: " + l1_counter +
      " | L2: " + l2_counter +
      " | L3: " + l3_counter +
      " | BB: " + bb_counter +
      "</small>)</small>";
  }
  setTimeout(loop, 7500); // schedule next run
}

loop();