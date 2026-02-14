/* ============================================
   API Module - Supabase Integration
   ============================================ */

const API = (() => {
  let SUPABASE_URL = localStorage.getItem('lms_supabase_url') || '';
  let SUPABASE_KEY = localStorage.getItem('lms_supabase_key') || '';
  let GEMINI_API_KEY = localStorage.getItem('lms_gemini_key') || '';
  let supabase = null;

  // ---- Initialize Supabase client ----
  const initSupabase = () => {
    if (SUPABASE_URL && SUPABASE_KEY && typeof window.supabase !== 'undefined') {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return true;
    }
    return false;
  };

  const isConnected = () => !!supabase;

  // ---- Generic CRUD ----
  const getAll = async (table) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).select('*');
    if (error) { console.error(`getAll ${table}:`, error); return null; }
    return data;
  };

  const getWhere = async (table, column, value) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).select('*').eq(column, value);
    if (error) { console.error(`getWhere ${table}:`, error); return null; }
    return data;
  };

  const insert = async (table, obj) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).insert(obj).select();
    if (error) { console.error(`insert ${table}:`, error); return null; }
    return data?.[0] || null;
  };

  const update = async (table, id, obj) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).update(obj).eq('id', id).select();
    if (error) { console.error(`update ${table}:`, error); return null; }
    return data?.[0] || null;
  };

  const remove = async (table, id) => {
    if (!supabase) return null;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { console.error(`delete ${table}:`, error); return null; }
    return true;
  };

  // ---- Login ----
  const login = async (username, password) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    if (error || !data) return null;
    return mapUser(data);
  };

  // ---- Data mappers (DB snake_case → JS camelCase) ----
  const mapUser = (u) => ({
    id: u.id, hoTen: u.ho_ten, username: u.username, password: u.password,
    role: u.role, avatar: u.avatar, lop: u.lop
  });

  const mapSubject = (s) => ({
    id: s.id, tenMon: s.ten_mon, moTa: s.mo_ta, icon: s.icon, mauSac: s.mau_sac
  });

  const mapLesson = (l) => ({
    id: l.id, monHocId: l.mon_hoc_id, classId: l.class_id, tieuDe: l.tieu_de,
    noiDung: l.noi_dung, thuTu: l.thu_tu
  });

  const mapExercise = (e) => ({
    id: e.id, baiHocId: e.bai_hoc_id, dang: e.dang, cauHoi: e.cau_hoi,
    hinhAnh: e.hinh_anh || '', diem: e.diem, duLieu: e.du_lieu || {}
  });

  const mapResult = (r) => ({
    id: r.id, hocSinhId: r.hoc_sinh_id, baiTapId: r.bai_tap_id, assignmentId: r.assignment_id,
    cauTraLoi: r.cau_tra_loi, dungSai: r.dung_sai, diemDat: r.diem_dat,
    thoiGianLam: r.thoi_gian_lam, ngayLam: r.ngay_lam, cauHoi: r.cau_hoi, dang: r.dang
  });

  const mapReward = (r) => ({
    id: r.id, hocSinhId: r.hoc_sinh_id, loai: r.loai, giaTri: r.gia_tri,
    moTa: r.mo_ta, ngayNhan: r.ngay_nhan
  });

  const mapAssignment = (a) => ({
    id: a.id, tieuDe: a.tieu_de, baiHocId: a.bai_hoc_id, classId: a.class_id,
    giaoVienId: a.giao_vien_id, exerciseIds: a.exercise_ids || [],
    batDau: a.bat_dau, ketThuc: a.ket_thuc, soLanLamLai: a.so_lan_lam_lai,
    cheDoXem: a.che_do_xem, trangThai: a.trang_thai, maLink: a.ma_link
  });

  const mapSchoolYear = (y) => ({
    id: y.id, ten: y.ten, batDau: y.bat_dau, ketThuc: y.ket_thuc, trangThai: y.trang_thai
  });

  const mapClass = (c) => ({
    id: c.id, tenLop: c.ten_lop, giaoVienId: c.giao_vien_id,
    namHocId: c.nam_hoc_id, moTa: c.mo_ta
  });

  const mapClassStudent = (cs) => ({
    id: cs.id, classId: cs.class_id, studentId: cs.student_id
  });

  // ---- Mappers: Honors ----
  const mapHonor = (h) => ({
    id: h.id, hocSinhId: h.hoc_sinh_id, tieuDe: h.tieu_de,
    lyDo: h.ly_do || '', loai: h.loai, thoiGian: h.thoi_gian,
    createdBy: h.created_by
  });

  // ---- Mappers: Posts & Comments ----
  const mapPost = (p) => ({
    id: p.id, tieuDe: p.tieu_de, noiDung: p.noi_dung,
    tacGiaId: p.tac_gia_id, loai: p.loai, ghim: p.ghim,
    createdAt: p.created_at
  });

  const mapComment = (c) => ({
    id: c.id, postId: c.post_id, tacGiaId: c.tac_gia_id,
    noiDung: c.noi_dung, createdAt: c.created_at
  });

  // ---- Reverse mappers (JS → DB) ----
  const toDbUser = (u) => ({
    ho_ten: u.hoTen, username: u.username, password: u.password,
    role: u.role || 'hs', avatar: u.avatar || '😊', lop: u.lop || ''
  });

  const toDbSubject = (s) => ({
    ten_mon: s.tenMon, mo_ta: s.moTa || '', icon: s.icon || '📚', mau_sac: s.mauSac || '#6C5CE7'
  });

  const toDbLesson = (l) => ({
    mon_hoc_id: l.monHocId, class_id: l.classId || null,
    tieu_de: l.tieuDe, noi_dung: l.noiDung || '', thu_tu: l.thuTu || 0
  });

  const toDbExercise = (e) => ({
    bai_hoc_id: e.baiHocId, dang: e.dang, cau_hoi: e.cauHoi,
    hinh_anh: e.hinhAnh || '', diem: e.diem || 10, du_lieu: e.duLieu || {}
  });

  const toDbResult = (r) => ({
    hoc_sinh_id: r.hocSinhId, bai_tap_id: r.baiTapId || null, assignment_id: r.assignmentId || null,
    cau_tra_loi: r.cauTraLoi || '', dung_sai: r.dungSai || false, diem_dat: r.diemDat || 0,
    thoi_gian_lam: r.thoiGianLam || 0, ngay_lam: r.ngayLam || new Date().toISOString().split('T')[0],
    cau_hoi: r.cauHoi || '', dang: r.dang || ''
  });

  const toDbAssignment = (a) => ({
    tieu_de: a.tieuDe, bai_hoc_id: a.baiHocId, class_id: a.classId || null,
    giao_vien_id: a.giaoVienId || null, exercise_ids: a.exerciseIds || [],
    bat_dau: a.batDau, ket_thuc: a.ketThuc || null, so_lan_lam_lai: a.soLanLamLai || 1,
    che_do_xem: a.cheDoXem || 'dung-sai-dap-an', trang_thai: a.trangThai || 'active',
    ma_link: a.maLink
  });

  const toDbSchoolYear = (y) => ({
    ten: y.ten, bat_dau: y.batDau || null, ket_thuc: y.ketThuc || null,
    trang_thai: y.trangThai || 'active'
  });

  const toDbClass = (c) => ({
    ten_lop: c.tenLop, giao_vien_id: c.giaoVienId || null,
    nam_hoc_id: c.namHocId || null, mo_ta: c.moTa || ''
  });

  const toDbHonor = (h) => ({
    hoc_sinh_id: h.hocSinhId, tieu_de: h.tieuDe,
    ly_do: h.lyDo || '', loai: h.loai || 'tuan',
    thoi_gian: h.thoiGian || new Date().toISOString().split('T')[0],
    created_by: h.createdBy || null
  });

  const toDbPost = (p) => ({
    tieu_de: p.tieuDe, noi_dung: p.noiDung,
    tac_gia_id: p.tacGiaId, loai: p.loai || 'thong-bao',
    ghim: p.ghim || false
  });

  const toDbComment = (c) => ({
    post_id: c.postId, tac_gia_id: c.tacGiaId,
    noi_dung: c.noiDung
  });

  // ---- Load all data from Supabase ----
  const loadAllData = async () => {
    if (!supabase) return null;
    try {
      const [users, subjects, lessons, exercises, results, rewards, assignments, schoolYears, classes, classStudents, honors, posts, comments] = await Promise.all([
        getAll('users'), getAll('subjects'), getAll('lessons'),
        getAll('exercises'), getAll('results'), getAll('rewards'), getAll('assignments'),
        getAll('school_years'), getAll('classes'), getAll('class_students'),
        getAll('honors'), getAll('posts'), getAll('comments')
      ]);
      return {
        users: (users || []).map(mapUser),
        subjects: (subjects || []).map(mapSubject),
        lessons: (lessons || []).map(mapLesson),
        exercises: (exercises || []).map(mapExercise),
        results: (results || []).map(mapResult),
        rewards: (rewards || []).map(mapReward),
        assignments: (assignments || []).map(mapAssignment),
        schoolYears: (schoolYears || []).map(mapSchoolYear),
        classes: (classes || []).map(mapClass),
        classStudents: (classStudents || []).map(mapClassStudent),
        honors: (honors || []).map(mapHonor),
        posts: (posts || []).map(mapPost),
        comments: (comments || []).map(mapComment)
      };
    } catch (err) {
      console.error('loadAllData error:', err);
      return null;
    }
  };

  // ---- Image upload to Supabase Storage ----
  const uploadImage = async (file) => {
    if (!supabase) return null;
    const ext = file.name.split('.').pop();
    const fileName = `exercises/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('images').upload(fileName, file);
    if (error) { console.error('Upload image error:', error); return null; }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  };

  // ---- Settings ----
  const getSupabaseUrl = () => SUPABASE_URL;
  const getSupabaseKey = () => SUPABASE_KEY;
  const setSupabaseUrl = (url) => { SUPABASE_URL = url; localStorage.setItem('lms_supabase_url', url); };
  const setSupabaseKey = (key) => { SUPABASE_KEY = key; localStorage.setItem('lms_supabase_key', key); };
  const getGeminiKey = () => GEMINI_API_KEY;
  const setGeminiKey = (key) => { GEMINI_API_KEY = key; localStorage.setItem('lms_gemini_key', key); };
  const getApiUrl = () => SUPABASE_URL;

  return {
    initSupabase, isConnected, login, getAll, getWhere, insert, update, remove,
    loadAllData, uploadImage,
    mapUser, mapSubject, mapLesson, mapExercise, mapResult, mapReward, mapAssignment,
    mapSchoolYear, mapClass, mapClassStudent,
    mapHonor, mapPost, mapComment,
    toDbUser, toDbSubject, toDbLesson, toDbExercise, toDbResult, toDbAssignment,
    toDbSchoolYear, toDbClass,
    toDbHonor, toDbPost, toDbComment,
    getSupabaseUrl, getSupabaseKey, setSupabaseUrl, setSupabaseKey,
    getGeminiKey, setGeminiKey, getApiUrl
  };
})();
