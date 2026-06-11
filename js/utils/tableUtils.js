// Extract the headers and rows from a HTML table
export function extractTableData(table) {
  const headers = [...table.querySelectorAll("thead th")]
    .map(th => th.innerText.trim());

  const rows = [...table.querySelectorAll("tbody tr")].map(tr =>
    [...tr.querySelectorAll("td")]
      .map(td => String(td.textContent ?? "").replace(/\s+/g, " ").trim())
  );

  return { headers, rows };
}
