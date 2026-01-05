# Hướng Dẫn Chạy Ứng Dụng

## 🚀 Cách Chạy Nhanh (Khuyến Nghị)

### Bước 1: Cài đặt dependencies
```bash
cd trade
npm install
cd backend && npm install && cd ..
```

### Bước 2: Cấu hình API Key
Tạo file `.env.local` trong thư mục `trade/`:
```env
GEMINI_API_KEY=your_api_key_here
VITE_API_URL=http://localhost:3001
```

### Bước 3: Chạy cả Frontend và Backend
```bash
npm run dev
```

Lệnh này sẽ tự động chạy:
- ✅ **Backend** trên http://localhost:3001
- ✅ **Frontend** trên http://localhost:3000

---

## 📋 Các Cách Chạy Khác

### Chạy riêng Backend
```bash
cd trade/backend
npm run dev
```

### Chạy riêng Frontend
```bash
cd trade
npm run dev:frontend
```

### Chạy cả hai trong terminal riêng

**Terminal 1 - Backend:**
```bash
cd trade/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd trade
npm run dev:frontend
```

---

## 🔧 Xử Lý Lỗi

### Port 3001 đã được sử dụng
```bash
# Tìm và kill process
lsof -ti:3001 | xargs kill -9

# Hoặc thay đổi port trong trade/backend/.env
PORT=3002
```

### Port 3000 đã được sử dụng
Vite sẽ tự động tìm port khác (3001, 3002, ...)

---

## 📡 API Endpoints

- `GET http://localhost:3001/health` - Health check
- `GET http://localhost:3001/api/dashboard` - Dashboard signal (BTC)
- `GET http://localhost:3001/api/signals` - Tất cả signals
- `GET http://localhost:3001/api/signals/:symbol` - Signal cho symbol cụ thể
- `GET http://localhost:3001/api/market/data/:symbol` - Dữ liệu thị trường

---

## ✅ Kiểm Tra

Sau khi chạy `npm run dev`, bạn sẽ thấy:
- Backend: `Backend server running on http://localhost:3001`
- Frontend: `Local: http://localhost:3000/`

Mở trình duyệt và truy cập: **http://localhost:3000**

