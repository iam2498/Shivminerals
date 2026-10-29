// Paste in Google Sheet > Extensions > Apps Script. Deploy > Web app > Anyone.
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(d.sheet) || ss.insertSheet(d.sheet);
  sh.appendRow(d.row);
  return ContentService.createTextOutput('ok');
}
