export const title = "KLA W32 - Startpagina";

function createWelcomeText(){
	return "Welcome";
}

export function render() {
  return `
    <h1 id="welcome">${createWelcomeText()}</h1>

    <button id="btnPlanning">Planning</button>
    <button id="btnStock">Stock Management</button>
    <button id="btnQuality">Quality Management</button>
    <button id="btnHarbor">
      <img src="img/harbor_safety_icon.svg" alt="Havenveiligheid Icon" style="height:12em;"/><br>
      <b>Havenveiligheid</b>
    </button>
  `;
}

export function init(root) {
  root.querySelector("#btnPlanning").onclick = () => {
    window.location.hash = "#/planning";
  };

  root.querySelector("#btnStock").onclick = () => {
    window.location.hash = "#/stock";
  };

  root.querySelector("#btnQuality").onclick = () => {
    window.location.hash = "#/";
  };

  root.querySelector("#btnHarbor").onclick = () => {
    window.location.hash = "#/security";
  }
}

export function destroy() {}
