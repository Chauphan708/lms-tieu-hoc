# 📚 LMS Tiểu Học - Học mà Vui!

Hệ thống quản lý học tập (LMS) cho học sinh tiểu học với giao diện thân thiện, tích hợp AI.

## ✨ Tính năng

### 👨‍🎓 Học sinh
- Đăng nhập bằng tài khoản/mật khẩu do giáo viên cấp
- Làm bài tập 5 dạng: trắc nghiệm, kéo thả, nối cột, sắp xếp, tự luận ngắn
- Xem tiến độ, biểu đồ phát triển, lịch sử làm bài
- AI phân tích điểm mạnh/yếu, gợi ý ôn tập
- Gamification: huy hiệu, streak, XP, level, bảng xếp hạng

### 👩‍🏫 Giáo viên
- Quản lý học sinh (thêm/xóa, cấp tài khoản)
- Quản lý môn học, bài học
- AI tạo bài tập tự động (Gemini API)
- Phân tích chi tiết từng học sinh, AI đánh giá

## 🚀 Cài đặt

### Bước 1: Chạy demo (không cần cài đặt gì)
Mở file `index.html` trong trình duyệt. App có sẵn dữ liệu demo.

**Tài khoản demo:**
| Role | Username | Password |
|------|----------|----------|
| Giáo viên | giaovien | 123456 |
| Học sinh | an123 | 111111 |

### Bước 2: Kết nối Google Sheets (tùy chọn)
1. Tạo Google Sheet mới, thêm các sheet: `HocSinh`, `MonHoc`, `BaiHoc`, `BaiTap`, `KetQuaLamBai`, `DiemThuong`
2. Thêm header cho mỗi sheet (xem file `Code.gs`)
3. Vào **Extensions > Apps Script**, paste nội dung file `google-apps-script/Code.gs`
4. Đổi `SHEET_ID` thành ID Google Sheet của bạn
5. **Deploy > New deployment > Web app > Anyone** > Deploy
6. Copy URL, paste vào **Cài đặt > Google Apps Script URL** trong app

### Bước 3: Kích hoạt AI (tùy chọn)
1. Lấy Gemini API Key tại: https://aistudio.google.com/apikey
2. Paste vào **Cài đặt > Gemini API Key** trong app

## 📁 Cấu trúc

```
lms-tieu-hoc/
├── index.html           # Trang chính
├── css/style.css        # Giao diện
├── js/
│   ├── api.js           # Kết nối Google Sheets
│   ├── ai.js            # Gemini AI
│   ├── exercises.js     # Engine 5 dạng bài tập
│   ├── gamification.js  # Huy hiệu, XP, streak
│   ├── app.js           # Demo data
│   └── app2.js          # Main controller
└── google-apps-script/
    └── Code.gs          # Backend Apps Script
```

## 🛠 Công nghệ
- **Frontend**: HTML, CSS, JavaScript (thuần, không framework)
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **AI**: Gemini API
