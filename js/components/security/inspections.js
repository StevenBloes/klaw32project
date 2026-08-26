export const title = "KLA W32 - Inspecties";

export function render(id) {
  return `
    <div class="insp-row">
    <div>
    <h3 class="work-panel-title">Inspecties</h3>
    <div>filters</div>
    <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Datum</th>
          <th>Type</th>
          <th>Plaats</th>
          <th>Uitgevoerd door</th>
          <th>Functie</th>
          <th>Bevindingen</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>SIN_0006</td>
          <td>2026-08-26 13:36</td>
          <td>Dagelijkse</td>
          <td>Productiehal</td>
          <td>S. Bloes</td>
          <td>Kwaliteitsmedewerker</td>
          <td>0</td>
          <td>Voltooid</td>
        </tr>
        <tr>
          <td>SIN_0005</td>
          <td>2026-08-25 11:56</td>
          <td>Dagelijkse</td>
          <td>Volle Perimeter</td>
          <td>S. Bloes</td>
          <td>Kwaliteitsmedewerker</td>
          <td>1</td>
          <td>Voltooid</td>
        </tr>
        <tr>
          <td>SIN_0004</td>
          <td>2026-08-25 11:56</td>
          <td>Dagelijkse</td>
          <td>Volle Perimeter</td>
          <td>S. Bloes</td>
          <td>Kwaliteitsmedewerker</td>
          <td>0</td>
          <td>Voltooid</td>
        </tr>
      </tbody>
    </table>
    </div>
    </div>
    <div>
      <h3 class="work-panel-title">Inspectie Details</h3>
      <div class="insp-simple-details" style="display: flex; flex-direction: row; justify-content: space-between; width: 100%">
        <div style="display: grid; grid-template-columns: auto auto;">
          <div><b>ID</b></div><div>INS_0001</div>
          <div><b>Type</b></div><div>Dagelijks</div>
          <div><b>Datum</b></div><div>2026-08-26</div>
          <div><b>Uur</b></div><div>09:38</div>
        </div>
        <div style="display: grid; grid-template-columns: auto auto;">
          <div><b>Plaats</b></div><div>Productiehal</div>
          <div><b>Uitgevoerd door</b></div><div>S. Bloes</div>
          <div><b>Security Level</b></div><div>1</div>
        </div>
      </div>
    </div>
    </div>
  `;
}

export function init(root, id){

}

export function destroy(){

}
