// ============================================================
//  code.gs — Sulekh Convent Public School
//  Google Apps Script Backend (CMS + Public API)
//  Version 2.0 — With image upload, date range circulars, fixes
//
//  SETUP:
//  1. Extensions → Apps Script → paste this file
//  2. Run setupSheets() ONCE
//  3. Deploy → New Deployment → Web App
//     Execute as: Me | Access: Anyone
//  4. Copy Web App URL → paste in cms-config.js
// ============================================================

const CONFIG = {
  SHEET_ID           : SpreadsheetApp.getActiveSpreadsheet().getId(),
  SECRET_KEY         : 'CHANGE_THIS_SECRET_KEY_12345',
  SESSION_EXPIRY_HOURS: 8,
  DRIVE_FOLDER_NAME  : 'SchoolCMS_Uploads',   // Google Drive folder for images
};

const SHEETS = {
  USERS              : 'users',
  SESSIONS           : 'sessions',
  SETTINGS           : 'settings',
  CONTENT_BLOCKS     : 'content_blocks',
  HOME_SLIDER        : 'home_slider',
  HOME_NEWS          : 'home_news',
  HOME_QUICKLINKS    : 'home_quicklinks',
  HOME_TOPPERS       : 'home_toppers',
  HOME_BIRTHDAYS     : 'home_birthdays',
  HOME_CIRCULARS     : 'home_circulars',
  HOME_DEPARTMENTS   : 'home_departments',
  HOME_GALLERY_PREVIEW:'home_gallery_preview',
  HOME_PARTNERS      : 'home_partners',
  TRAILBLAZERS       : 'trailblazers',
  VALUES_LIST        : 'values_list',
  POLICIES           : 'policies',
  SALIENT_FEATURES   : 'salient_features',
  CLUBS              : 'clubs',
  HOUSES             : 'houses',
  DISCIPLINE         : 'discipline',
  INFRA_ITEMS        : 'infra_items',
  ACADEMICS_LISTS    : 'academics_lists',
  ADMISSION_FEE      : 'admission_fee',
  ADMISSION_DOCS     : 'admission_docs',
  GALLERY_ALBUMS     : 'gallery_albums',
  GALLERY_VIDEOS     : 'gallery_videos',
  CAREER_CARDS       : 'career_cards',
  CAREER_RESOURCES   : 'career_resources',
  ENQUIRIES          : 'enquiries',
};

// ============================================================
//  ENTRY POINTS
// ============================================================

function doGet(e) {
  try {
    const action = e.parameter.action || '';
    const token  = e.parameter.token  || '';

    const PUBLIC_ACTIONS = [
      'get_settings','get_content','get_slider','get_news',
      'get_quicklinks','get_toppers','get_birthdays','get_circulars',
      'get_departments','get_gallery_preview','get_partners',
      'get_trailblazers','get_values','get_policies','get_salient',
      'get_clubs','get_houses','get_discipline','get_infra',
      'get_academics_lists','get_admission_fee','get_admission_docs',
      'get_gallery_albums','get_gallery_videos',
      'get_career_cards','get_career_resources',
    ];

    if (PUBLIC_ACTIONS.includes(action)) {
      return respond(handlePublicGet(action, e.parameter));
    }

    if (!token) return respond({ success:false, error:'Token required' });
    const user = validateSession(token);
    if (!user)  return respond({ success:false, error:'Invalid or expired session. Please login again.' });

    return respond(handlePrivateGet(action, e.parameter, user));
  } catch(err) {
    return respond({ success:false, error:err.message });
  }
}

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents || '{}');
    const action = body.action || '';
    const token  = body.token  || '';

    if (action === 'login')    return respond(handleLogin(body));
    if (action === 'enquiry')  return respond(handleEnquiry(body));
    if (action === 'upload_image') return respond(handleImageUpload(body));

    if (!token) return respond({ success:false, error:'Token required' });
    const user = validateSession(token);
    if (!user)  return respond({ success:false, error:'Invalid or expired session. Please login again.' });

    return respond(handlePrivatePost(action, body, user));
  } catch(err) {
    return respond({ success:false, error:err.message });
  }
}

// ============================================================
//  PUBLIC GET HANDLERS
// ============================================================

function handlePublicGet(action, params) {
  switch(action) {

    case 'get_settings':
      return { success:true, data: getSheetAsObject(SHEETS.SETTINGS) };

    case 'get_content': {
      const page    = params.page    || null;
      const section = params.section || null;
      return { success:true, data: getContentBlocks(page, section) };
    }

    case 'get_slider':
      return { success:true, data: getActiveRows(SHEETS.HOME_SLIDER) };

    case 'get_news':
      return { success:true, data: getActiveRows(SHEETS.HOME_NEWS) };

    case 'get_quicklinks':
      return { success:true, data: getAllRows(SHEETS.HOME_QUICKLINKS) };

    case 'get_toppers':
      return { success:true, data: getActiveRows(SHEETS.HOME_TOPPERS) };

    case 'get_birthdays': {
      const date = params.date || getTodayDDMM();
      return { success:true, data: getBirthdays(date) };
    }

    // ── Circulars: filter by date range ──
    case 'get_circulars': {
      const today = getTodayFormatted(); // DD-MM-YYYY
      const all   = getAllRows(SHEETS.HOME_CIRCULARS);
      const active = all.filter(r => {
        // Must be active
        if ((r.active || '').toUpperCase() !== 'YES') return false;
        // Check date range if both provided
        const start = r.start_date || '';
        const end   = r.end_date   || '';
        if (start && end) {
          return compareDDMMYYYY(today, start) >= 0 && compareDDMMYYYY(today, end) <= 0;
        }
        if (start) return compareDDMMYYYY(today, start) >= 0;
        if (end)   return compareDDMMYYYY(today, end)   <= 0;
        return true; // no date range = always show
      });
      return { success:true, data: active };
    }

    case 'get_departments':
      return { success:true, data: getAllRows(SHEETS.HOME_DEPARTMENTS) };

    case 'get_gallery_preview':
      return { success:true, data: getAllRows(SHEETS.HOME_GALLERY_PREVIEW) };

    case 'get_partners':
      return { success:true, data: getAllRows(SHEETS.HOME_PARTNERS) };

    case 'get_trailblazers':
      return { success:true, data: getAllRows(SHEETS.TRAILBLAZERS) };

    case 'get_values':
      return { success:true, data: getAllRows(SHEETS.VALUES_LIST) };

    case 'get_policies':
      return { success:true, data: getAllRows(SHEETS.POLICIES) };

    case 'get_salient':
      return { success:true, data: getAllRows(SHEETS.SALIENT_FEATURES) };

    case 'get_clubs': {
      const rows    = getAllRows(SHEETS.CLUBS);
      const grouped = { A:[], B:[], C:[] };
      rows.forEach(r => { if(grouped[r.group]) grouped[r.group].push(r); });
      return { success:true, data: grouped };
    }

    case 'get_houses':
      return { success:true, data: getAllRows(SHEETS.HOUSES) };

    case 'get_discipline': {
      const rows    = getAllRows(SHEETS.DISCIPLINE);
      const grouped = { timings:[], cards:[], rules:[] };
      rows.forEach(r => {
        const t = (r.type||'').toLowerCase();
        if(grouped[t]) grouped[t].push(r);
      });
      return { success:true, data: grouped };
    }

    case 'get_infra': {
      const section = params.section || null;
      const rows    = getAllRows(SHEETS.INFRA_ITEMS);
      const data    = section ? rows.filter(r => r.section_id === section) : rows;
      return { success:true, data };
    }

    case 'get_academics_lists': {
      const dept = params.dept || null;
      const rows = getAllRows(SHEETS.ACADEMICS_LISTS);
      const data = dept ? rows.filter(r => r.dept === dept) : rows;
      return { success:true, data };
    }

    case 'get_admission_fee':
      return {
        success:true,
        data: { fee_table: getAllRows(SHEETS.ADMISSION_FEE), docs: getActiveRows(SHEETS.ADMISSION_DOCS) }
      };

    case 'get_admission_docs':
      return { success:true, data: getActiveRows(SHEETS.ADMISSION_DOCS) };

    case 'get_gallery_albums':
      return { success:true, data: getActiveRows(SHEETS.GALLERY_ALBUMS) };

    case 'get_gallery_videos':
      return { success:true, data: getActiveRows(SHEETS.GALLERY_VIDEOS) };

    case 'get_career_cards':
      return { success:true, data: getActiveRows(SHEETS.CAREER_CARDS) };

    case 'get_career_resources':
      return { success:true, data: getActiveRows(SHEETS.CAREER_RESOURCES) };

    default:
      return { success:false, error:'Unknown action: '+action };
  }
}

// ============================================================
//  PRIVATE GET HANDLERS
// ============================================================

function handlePrivateGet(action, params, user) {
  switch(action) {

    case 'get_users':
      return { success:true, data: getAllRows(SHEETS.USERS).map(u => ({...u, password:'***'})) };

    case 'get_enquiries':
      return { success:true, data: getAllRows(SHEETS.ENQUIRIES) };

    case 'get_all_rows': {
      const sheet = params.sheet || '';
      if (!Object.values(SHEETS).includes(sheet)) return { success:false, error:'Invalid sheet name' };
      return { success:true, data: getAllRows(sheet) };
    }

    case 'get_row': {
      const sheet  = params.sheet      || '';
      const rowNum = parseInt(params.row_number || '0');
      if (!sheet || !rowNum) return { success:false, error:'sheet and row_number required' };
      return { success:true, data: getRow(sheet, rowNum) };
    }

    default:
      return { success:false, error:'Unknown action: '+action };
  }
}

// ============================================================
//  PRIVATE POST HANDLERS
// ============================================================

function handlePrivatePost(action, body, user) {
  switch(action) {

    case 'add_row': {
      const { sheet, data } = body;
      if (!sheet || !data) return { success:false, error:'sheet and data required' };
      if (!Object.values(SHEETS).includes(sheet)) return { success:false, error:'Invalid sheet' };
      // Auto timestamp
      if (data.created_at !== undefined || sheet === SHEETS.ENQUIRIES) {
        data.created_at = getNowFormatted();
      }
      addRow(sheet, data);
      return { success:true, message:'Row added' };
    }

    case 'update_row': {
      const { sheet, row_number, data } = body;
      if (!sheet || !row_number || !data) return { success:false, error:'sheet, row_number and data required' };
      if (!Object.values(SHEETS).includes(sheet)) return { success:false, error:'Invalid sheet' };
      updateRow(sheet, row_number, data);
      return { success:true, message:'Row updated' };
    }

    case 'delete_row': {
      const { sheet, row_number } = body;
      if (!sheet || !row_number) return { success:false, error:'sheet and row_number required' };
      if (!Object.values(SHEETS).includes(sheet)) return { success:false, error:'Invalid sheet' };
      deleteRow(sheet, row_number);
      return { success:true, message:'Row deleted' };
    }

    case 'toggle_active': {
      const { sheet, row_number, active } = body;
      if (!sheet || !row_number) return { success:false, error:'Missing params' };
      toggleActive(sheet, row_number, active);
      return { success:true, message:'Status updated' };
    }

    case 'reorder_rows': {
      const { sheet, ordered_ids } = body;
      if (!sheet || !ordered_ids) return { success:false, error:'sheet and ordered_ids required' };
      reorderRows(sheet, ordered_ids);
      return { success:true, message:'Rows reordered' };
    }

    case 'update_content': {
      const { page, section, field, value } = body;
      if (!page || !section || !field) return { success:false, error:'page, section, field required' };
      updateContentBlock(page, section, field, value || '');
      return { success:true, message:'Content updated' };
    }

    case 'update_setting': {
      const { field, value } = body;
      if (!field) return { success:false, error:'field required' };
      updateSetting(field, value || '');
      return { success:true, message:'Setting updated' };
    }

    case 'add_user': {
      const { name, email, username, password } = body;
      if (!name || !email || !username || !password)
        return { success:false, error:'name, email, username, password required' };
      const users = getAllRows(SHEETS.USERS);
      if (users.find(u => u.username === username))
        return { success:false, error:'Username already exists' };
      addRow(SHEETS.USERS, { sr_no: users.length+1, name, email, username, password });
      return { success:true, message:'User added' };
    }

    case 'delete_user': {
      const { row_number } = body;
      if (!row_number) return { success:false, error:'row_number required' };
      deleteRow(SHEETS.USERS, row_number);
      return { success:true, message:'User deleted' };
    }

    case 'change_password': {
      const { username, old_password, new_password } = body;
      const users   = getAllRows(SHEETS.USERS);
      const userRow = users.find(u => u.username === username && u.password === old_password);
      if (!userRow) return { success:false, error:'Invalid username or password' };
      updateRow(SHEETS.USERS, userRow._row_number, { password: new_password });
      return { success:true, message:'Password changed' };
    }

    case 'logout': {
      deleteSession(body.token);
      return { success:true, message:'Logged out' };
    }

    default:
      return { success:false, error:'Unknown action: '+action };
  }
}

// ============================================================
//  IMAGE UPLOAD TO GOOGLE DRIVE
// ============================================================

function handleImageUpload(body) {
  try {
    const { base64, filename, mimetype, token } = body;

    // Allow public upload OR authenticated
    if (token) {
      const user = validateSession(token);
      if (!user) return { success:false, error:'Invalid session' };
    }

    if (!base64 || !filename) return { success:false, error:'base64 and filename required' };

    // Get or create upload folder in Drive
    const folder = getOrCreateFolder(CONFIG.DRIVE_FOLDER_NAME);

    // Decode base64 and create file
    const decoded  = Utilities.base64Decode(base64);
    const blob     = Utilities.newBlob(decoded, mimetype || 'image/jpeg', filename);
    const file     = folder.createFile(blob);

    // Make file publicly accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Return direct view URL (works for images)
    const fileId  = file.getId();
    const viewUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;

    return { success:true, url: viewUrl, fileId, filename };
  } catch(err) {
    return { success:false, error:'Upload failed: ' + err.message };
  }
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

// ============================================================
//  AUTH
// ============================================================

function handleLogin(body) {
  const { username, password } = body;
  if (!username || !password) return { success:false, error:'Username and password required' };

  const users = getAllRows(SHEETS.USERS);
  const user  = users.find(u => u.username === username && u.password === password);
  if (!user) return { success:false, error:'Invalid username or password' };

  // Clean old sessions for this user first
  cleanUserSessions(username);

  const token   = Utilities.getUuid();
  const expires = new Date();
  expires.setHours(expires.getHours() + CONFIG.SESSION_EXPIRY_HOURS);

  addRow(SHEETS.SESSIONS, {
    token,
    username : user.username,
    name     : user.name,
    email    : user.email,
    expires  : expires.toISOString(),
    created  : new Date().toISOString(),
  });

  return {
    success : true,
    message : 'Login successful',
    token,
    user    : { name: user.name, email: user.email, username: user.username },
    expires : expires.toISOString(),
  };
}

function validateSession(token) {
  if (!token) return null;
  const sessions = getAllRows(SHEETS.SESSIONS);
  const session  = sessions.find(s => s.token === token);
  if (!session) return null;
  if (new Date(session.expires) < new Date()) {
    try { deleteRow(SHEETS.SESSIONS, session._row_number); } catch(e) {}
    return null;
  }
  return session;
}

function deleteSession(token) {
  const sessions = getAllRows(SHEETS.SESSIONS);
  const session  = sessions.find(s => s.token === token);
  if (session) try { deleteRow(SHEETS.SESSIONS, session._row_number); } catch(e) {}
}

function cleanUserSessions(username) {
  // Delete all old sessions for this user (reverse to avoid row shift)
  const sessions = getAllRows(SHEETS.SESSIONS);
  sessions.reverse().forEach(s => {
    if (s.username === username) {
      try { deleteRow(SHEETS.SESSIONS, s._row_number); } catch(e) {}
    }
  });
}

// ============================================================
//  ENQUIRY SUBMIT
// ============================================================

function handleEnquiry(body) {
  const { student_name, class: cls, parent_name, mobile, email, dob, message } = body;
  if (!student_name || !cls || !parent_name || !mobile)
    return { success:false, error:'Required fields missing' };

  const all  = getAllRows(SHEETS.ENQUIRIES);
  const srNo = all.length + 1;

  addRow(SHEETS.ENQUIRIES, {
    sr_no       : srNo,
    date        : getNowFormatted(),
    student_name,
    class       : cls,
    parent_name,
    mobile,
    email       : email   || '',
    dob         : dob     || '',
    message     : message || '',
    status      : 'New',
  });

  return { success:true, message:'Enquiry submitted successfully' };
}

// ============================================================
//  SHEET HELPERS
// ============================================================

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet not found: ' + sheetName);
  return sh;
}

function getAllRows(sheetName) {
  const sh   = getSheet(sheetName);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => h.toString().trim().toLowerCase().replace(/\s+/g,'_'));
  const rows    = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.every(c => c === '' || c === null)) continue;
    const obj = { _row_number: i+1 };
    headers.forEach((h,j) => { obj[h] = row[j] !== undefined ? row[j].toString() : ''; });
    rows.push(obj);
  }
  return rows;
}

function getActiveRows(sheetName) {
  return getAllRows(sheetName).filter(r => {
    if (!r.hasOwnProperty('active')) return true;
    return r.active.toString().toUpperCase() === 'YES';
  });
}

function getRow(sheetName, rowNumber) {
  const sh      = getSheet(sheetName);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/\s+/g,'_'));
  const rowData = sh.getRange(rowNumber,1,1,sh.getLastColumn()).getValues()[0];
  const obj     = { _row_number: rowNumber };
  headers.forEach((h,j) => { obj[h] = rowData[j] !== undefined ? rowData[j].toString() : ''; });
  return obj;
}

function getSheetAsObject(sheetName) {
  const rows = getAllRows(sheetName);
  const obj  = {};
  rows.forEach(r => { if(r.field) obj[r.field] = r.value || ''; });
  return obj;
}

function addRow(sheetName, data) {
  const sh      = getSheet(sheetName);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/\s+/g,'_'));
  const rowData = headers.map(h => data[h] !== undefined ? data[h] : '');
  sh.appendRow(rowData);
  return data;
}

function updateRow(sheetName, rowNumber, data) {
  const sh      = getSheet(sheetName);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/\s+/g,'_'));
  headers.forEach((h,j) => {
    if (data[h] !== undefined) sh.getRange(rowNumber, j+1).setValue(data[h]);
  });
}

function deleteRow(sheetName, rowNumber) {
  getSheet(sheetName).deleteRow(rowNumber);
}

function toggleActive(sheetName, rowNumber, active) {
  const sh      = getSheet(sheetName);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/\s+/g,'_'));
  const colIdx  = headers.indexOf('active');
  if (colIdx === -1) return;
  sh.getRange(rowNumber, colIdx+1).setValue(active ? 'YES' : 'NO');
}

function reorderRows(sheetName, orderedIds) {
  const sh      = getSheet(sheetName);
  const allRows = getAllRows(sheetName);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const srIdx   = headers.map(h => h.toString().toLowerCase()).indexOf('sr_no');

  const rowMap = {};
  allRows.forEach(r => { rowMap[r.sr_no] = r; });

  const lastRow = sh.getLastRow();
  if (lastRow > 1) sh.getRange(2,1,lastRow-1,sh.getLastColumn()).clearContent();

  orderedIds.forEach((id,i) => {
    const row = rowMap[id.toString()];
    if (!row) return;
    const headerKeys = headers.map(h => h.toString().trim().toLowerCase().replace(/\s+/g,'_'));
    const rowData    = headerKeys.map(h => row[h] || '');
    if (srIdx !== -1) rowData[srIdx] = i+1;
    sh.getRange(i+2,1,1,rowData.length).setValues([rowData]);
  });
}

function getContentBlocks(page, section) {
  const rows     = getAllRows(SHEETS.CONTENT_BLOCKS);
  let filtered   = rows;
  if (page)    filtered = filtered.filter(r => r.page    === page);
  if (section) filtered = filtered.filter(r => r.section === section);

  const result = {};
  filtered.forEach(r => {
    if (!result[r.section]) result[r.section] = {};
    result[r.section][r.field] = r.value;
  });
  return result;
}

function updateContentBlock(page, section, field, value) {
  const sh   = getSheet(SHEETS.CONTENT_BLOCKS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === page && data[i][1] === section && data[i][2] === field) {
      sh.getRange(i+1,4).setValue(value);
      return;
    }
  }
  sh.appendRow([page, section, field, value]);
}

function updateSetting(field, value) {
  const sh   = getSheet(SHEETS.SETTINGS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === field) { sh.getRange(i+1,2).setValue(value); return; }
  }
  sh.appendRow([field, value]);
}

function getBirthdays(ddmm) {
  return getAllRows(SHEETS.HOME_BIRTHDAYS).filter(r => r.date === ddmm);
}

// ── Date helpers ──
function getTodayDDMM() {
  const d  = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return dd + '-' + mm;
}

function getTodayFormatted() {
  const d  = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

function getNowFormatted() {
  const d  = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = d.getFullYear();
  const HH = String(d.getHours()).padStart(2,'0');
  const MM = String(d.getMinutes()).padStart(2,'0');
  const SS = String(d.getSeconds()).padStart(2,'0');
  return `${dd}-${mm}-${yy} ${HH}:${MM}:${SS}`;
}

// Compare DD-MM-YYYY dates: returns -1,0,1
function compareDDMMYYYY(a, b) {
  const parse = s => {
    const [dd,mm,yy] = s.split('-');
    return new Date(`${yy}-${mm}-${dd}`);
  };
  const da = parse(a), db = parse(b);
  if (da < db) return -1;
  if (da > db) return  1;
  return 0;
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  SETUP — Run ONCE to create all sheets
// ============================================================

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetsConfig = [
    { name: SHEETS.USERS,       headers: ['Sr No','Name','Email','Username','Password'] },
    { name: SHEETS.SESSIONS,    headers: ['Token','Username','Name','Email','Expires','Created'] },
    { name: SHEETS.SETTINGS,    headers: ['Field','Value'] },
    { name: SHEETS.CONTENT_BLOCKS, headers: ['Page','Section','Field','Value'] },
    { name: SHEETS.HOME_SLIDER, headers: ['Sr No','Title','Subtitle','Tag','Button1 Text','Button1 Link','Button2 Text','Button2 Link','BG Color','Image URL','Active'] },
    { name: SHEETS.HOME_NEWS,   headers: ['Sr No','News Text','Link URL','Active'] },
    { name: SHEETS.HOME_QUICKLINKS, headers: ['Sr No','Label','Icon','Link URL'] },
    { name: SHEETS.HOME_TOPPERS, headers: ['Sr No','Student Name','Class','Percentage','Photo URL','Year','Active'] },
    { name: SHEETS.HOME_BIRTHDAYS, headers: ['Sr No','Student Name','Class','Date'] },
    // ── CIRCULARS — Updated with description + date range ──
    { name: SHEETS.HOME_CIRCULARS, headers: ['Sr No','Title','Description','File URL','Date','Start Date','End Date','Active'] },
    { name: SHEETS.HOME_DEPARTMENTS, headers: ['Sr No','Dept Name','Short Desc','Link URL','BG Color','Image URL'] },
    { name: SHEETS.HOME_GALLERY_PREVIEW, headers: ['Sr No','Title','Image URL','Link URL'] },
    { name: SHEETS.HOME_PARTNERS, headers: ['Sr No','Name','Logo URL','Link URL'] },
    { name: SHEETS.TRAILBLAZERS, headers: ['Sr No','Name','Designation','Organization','Photo URL'] },
    { name: SHEETS.VALUES_LIST,  headers: ['Sr No','Value'] },
    { name: SHEETS.POLICIES,     headers: ['Sr No','Policy Name','Content'] },
    { name: SHEETS.SALIENT_FEATURES, headers: ['Sr No','Title','Content','Image URL'] },
    { name: SHEETS.CLUBS,        headers: ['Sr No','Group','Club Name','Active'] },
    { name: SHEETS.HOUSES,       headers: ['Sr No','House Name','Color','Active'] },
    { name: SHEETS.DISCIPLINE,   headers: ['Sr No','Type','Category','Content'] },
    { name: SHEETS.INFRA_ITEMS,  headers: ['Sr No','Section ID','Title','Content','Images'] },
    { name: SHEETS.ACADEMICS_LISTS, headers: ['Sr No','Dept','List Type','Item Text'] },
    { name: SHEETS.ADMISSION_FEE, headers: ['Sr No','Quarter','Month','Last Date'] },
    { name: SHEETS.ADMISSION_DOCS, headers: ['Sr No','Type','Title','File URL','Active'] },
    { name: SHEETS.GALLERY_ALBUMS, headers: ['Sr No','Album Title','Thumbnail URL','Images','Date','Active'] },
    { name: SHEETS.GALLERY_VIDEOS, headers: ['Sr No','Title','YouTube URL','Thumbnail URL','Active'] },
    { name: SHEETS.CAREER_CARDS,  headers: ['Sr No','Icon Name','Title','Content','Active'] },
    { name: SHEETS.CAREER_RESOURCES, headers: ['Sr No','Title','File URL','File Size','Active'] },
    { name: SHEETS.ENQUIRIES,    headers: ['Sr No','Date','Student Name','Class','Parent Name','Mobile','Email','DOB','Message','Status'] },
  ];

  sheetsConfig.forEach(cfg => {
    let sh = ss.getSheetByName(cfg.name);
    if (!sh) sh = ss.insertSheet(cfg.name);
    if (sh.getLastRow() === 0 || sh.getRange(1,1).getValue() === '') {
      const range = sh.getRange(1,1,1,cfg.headers.length);
      range.setValues([cfg.headers]);
      range.setBackground('#1a3a6b').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11);
    }
    sh.setFrozenRows(1);
  });

  seedDefaultData(ss);

  SpreadsheetApp.getUi().alert(
    '✅ Setup Complete!\n\n' +
    'Default admin:\nUsername: admin\nPassword: admin123\n\n' +
    '⚠️ Change the password immediately!'
  );
}

function seedDefaultData(ss) {
  const usersSh = ss.getSheetByName(SHEETS.USERS);
  if (usersSh.getLastRow() < 2)
    usersSh.appendRow([1,'Administrator','admin@sulekhschool.in','admin','admin123']);

  const settingsSh = ss.getSheetByName(SHEETS.SETTINGS);
  if (settingsSh.getLastRow() < 2) {
    [
      ['school_name','Sulekh Convent Public School'],
      ['tagline','Nurturing Excellence Since 1990'],
      ['phone','[Phone Number]'],
      ['email','[school@email.com]'],
      ['address','[School Address, City, State]'],
      ['website','www.sulekhconventschool.in'],
      ['facebook_url','#'],['twitter_url','#'],['youtube_url','#'],['linkedin_url','#'],
      ['erp_login_url','#'],['est_year','1990'],['map_embed_url',''],
    ].forEach(r => settingsSh.appendRow(r));
  }

  const sliderSh = ss.getSheetByName(SHEETS.HOME_SLIDER);
  if (sliderSh.getLastRow() < 2) {
    sliderSh.appendRow([1,'Sulekh Convent Public School','Nurturing Excellence · Building Character · Shaping Futures','Welcome to','Apply for Admission','admission.html','Learn More','about.html','#1a3a6b','','YES']);
    sliderSh.appendRow([2,'CBSE Affiliated Curriculum','Nursery to Class XII · Expert Faculty','Our Academics','Explore Academics','academics.html','','','#6b1a1a','','YES']);
    sliderSh.appendRow([3,'Modern Infrastructure','Smart Classes · Labs · Library · Sports','World-Class Facilities','View Infrastructure','infrastructure.html','','','#1a4a1a','','YES']);
  }

  const newsSh = ss.getSheetByName(SHEETS.HOME_NEWS);
  if (newsSh.getLastRow() < 2) {
    newsSh.appendRow([1,'🎓 Admission Open for Session 2025-26 (NUR to Grade XII)','admission.html','YES']);
    newsSh.appendRow([2,'🏆 Annual Day Celebration — A Grand Success!','','YES']);
  }

  const valSh = ss.getSheetByName(SHEETS.VALUES_LIST);
  if (valSh.getLastRow() < 2)
    ['Nationalism','Conservation of Environment','Compassion & Respect','Pursuit of Excellence','Honesty & Integrity']
      .forEach((v,i) => valSh.appendRow([i+1,v]));

  const hSh = ss.getSheetByName(SHEETS.HOUSES);
  if (hSh.getLastRow() < 2)
    [['Adinath House','#e53935'],['Saurabh House','#1e88e5'],['Parshvanath House','#43a047'],['Mahavir House','#fb8c00']]
      .forEach(([n,c],i) => hSh.appendRow([i+1,n,c,'YES']));

  const feeSh = ss.getSheetByName(SHEETS.ADMISSION_FEE);
  if (feeSh.getLastRow() < 2)
    [['I','April – June','April 20'],['II','July – September','July 20'],
     ['III','October – December','October 20'],['IV','January – March','January 20']]
      .forEach(([q,m,d],i) => feeSh.appendRow([i+1,q,m,d]));
}

function cleanExpiredSessions() {
  try {
    const sessions = getAllRows(SHEETS.SESSIONS);
    const now      = new Date();
    sessions.reverse().forEach(s => {
      if (new Date(s.expires) < now) try { deleteRow(SHEETS.SESSIONS, s._row_number); } catch(e) {}
    });
  } catch(e) { Logger.log('cleanExpiredSessions error: '+e.message); }
}

function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('cleanExpiredSessions').timeBased().everyDays(1).atHour(2).create();
  SpreadsheetApp.getUi().alert('✅ Triggers set up!');
}
