-- ============================================
-- Bảng Tin (Bulletin Board)
-- Chạy trong Supabase SQL Editor
-- ============================================

-- Bài đăng
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tieu_de TEXT NOT NULL,
  noi_dung TEXT NOT NULL,
  tac_gia_id UUID REFERENCES users(id) ON DELETE CASCADE,
  loai TEXT DEFAULT 'thong-bao' CHECK (loai IN ('thong-bao', 'su-kien', 'tai-lieu', 'khac')),
  ghim BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bình luận
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tac_gia_id UUID REFERENCES users(id) ON DELETE CASCADE,
  noi_dung TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON comments FOR ALL USING (true) WITH CHECK (true);

-- Demo Data: Bài đăng
INSERT INTO posts (id, tieu_de, noi_dung, tac_gia_id, loai, ghim, created_at) VALUES
  ('00000000-0000-0000-0005-000000000001', 'Thông báo lịch thi giữa kỳ', 'Các em học sinh lớp 3A và 3B chú ý:\n\nLịch thi giữa kỳ II như sau:\n- Thứ 2 (17/02): Toán\n- Thứ 3 (18/02): Tiếng Việt\n- Thứ 4 (19/02): Khoa học\n\nCác em ôn tập thật kỹ nhé! 📚', '00000000-0000-0000-0000-000000000001', 'thong-bao', TRUE, '2026-02-12T08:00:00Z'),
  ('00000000-0000-0000-0005-000000000002', 'Hoạt động ngoại khóa: Tham quan Bảo tàng', 'Nhà trường tổ chức chuyến tham quan Bảo tàng Lịch sử vào ngày 22/02/2026.\n\nChi tiết:\n- Thời gian: 8h00 - 16h00\n- Học phí: Miễn phí\n- Chuẩn bị: Đồng phục, nón, nước uống\n\nPhụ huynh vui lòng đăng ký cho con em trước ngày 20/02.', '00000000-0000-0000-0000-000000000001', 'su-kien', FALSE, '2026-02-11T10:00:00Z'),
  ('00000000-0000-0000-0005-000000000003', 'Tài liệu ôn tập Toán - Phép cộng trừ', 'Cô gửi các em tài liệu ôn tập cho bài kiểm tra sắp tới:\n\n1. Phép cộng trong phạm vi 1000\n2. Phép trừ trong phạm vi 1000\n3. Bài toán có lời văn\n\nCác em làm hết bài tập trong LMS nhé! 💪', '00000000-0000-0000-0000-000000000001', 'tai-lieu', FALSE, '2026-02-10T14:00:00Z')
ON CONFLICT DO NOTHING;

-- Demo Data: Bình luận
INSERT INTO comments (id, post_id, tac_gia_id, noi_dung, created_at) VALUES
  ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0000-000000000002', 'Dạ em hiểu rồi ạ. Em sẽ ôn tập thật kỹ! 📖', '2026-02-12T09:30:00Z'),
  ('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0000-000000000003', 'Cô ơi, môn Tiếng Anh có thi không ạ?', '2026-02-12T10:15:00Z'),
  ('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0000-000000000001', 'Tiếng Anh thi vào Thứ 5 (20/02) nhé các em! 😊', '2026-02-12T10:30:00Z'),
  ('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0000-000000000004', 'Con muốn đi ạ! Mẹ con đã đồng ý rồi 🎉', '2026-02-11T15:00:00Z'),
  ('00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0000-000000000002', 'Dạ cảm ơn cô ạ! Em sẽ làm bài tập ngay! ✅', '2026-02-10T16:00:00Z')
ON CONFLICT DO NOTHING;
