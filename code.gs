// ════════════════════════════════════════════════
//  JUEGO DE MEMORIA — Code.gs
// ════════════════════════════════════════════════

var SHEET_ID = '1TTu5JMqkMq2K07CMHrZ3V9JtSkxoy47iXjHQJKG9r4'; 
var DRIVE_FOLDER_ID = '1bxFkVFg91UN215qnWtl_OqVPBxmri4FG'; 

var SHEET_NAME_RESULTS = 'Resultados';
var SHEET_NAME_CARDS   = 'Cartas';
function doGet() {
  return HtmlService
    .createTemplateFromFile('index')
    .evaluate()
    .setTitle('Juego de Memoria - San Isidro')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Permite incluir archivos HTML del proyecto (ej: javascript.html)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function uploadImageForm(formObject) {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var fileBlob = formObject.imageFile; 
    var file = folder.createFile(fileBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch(e) {
    throw new Error("Error al subir a Drive: " + e.message);
  }
}

function saveCards(pairs) {
  var ss = getSheet();
  var sheet = ss.getSheetByName(SHEET_NAME_CARDS);
  if (!sheet) { sheet = ss.insertSheet(SHEET_NAME_CARDS); } 
  else { sheet.clear(); }
  sheet.appendRow(['Concepto A','Concepto B','Imagen A (URL Drive)','Imagen B (URL Drive)']);
  var h = sheet.getRange(1,1,1,4);
  h.setFontWeight('bold').setBackground('#378ADD').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  if (pairs && pairs.length > 0) {
    var rowsToAppend = pairs.map(function(p){
      return [p.a||'', p.b||'', p.imgA||'', p.imgB||''];
    });
    sheet.getRange(2, 1, rowsToAppend.length, 4).setValues(rowsToAppend);
  }
}

function getCards() {
  var ss = getSheet();
  var sheet = ss.getSheetByName(SHEET_NAME_CARDS);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(function(row) {
    return { a: row[0]||'', b: row[1]||'', imgA: row[2]||null, imgB: row[3]||null };
  }).filter(function(p){ return p.a||p.b; });
}

function saveResult(nombre, movimientos, segundos, puntaje) {
  var ss = getSheet();
  var sheet = ss.getSheetByName(SHEET_NAME_RESULTS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_RESULTS);
    sheet.appendRow(['Fecha','Nombre','Movimientos','Segundos','Puntaje']);
    var h = sheet.getRange(1,1,1,5);
    h.setFontWeight('bold').setBackground('#1D9E75').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  var fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  sheet.appendRow([fecha, nombre, movimientos, segundos, puntaje]);
}

function getRanking() {
  var ss = getSheet();
  var sheet = ss.getSheetByName(SHEET_NAME_RESULTS);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var rows = data.slice(1).map(function(row){
    return { fecha: row[0]||'', nombre: row[1]||'', movimientos: Number(row[2])||0, segundos: Number(row[3])||0, puntaje: Number(row[4])||0 };
  });
  rows.sort(function(a,b){ return b.puntaje!==a.puntaje ? b.puntaje-a.puntaje : a.segundos-b.segundos; });
  return rows.slice(0,20);
}