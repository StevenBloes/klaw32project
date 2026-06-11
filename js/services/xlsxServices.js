import { extractTableData } from "../utils/tableUtils.js";

/**
 *  function to export the filtered and sorted data to an Excel file
 * @param fileName String
 */
export async function exportTableToXLSX(fileName="results", table) { 
  //const table = document.querySelector("table");
  
  // extract the HTML table headers and rows
  const { headers, rows } = extractTableData(table);

  // create the workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${fileName}`);

  // Add Excel Table directly
  sheet.addTable({
    name: "ResultTable",
    ref: "A1",
    headerRow: true,
    style: { theme: "TableStyleMedium9", showRowStripes: true },
    columns: headers.map(h => ({ name: h })),
    rows
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  /*
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName}.xlsx`;
  a.click();
  */
}