export const title = "KLA W32 - Havenveiligheid";

function highlightActiveNav(root) {
  const currentRoute = location.hash;

  root.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.route === currentRoute
    );
  });
}

export function render(id) {
  return `
    <div class="header">
	    <img class="header-logo" src="img/kd_logo_full.svg" />
	    <h1 class="header-text">Port Facility Security Planning<br>Manager</h1>
	  </div>
	  <div class="content">
	    <div class="nav-bar">
	      <div id="nav-dashboard-btn" class="nav-item active" data-route="#/security/">Dashboard</div>
	      <div id="nav-inspections-btn" class="nav-item" data-route="#/security/inspections">Inspecties</div>
	      <div id="nav-deviations-btn" class="nav-item" data-route="#/security/deviations">Bevindingen</div>
	      <div id="nav-actions-btn" class="nav-item" data-route="#/security/actions">Maatregelen</div>
	      <div id="nav-verifications-btn" class="nav-item" data-route="#/security/verifications">Verificaties</div>
		    <div id="nav-reports-btn" class="nav-item" data-route="#/security/reports">Rapporten</div>
	    </div>
	    <div class="main-panel">
        <div class="view" id="child-outlet">
          <h3 class="work-panel-title">Dashboard</h3>
		      <div class="dash-row">
		        <div id="dash-box-1" class="dash-row-item">
			        <div class="dash-row-item-content">
			          <div class="dash-row-item-img"></div>
			          <div>
				          <span class="dash-row-item-name">Uitgevoerde<br>Inspecties</span>
				          <br>
				          <span class="dash-row-item-counter">0</span>
				        </div>
			        </div>
			        <a href="#/security/inspections" class="nav-link">open lijst</a>
			      </div>
			      <div id="dash-box-2" class="dash-row-item">
			        <div class="dash-row-item-content">
			          <div class="dash-row-item-img"></div>
			          <div>
				          <span class="dash-row-item-name">Open<br>Bevindingen</span>
				          <br>
				          <span class="dash-row-item-counter">0</span>
				        </div>
			        </div>
			        <a href="#/security/deviations" class="nav-link">open lijst</a>
			      </div>
			      <div id="dash-box-3" class="dash-row-item">
			        <div class="dash-row-item-content">
			          <div class="dash-row-item-img"></div>
			          <div>
				          <span class="dash-row-item-name">Open<br>Maatregelen</span>
				          <br>
				          <span class="dash-row-item-counter">0</span>
				        </div>
			        </div>
			        <a href="#/security/actions" class="nav-link">open lijst</a>
			      </div>
			      <div id="dash-box-4" class="dash-row-item">
			        <div class="dash-row-item-content">
			          <div class="dash-row-item-img"></div>
			          <div>
			  	        <span class="dash-row-item-name">Open<br>Verificaties</span>
		  		        <br>
		  		        <span class="dash-row-item-counter">0</span>
		  		      </div>
		  	      </div>
	  		      <a href="#/security/verifications" class="nav-link">open lijst</a>
	  		    </div>
	  		    <div id="dash-box-5" class="dash-row-item">
	  		      <div class="dash-row-item-content">
  			        <div class="dash-row-item-img"></div>
			          <div>
				          <span class="dash-row-item-name">Afgesloten<br>Bevindingen</span>
				          <br>
				          <span class="dash-row-item-counter">0</span>
				        </div>
			        </div>
			        <a href="#/security/deviations" class="nav-link">open lijst</a>
			      </div>
		      </div>
		      <br>
		      <div class="dash-row">
		        <div class="dash-row-item">
		          <h3>Open non-conformities</h3>
			        col - CODE-1 - Omschrijving<br>
			        col - CODE-2 - Omschrijving<br>
			        col - CODE-3 - Omschrijving<br>
		        </div>
		        <div class="dash-row-item">
		          <h3>Lopende Acties</h3>
			        col - CODE-1 - Omschrijving<br>
			        col - CODE-2 - Omschrijving<br>
		        </div>
		        <div class="dash-row-item">
		          <h3>Recente aanpassingen</h3>
			        col - CODE-1 - Omschrijving<br>
			        col - CODE-2 - Omschrijving<br>
			      </div>
	        </div>
        </div>
	      <footer>
	        &#169; 2026 Klasmann-Deilmann Brugge. Alle rechten voorbehouden.
	        <br>
          Dit document is vertrouwelijk en wordt uitsluitend ter beschikking gesteld van bevoegde personen en instanties overeenkomstig de ISPS Code.
	      </footer>
	    </div>
    </div>
  `;
}

export function init(root, id) {
  root.querySelectorAll(".nav-item").forEach(item => {
    item.onclick = () => {
      window.location.hash = item.dataset.route;
    }
  });

  window.addEventListener("hashchange", () => {
    highlightActiveNav(root);
  });
}

export function destroy() {

}
