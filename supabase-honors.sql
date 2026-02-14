-- ============================================
-- Bảng Tuyên Dương (Honors Board)
-- Chạy trong Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS honors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hoc_sinh_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tieu_de TEXT NOT NULL,
  ly_do TEXT DEFAULT '',
  loai TEXT DEFAULT 'tuan' CHECK (loai IN ('tuan', 'thang')),
  thoi_gian DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE honors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON honors FOR ALL USING (true) WITH CHECK (true);

-- Demo Data
INSERT INTO honors (hoc_sinh_id, tieu_de, ly_do, loai, thoi_gian, created_by) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Học sinh xuất sắc tuần 6', 'Đạt điểm cao nhất lớp trong tuần', 'tuan', '2026-02-09', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'Học sinh tiến bộ tuần 6', 'Có tiến bộ vượt bậc trong môn Toán', 'tuan', '2026-02-09', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', 'Học sinh chăm chỉ tháng 1', 'Hoàn thành đầy đủ tất cả bài tập trong tháng', 'thang', '2026-01-31', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', 'Ngôi sao tháng 1', 'Tổng điểm cao nhất tháng 1', 'thang', '2026-01-31', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
