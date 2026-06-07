// Shared converter utilities for all converter pages.
(function () {
  function stripBom(value) {
    return String(value || "").replace(/^\uFEFF/, "");
  }

  function cleanText(value) {
    return stripBom(value)
      .replace(/\u00A0/g, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim();
  }

  function normalizeHeader(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeName(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function slug(value) {
    return normalizeName(value).replace(/ /g, "-") || "department";
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>\"]/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[char];
    });
  }

  function splitItems(value) {
    return cleanText(value)
      .split(/\r?\n|;|\||\u2022|(?:^|\s)\d+[.)]\s+/)
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    var source = stripBom(text);

    for (var i = 0; i < source.length; i += 1) {
      var char = source[i];
      var next = source[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(field);
        field = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(field);
        if (row.some(function (value) { return String(value).trim(); })) rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    row.push(field);
    if (row.some(function (value) { return String(value).trim(); })) rows.push(row);
    return rows;
  }

  function rowsFromFile(bufferOrText) {
    return new Promise(function (resolve) {
      if (typeof bufferOrText === "string") return resolve(parseCsv(bufferOrText));

      try {
        var bytes = new Uint8Array(bufferOrText.slice(0, 4));
        if (bytes[0] === 0x50 && bytes[1] === 0x4b && window.XLSX) {
          var workbook = XLSX.read(bufferOrText, { type: "array" });
          var preferredSheetName = workbook.SheetNames.find(function (sheetName) {
            return normalizeHeader(sheetName) === "budget";
          }) || workbook.SheetNames[0];

          if (!preferredSheetName || !workbook.Sheets[preferredSheetName]) {
            return resolve([]);
          }

          var rows = XLSX.utils.sheet_to_json(workbook.Sheets[preferredSheetName], {
            header: 1,
            defval: "",
            blankrows: false,
            raw: false
          });

          return resolve(rows.filter(function (row) {
            return Array.isArray(row) && row.some(function (cell) { return String(cell || "").trim(); });
          }));
        }
      } catch (error) {
        console.error("Excel parse failed", error);
      }

      try {
        return resolve(parseCsv(new TextDecoder("utf-8").decode(bufferOrText)));
      } catch (error) {
        console.error("CSV parse failed", error);
        return resolve([]);
      }
    });
  }

  function mapFields(headers, requiredColumns) {
    return Object.fromEntries(Object.entries(requiredColumns).map(function (pair) {
      var field = pair[0];
      var aliases = pair[1];
      var idx = headers.findIndex(function (header) {
        return aliases.some(function (alias) {
          return normalizeHeader(alias) === normalizeHeader(header);
        });
      });
      return [field, idx];
    }));
  }

  function parseMoney(value) {
    var raw = cleanText(value);
    if (!raw) return 0;
    var isNegative = /^\(.*\)$/.test(raw);
    var amount = Number(raw.replace(/[($,)]/g, "").replace(/\s+/g, "").trim()) || 0;
    return isNegative ? -amount : amount;
  }

  function parseNumber(value) {
    var raw = cleanText(value);
    if (!raw) return 0;
    var number = Number(raw.replace(/,/g, "").trim());
    return Number.isFinite(number) ? number : 0;
  }

  function jsAssign(name, value) {
    return "window." + name + " = " + JSON.stringify(value, null, 2) + ";\n";
  }

  window.converterUtils = {
    stripBom: stripBom,
    cleanText: cleanText,
    normalizeHeader: normalizeHeader,
    normalizeName: normalizeName,
    slug: slug,
    escapeHtml: escapeHtml,
    splitItems: splitItems,
    parseCsv: parseCsv,
    rowsFromFile: rowsFromFile,
    rowsFromBuffer: rowsFromFile,
    mapFields: mapFields,
    parseMoney: parseMoney,
    parseNumber: parseNumber,
    jsAssign: jsAssign
  };
}());
