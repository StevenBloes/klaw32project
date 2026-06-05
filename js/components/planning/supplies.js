export const title = "KLA W32 - Productie Planning - Geschiedenis";


export function render() {
  return `
    <div class="banner">
      <div class="banner-btn drop-btn" onclick="">&#128437;
		    <div class="drop-panel">
		      <div id="curr-planning-btn" class="drop-item">Huidige Planning</div>
		      <div id="new-planning-btn" class="drop-item">Nieuwe Planning</div>
		      <div id="needed-supplies-btn" class="drop-item" style="color:grey">Benodigdheden</div>
		      <div id="history-btn" class="drop-item">Historiek</div>
		    </div>
		  </div>
      <div id='banner-label' class='banner-label'>Benodigde Producten</div>
    </div>
  `;
}


export function init(root) {
  root.querySelector("#curr-planning-btn").onclick = () => { window.location.hash = "#/planning/"; };
  root.querySelector("#new-planning-btn").onclick = () => { window.location.hash = "#/planning/new"; };
  root.querySelector("#needed-supplies-btn").onclick = () => { window.location.hash = "#/planning/supplies"; };
  root.querySelector("#history-btn").onclick = () => { window.location.hash = "#/planning/history"; };
}

export function destroy() {
  
}