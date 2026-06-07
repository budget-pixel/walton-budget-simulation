// Shared converter utilities for all converters
(function(){
  function normalizeHeader(value){
    return String(value||"").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function normalizeName(value){
    return String(value||"").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function slug(value){
    return normalizeName(value).replace(/ /g, "-") || "department";
  }
  function escapeHtml(value){
    return String(value||"").replace(/[&<>\"]/g, function(char){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[char];
    });
  }
  function splitItems(value){
    return String(value||"")
      .split(/\r?\n|;|\||\u2022|(?:^|\s)\d+[.)]\s+/)
      .map(function(item){ return item.trim(); })
      .filter(Boolean);
  }
  function parseCsv(text){
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    var source = String(text||"").replace(/^\uFEFF/, "");
    for(var i=0;i<source.length;i++){
      var char = source[i];
      var next = source[i+1];
      if(char === '"'){
        if(inQuotes && next === '"'){ field += '"'; i += 1; } else { inQuotes = !inQuotes; }
      } else if(char === ',' && !inQuotes){ row.push(field); field = ''; }
      else if((char === '\n' || char === '\r') && !inQuotes){ if(char === '\r' && next === '\n') i += 1; row.push(field); if(row.some(function(v){ return String(v).trim(); })) rows.push(row); row = []; field = ''; }
      else { field += char; }
    }
    row.push(field);
    if(row.some(function(v){ return String(v).trim(); })) rows.push(row);
    return rows;
  }
  function rowsFromFile(bufferOrText){
    return new Promise(function(resolve){
      if(typeof bufferOrText === 'string') return resolve(parseCsv(bufferOrText));
      try{
        var bytes = new Uint8Array(bufferOrText.slice(0,4));
        if(bytes[0] === 0x50 && bytes[1] === 0x4b && window.XLSX){
          var workbook = XLSX.read(bufferOrText, { type: 'array' });
          var bestRows = [];
          var bestScore = 0;
          workbook.SheetNames.forEach(function(sheetName){
            var rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', blankrows: false });
            rows.forEach(function(r, idx){
              var score = 0; // caller will map fields
              if(score > bestScore){ bestScore = score; bestRows = rows.slice(idx); }
            });
          });
          return resolve(bestRows);
        }
      }catch(e){}
      try{ resolve(parseCsv(new TextDecoder().decode(bufferOrText))); }catch(e){ resolve([]); }
    });
  }
  function mapFields(headers, requiredColumns){
    return Object.fromEntries(Object.entries(requiredColumns).map(function(pair){
      var field = pair[0], aliases = pair[1];
      var idx = headers.findIndex(function(header){
        return aliases.some(function(alias){ return normalizeHeader(alias) === normalizeHeader(header); });
      });
      return [field, idx];
    }));
  }
  function parseMoney(value){
    return Number(String(value||"").replace(/[$,]/g, "").trim()) || 0;
  }
  function jsAssign(name, value){
    return "window." + name + " = " + JSON.stringify(value, null, 2) + ";\n";
  }

  window.converterUtils = {
    normalizeHeader: normalizeHeader,
    normalizeName: normalizeName,
    slug: slug,
    escapeHtml: escapeHtml,
    splitItems: splitItems,
    parseCsv: parseCsv,
    rowsFromFile: rowsFromFile,
    mapFields: mapFields,
    parseMoney: parseMoney,
    jsAssign: jsAssign
  };
})();
