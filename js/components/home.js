export const title = "KLA W32 - Home";

export function render() {
  return `
    <h1>Welcome</h1>
    <p>Select a section:</p>

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
    window.location.hash = "#/products/phones";
  };

  root.querySelector("#btnLaptops").onclick = () => {
    window.location.hash = "#/products/laptops";
  };
}

export function destroy() {}
