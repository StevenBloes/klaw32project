export const title = "KLA W32 - Checkpoints";

export function render(id) {
  return `
    <table>
      <thead>
        <tr>
          <th>Checkpoint</th>
          <th>SL</th>
          <th>Dagelijks</th>
          <th>Wekelijks</th>
          <th>Maandelijks</th>
          <th>Actief</th>
        </tr>
      </thead>
    </table>
  `;
}

export async function init(root, id) {

}

export function destroy() {

}