export const title = "KLA W32 - Startpagina";

function createWelcomeText(){
	return "Welcome";
}

export function render() {
  return `
    <h1 id="welcome">${createWelcomeText()}</h1>

    <button id="btnPlanning">Planning</button>
    <button id="btnPhones">Phones</button>
    <button id="btnLaptops">Laptops</button>
  `;
}

export function init(root) {
  root.querySelector("#btnPlanning").onclick = () => {
    window.location.hash = "#/planning";
  };

  root.querySelector("#btnPhones").onclick = () => {
    window.location.hash = "#/stock";
  };

  root.querySelector("#btnLaptops").onclick = () => {
    window.location.hash = "#/";
  };
}

export function destroy() {}
