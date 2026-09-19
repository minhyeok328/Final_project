import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const outputPath = fileURLToPath(new URL("../../outputs/interface-definition/HumouR_인터페이스정의서.xlsx", import.meta.url));

async function main() {
  const input = await FileBlob.load(outputPath);
  const workbook = await SpreadsheetFile.importXlsx(input);

  const overview = await workbook.inspect({
    kind: "workbook,sheet,table",
    maxChars: 5000,
    tableMaxRows: 3,
    tableMaxCols: 5,
  });
  console.log(overview.ndjson);

  const list = await workbook.inspect({
    kind: "table",
    range: "인터페이스 목록!A6:M12",
    include: "values,formulas",
    tableMaxRows: 7,
    tableMaxCols: 13,
    maxChars: 5000,
  });
  console.log(list.ndjson);

  const screens = await workbook.inspect({
    kind: "table",
    range: "화면 정의!A6:M20",
    include: "values,formulas",
    tableMaxRows: 15,
    tableMaxCols: 13,
    maxChars: 7000,
  });
  console.log(screens.ndjson);

  const flow = await workbook.inspect({
    kind: "table",
    range: "사용자 플로우!A6:J20",
    include: "values,formulas",
    tableMaxRows: 15,
    tableMaxCols: 10,
    maxChars: 7000,
  });
  console.log(flow.ndjson);

  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: "formula/error string scan",
    maxChars: 4000,
  });
  console.log(errors.ndjson);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
