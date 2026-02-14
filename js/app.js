/* ============================================
   App.js - Main Controller (Part 1: Core + Demo Data)
   ============================================ */

// ---- Demo Data ----
const DEMO = {
    users: [
        { id: 'admin1', hoTen: 'Quản trị viên', username: 'admin', password: '123456', role: 'admin', avatar: '🛡️' },
        { id: 'gv1', hoTen: 'Cô Nguyễn Thị Mai', username: 'giaovien', password: '123456', role: 'gv', avatar: '👩‍🏫' },
        { id: 'hs1', hoTen: 'Nguyễn Văn An', username: 'an123', password: '111111', role: 'hs', avatar: '👦', lop: '3A' },
        { id: 'hs2', hoTen: 'Trần Thị Bảo', username: 'bao123', password: '222222', role: 'hs', avatar: '👧', lop: '3A' },
        { id: 'hs3', hoTen: 'Lê Minh Châu', username: 'chau123', password: '333333', role: 'hs', avatar: '🧒', lop: '3B' },
        { id: 'hs4', hoTen: 'Phạm Đức Dũng', username: 'dung123', password: '444444', role: 'hs', avatar: '👦', lop: '3B' },
    ],
    schoolYears: [
        { id: 'sy1', ten: '2025-2026', batDau: '2025-09-01', ketThuc: '2026-05-31', trangThai: 'active' },
    ],
    classes: [
        { id: 'c1', tenLop: '3A', giaoVienId: 'gv1', namHocId: 'sy1', moTa: 'Lớp 3A - Cô Mai' },
        { id: 'c2', tenLop: '3B', giaoVienId: 'gv1', namHocId: 'sy1', moTa: 'Lớp 3B - Cô Mai' },
    ],
    classStudents: [
        { id: 'cs1', classId: 'c1', studentId: 'hs1' },
        { id: 'cs2', classId: 'c1', studentId: 'hs2' },
        { id: 'cs3', classId: 'c2', studentId: 'hs3' },
        { id: 'cs4', classId: 'c2', studentId: 'hs4' },
    ],
    subjects: [
        { id: 's1', tenMon: 'Toán', moTa: 'Số học, hình học, đo lường', icon: '🔢', mauSac: '#6C5CE7' },
        { id: 's2', tenMon: 'Tiếng Việt', moTa: 'Đọc, viết, ngữ pháp', icon: '📖', mauSac: '#00B894' },
        { id: 's3', tenMon: 'Khoa học', moTa: 'Tự nhiên, xã hội', icon: '🔬', mauSac: '#E17055' },
        { id: 's4', tenMon: 'Tiếng Anh', moTa: 'Từ vựng, ngữ pháp cơ bản', icon: '🌍', mauSac: '#FDCB6E' },
    ],
    lessons: [
        { id: 'l1', monHocId: 's1', tieuDe: 'Phép cộng trong phạm vi 1000', noiDung: 'Học cách cộng các số có 3 chữ số', thuTu: 1 },
        { id: 'l2', monHocId: 's1', tieuDe: 'Phép trừ trong phạm vi 1000', noiDung: 'Học cách trừ các số có 3 chữ số', thuTu: 2 },
        { id: 'l3', monHocId: 's2', tieuDe: 'Từ đồng nghĩa, trái nghĩa', noiDung: 'Nhận biết và sử dụng từ đồng nghĩa, trái nghĩa', thuTu: 1 },
        { id: 'l4', monHocId: 's3', tieuDe: 'Hệ Mặt Trời', noiDung: 'Tìm hiểu về các hành tinh trong hệ Mặt Trời', thuTu: 1 },
    ],
    exercises: [
        {
            id: 'e1', baiHocId: 'l1', dang: 'trac-nghiem', cauHoi: '245 + 132 = ?', diem: 10,
            duLieu: { dapAnA: '377', dapAnB: '367', dapAnC: '387', dapAnD: '357', dapAnDung: 'A', giaiThich: '245 + 132: 5+2=7, 4+3=7, 2+1=3 → 377' }
        },
        {
            id: 'e2', baiHocId: 'l1', dang: 'trac-nghiem', cauHoi: '500 + 234 = ?', diem: 10,
            duLieu: { dapAnA: '724', dapAnB: '734', dapAnC: '744', dapAnD: '634', dapAnDung: 'B', giaiThich: '500 + 234 = 734' }
        },
        {
            id: 'e3', baiHocId: 'l1', dang: 'tu-luan', cauHoi: '123 + 456 = ?', diem: 10,
            duLieu: { dapAnDung: '579', giaiThich: '3+6=9, 2+5=7, 1+4=5 → 579' }
        },
        {
            id: 'e4', baiHocId: 'l3', dang: 'noi-cot', cauHoi: 'Nối từ với từ trái nghĩa:', diem: 10,
            duLieu: { cotA: ['To', 'Nhanh', 'Vui'], cotB: ['Buồn', 'Chậm', 'Nhỏ'], dapAnDung: { 'To': 'Nhỏ', 'Nhanh': 'Chậm', 'Vui': 'Buồn' }, giaiThich: 'To↔Nhỏ, Nhanh↔Chậm, Vui↔Buồn' }
        },
        {
            id: 'e5', baiHocId: 'l4', dang: 'sap-xep', cauHoi: 'Sắp xếp các hành tinh theo thứ tự gần Mặt Trời nhất:', diem: 10,
            duLieu: { items: ['Trái Đất', 'Sao Kim', 'Sao Thủy', 'Sao Hỏa'], dapAnDung: ['Sao Thủy', 'Sao Kim', 'Trái Đất', 'Sao Hỏa'], giaiThich: 'Thứ tự: Sao Thủy → Sao Kim → Trái Đất → Sao Hỏa' }
        },
        {
            id: 'e6', baiHocId: 'l1', dang: 'keo-tha', cauHoi: 'Kéo các số theo thứ tự từ bé đến lớn:', diem: 10,
            duLieu: { items: ['350', '120', '500', '230'], dapAnDung: ['120', '230', '350', '500'], giaiThich: '120 < 230 < 350 < 500' }
        },
    ],
    results: [
        { id: 'r1', hocSinhId: 'hs1', baiTapId: 'e1', cauTraLoi: 'A', dungSai: true, diemDat: 10, thoiGianLam: 15, ngayLam: '2026-02-10', cauHoi: '245+132=?', dang: 'trac-nghiem' },
        { id: 'r2', hocSinhId: 'hs1', baiTapId: 'e2', cauTraLoi: 'C', dungSai: false, diemDat: 0, thoiGianLam: 20, ngayLam: '2026-02-10', cauHoi: '500+234=?', dang: 'trac-nghiem' },
        { id: 'r3', hocSinhId: 'hs1', baiTapId: 'e3', cauTraLoi: '579', dungSai: true, diemDat: 10, thoiGianLam: 30, ngayLam: '2026-02-11', cauHoi: '123+456=?', dang: 'tu-luan' },
        { id: 'r4', hocSinhId: 'hs2', baiTapId: 'e1', cauTraLoi: 'A', dungSai: true, diemDat: 10, thoiGianLam: 12, ngayLam: '2026-02-11', cauHoi: '245+132=?', dang: 'trac-nghiem' },
        { id: 'r5', hocSinhId: 'hs2', baiTapId: 'e2', cauTraLoi: 'B', dungSai: true, diemDat: 10, thoiGianLam: 18, ngayLam: '2026-02-11', cauHoi: '500+234=?', dang: 'trac-nghiem' },
    ],
    rewards: [
        { id: 'rw1', hocSinhId: 'hs1', loai: 'huy-hieu', giaTri: 'first_exercise', moTa: 'Bước Đầu', ngayNhan: '2026-02-10' },
        { id: 'rw2', hocSinhId: 'hs2', loai: 'huy-hieu', giaTri: 'first_exercise', moTa: 'Bước Đầu', ngayNhan: '2026-02-11' },
    ],
    assignments: [
        {
            id: 'a1', tieuDe: 'Bài tập Toán - Phép cộng', baiHocId: 'l1', classId: 'c1', giaoVienId: 'gv1',
            exerciseIds: ['e1', 'e2', 'e3', 'e6'],
            batDau: '2026-02-10T08:00', ketThuc: '2026-02-15T23:59', soLanLamLai: 2,
            cheDoXem: 'dung-sai-dap-an', trangThai: 'active', maLink: 'BT-TOAN-001'
        },
        {
            id: 'a2', tieuDe: 'Bài tập Tiếng Việt - Từ trái nghĩa', baiHocId: 'l3', classId: 'c1', giaoVienId: 'gv1',
            exerciseIds: ['e4'],
            batDau: '2026-02-11T08:00', ketThuc: '2026-02-13T23:59', soLanLamLai: 1,
            cheDoXem: 'chi-diem', trangThai: 'active', maLink: 'BT-TV-001'
        },
        {
            id: 'a3', tieuDe: 'Bài tập Khoa học - Hệ Mặt Trời', baiHocId: 'l4', classId: 'c2', giaoVienId: 'gv1',
            exerciseIds: ['e5'],
            batDau: '2026-02-08T08:00', ketThuc: '2026-02-09T23:59', soLanLamLai: 0,
            cheDoXem: 'dung-sai', trangThai: 'expired', maLink: 'BT-KH-001'
        },
    ],
    // ---- Bảng Tuyên Dương ----
    honors: [
        { id: 'h1', hocSinhId: 'hs1', tieuDe: 'Học sinh xuất sắc tuần 6', lyDo: 'Đạt điểm cao nhất lớp trong tuần', loai: 'tuan', thoiGian: '2026-02-09', createdBy: 'gv1' },
        { id: 'h2', hocSinhId: 'hs2', tieuDe: 'Học sinh tiến bộ tuần 6', lyDo: 'Có tiến bộ vượt bậc trong môn Toán', loai: 'tuan', thoiGian: '2026-02-09', createdBy: 'gv1' },
        { id: 'h3', hocSinhId: 'hs3', tieuDe: 'Học sinh chăm chỉ tháng 1', lyDo: 'Hoàn thành đầy đủ tất cả bài tập trong tháng', loai: 'thang', thoiGian: '2026-01-31', createdBy: 'gv1' },
        { id: 'h4', hocSinhId: 'hs1', tieuDe: 'Ngôi sao tháng 1', lyDo: 'Tổng điểm cao nhất tháng 1', loai: 'thang', thoiGian: '2026-01-31', createdBy: 'gv1' },
    ],
    // ---- Bảng Tin ----
    posts: [
        { id: 'p1', tieuDe: 'Thông báo lịch thi giữa kỳ', noiDung: 'Các em học sinh lớp 3A và 3B chú ý:\n\nLịch thi giữa kỳ II như sau:\n- Thứ 2 (17/02): Toán\n- Thứ 3 (18/02): Tiếng Việt\n- Thứ 4 (19/02): Khoa học\n\nCác em ôn tập thật kỹ nhé! 📚', tacGiaId: 'gv1', loai: 'thong-bao', ghim: true, createdAt: '2026-02-12T08:00:00Z' },
        { id: 'p2', tieuDe: 'Hoạt động ngoại khóa: Tham quan Bảo tàng', noiDung: 'Nhà trường tổ chức chuyến tham quan Bảo tàng Lịch sử vào ngày 22/02/2026.\n\nChi tiết:\n- Thời gian: 8h00 - 16h00\n- Học phí: Miễn phí\n- Chuẩn bị: Đồng phục, nón, nước uống\n\nPhụ huynh vui lòng đăng ký cho con em trước ngày 20/02.', tacGiaId: 'admin1', loai: 'su-kien', ghim: false, createdAt: '2026-02-11T10:00:00Z' },
        { id: 'p3', tieuDe: 'Tài liệu ôn tập Toán - Phép cộng trừ', noiDung: 'Cô gửi các em tài liệu ôn tập cho bài kiểm tra sắp tới:\n\n1. Phép cộng trong phạm vi 1000\n2. Phép trừ trong phạm vi 1000\n3. Bài toán có lời văn\n\nCác em làm hết bài tập trong LMS nhé! 💪', tacGiaId: 'gv1', loai: 'tai-lieu', ghim: false, createdAt: '2026-02-10T14:00:00Z' },
    ],
    comments: [
        { id: 'cm1', postId: 'p1', tacGiaId: 'hs1', noiDung: 'Dạ em hiểu rồi ạ. Em sẽ ôn tập thật kỹ! 📖', createdAt: '2026-02-12T09:30:00Z' },
        { id: 'cm2', postId: 'p1', tacGiaId: 'hs2', noiDung: 'Cô ơi, môn Tiếng Anh có thi không ạ?', createdAt: '2026-02-12T10:15:00Z' },
        { id: 'cm3', postId: 'p1', tacGiaId: 'gv1', noiDung: 'Tiếng Anh thi vào Thứ 5 (20/02) nhé các em! 😊', createdAt: '2026-02-12T10:30:00Z' },
        { id: 'cm4', postId: 'p2', tacGiaId: 'hs3', noiDung: 'Con muốn đi ạ! Mẹ con đã đồng ý rồi 🎉', createdAt: '2026-02-11T15:00:00Z' },
        { id: 'cm5', postId: 'p3', tacGiaId: 'hs1', noiDung: 'Dạ cảm ơn cô ạ! Em sẽ làm bài tập ngay! ✅', createdAt: '2026-02-10T16:00:00Z' },
    ]
};

// ---- Toast Notification ----
function showToast(msg, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}
