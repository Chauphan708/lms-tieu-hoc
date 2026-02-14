/**
 * LMS Tiểu Học - Google Apps Script Backend
 * 
 * HƯỚNG DẪN:
 * 1. Tạo Google Sheet mới, đặt tên: "LMS Tiểu Học"
 * 2. Tạo các sheet: HocSinh, MonHoc, BaiHoc, BaiTap, KetQuaLamBai, DiemThuong
 * 3. Vào Extensions > Apps Script, paste code này vào
 * 4. Deploy > New deployment > Web app > Anyone can access > Deploy
 * 5. Copy URL, paste vào mục Cài đặt trong app
 */

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;

    switch (data.action) {
      case 'login':
        result = login(data.username, data.password);
        break;
      case 'getStudents':
        result = getAll('HocSinh');
        break;
      case 'addStudent':
        result = addRow('HocSinh', data.student);
        break;
      case 'updateStudent':
        result = updateRow('HocSinh', data.student);
        break;
      case 'deleteStudent':
        result = deleteRow('HocSinh', data.id);
        break;
      case 'getSubjects':
        result = getAll('MonHoc');
        break;
      case 'addSubject':
        result = addRow('MonHoc', data.subject);
        break;
      case 'deleteSubject':
        result = deleteRow('MonHoc', data.id);
        break;
      case 'getLessons':
        result = getFiltered('BaiHoc', 'monHocId', data.monHocId);
        break;
      case 'addLesson':
        result = addRow('BaiHoc', data.lesson);
        break;
      case 'getExercises':
        result = getFiltered('BaiTap', 'baiHocId', data.baiHocId);
        break;
      case 'addExercise':
        result = addRow('BaiTap', data.exercise);
        break;
      case 'addExerciseBatch':
        result = data.exercises.map(ex => addRow('BaiTap', ex));
        break;
      case 'getResults':
        result = getFiltered('KetQuaLamBai', 'hocSinhId', data.hocSinhId);
        break;
      case 'saveResult':
        result = addRow('KetQuaLamBai', data.result);
        break;
      case 'getRewards':
        result = getFiltered('DiemThuong', 'hocSinhId', data.hocSinhId);
        break;
      case 'addReward':
        result = addRow('DiemThuong', data.reward);
        break;
      default:
        result = { error: 'Unknown action' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'LMS API OK' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Login ----
function login(username, password) {
  const sheet = getSheet('HocSinh');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userIdx = headers.indexOf('username');
  const passIdx = headers.indexOf('password');

  for (let i = 1; i < data.length; i++) {
    if (data[i][userIdx] === username && data[i][passIdx] === password) {
      const user = {};
      headers.forEach((h, j) => user[h] = data[i][j]);
      return { success: true, user };
    }
  }
  return { success: false };
}

// ---- Generic CRUD ----
function getAll(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getFiltered(sheetName, field, value) {
  const all = getAll(sheetName);
  return all.filter(item => item[field] === value);
}

function addRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (!obj.id) obj.id = Utilities.getUuid();
  const row = headers.map(h => {
    const val = obj[h];
    return typeof val === 'object' ? JSON.stringify(val) : (val || '');
  });
  sheet.appendRow(row);
  return { success: true, id: obj.id };
}

function updateRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === obj.id) {
      headers.forEach((h, j) => {
        if (obj[h] !== undefined) {
          const val = typeof obj[h] === 'object' ? JSON.stringify(obj[h]) : obj[h];
          sheet.getRange(i + 1, j + 1).setValue(val);
        }
      });
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const idIdx = data[0].indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}
