/* ============================================
   LMS Tiểu Học - Express Static Server
   ============================================ */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files từ thư mục gốc
app.use(express.static(__dirname));

// Fallback → index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 LMS Tiểu Học đang chạy tại: http://localhost:${PORT}`);
    console.log(`📚 Mở trình duyệt và truy cập link trên để sử dụng\n`);
});
