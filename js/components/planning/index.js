export const title = "KLA W32 - Productie Planning";

// Global constants
let date = new Date();
const banner_label = document.getElementById('banner_label');
const planning_table = document.getElementById('planning_table');
const layer = document.querySelector(".tooltip-layer");

const PROD_MODE = 0;
const RECEP_MODE = 1;

// default the view to the production view
let view_mode = parseInt(getFromLocalStorage('view_mode') ? getFromLocalStorage('view_mode') : PROD_MODE);

function init() {
    if (view_mode === RECEP_MODE) {
        document.getElementById('th_sap').style.display = "table-cell";
        document.getElementById('th_production').style.display = "table-cell";
    } else {
        document.getElementById('th_sap').style.display = "none";
        document.getElementById('th_production').style.display = "none";
    }
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
function changeView() {
    if (view_mode === PROD_MODE) {
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
function subDay() {
    date.setUTCDate(date.getDate() - 1);
    banner_label.innerHTML = "Planning " + date.toISOString().substring(0, 10);
    loadPlanning();
}

// decrease date
function addDay() {
    date.setUTCDate(date.getDate() + 1);
    banner_label.innerHTML = "Planning " + date.toISOString().substring(0, 10);
    loadPlanning();
}

// select date from a datepicker
function selectDay() {
    const picker = document.getElementById("datePicker");
    picker.showPicker();
    picker.addEventListener("change", () => {
        date = new Date(picker.value);
        banner_label.innerHTML = "Planning " + date.toISOString().substring(0, 10);
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



function getEyeButton() {
    return `<svg 
    id='view_mode_button' class='banner_button' title="Verander tabel" width="85mm" height="85mm" viewBox="0 0 85 85" xmlns="http://www.w3.org/2000/svg">
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
        <g id="layer1" onClick="changeView()">
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
      <div class='banner'>
        <button class='banner_button' onClick="subDay()" title="Vorige"><</button>
        <div class='banner_button drop_button' onclick="">&#128437;
		  <div class='drop_panel'>
		    <div class='drop_item'>Huidige Planning</div>
			<div class='drop_item'>Nieuwe Planning</div>
			<div class='drop_item'>Benodigdheden</div>
			<div class='drop_item'>Historiek</div>
		  </div>
		</div>
        <div id='banner_label' class='banner_label'>Productie Planning</div>
        ${getEyeButton()}
        <button class='banner_button' onClick="selectDay()" title="Selecteer datum" style="margin-left:0px; padding-left:0px;">&#128198;</button>
        <input type='date' id='datePicker' style='display: none;'>
        <button class='banner_button' onClick="addDay()" title="Volgende">></button>
      </div>
      <script>
  console.log("Inline JS works");
</script>
    </div>
  `;
}

export function destroy() { }