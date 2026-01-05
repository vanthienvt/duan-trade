# Cấu Hình Backend API

## 🚨 Vấn Đề Hiện Tại

Ứng dụng đang cố kết nối đến `http://localhost:3001` nhưng trong production (GitHub Pages) không có backend server chạy.

## ✅ Giải Pháp

### Option 1: Deploy Backend lên Cloud (Khuyến Nghị)

#### Deploy lên Vercel (Miễn phí)

1. **Push backend code lên GitHub** (nếu chưa có)
   ```bash
   cd trade/backend
   git init
   git add .
   git commit -m "Initial backend"
   git remote add origin https://github.com/your-username/your-backend-repo.git
   git push -u origin main
   ```

2. **Deploy trên Vercel**
   - Vào https://vercel.com
   - Import repository
   - Root Directory: `backend`
   - Build Command: (để trống hoặc `npm install`)
   - Output Directory: (để trống)
   - Install Command: `npm install`
   - Start Command: `npm start`
   - Deploy!

3. **Lấy URL** (ví dụ: `https://your-backend.vercel.app`)

4. **Thêm vào GitHub Secrets**
   - Vào repository → **Settings** → **Secrets and variables** → **Actions**
   - Thêm secret mới:
     - Name: `VITE_API_URL`
     - Value: `https://your-backend.vercel.app`

#### Deploy lên Railway/Render

Tương tự như Vercel, chỉ cần:
- Import repository
- Set root directory: `backend`
- Deploy
- Copy URL và thêm vào GitHub Secrets

### Option 2: Sử Dụng Mock Data (Tạm Thời)

Ứng dụng đã có fallback data, sẽ hiển thị dữ liệu mẫu khi không có backend.

## 🔧 Cấu Hình GitHub Secrets

1. Vào repository trên GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Thêm:
   - **Name**: `VITE_API_URL`
   - **Value**: URL của backend đã deploy (ví dụ: `https://your-backend.vercel.app`)
5. Click **Add secret**

## ✅ Kiểm Tra

Sau khi thêm secret:
1. Push code mới (hoặc chạy lại workflow)
2. Workflow sẽ tự động build với API URL mới
3. Ứng dụng sẽ kết nối đến backend thật

## 📝 Lưu Ý

- Backend cần enable CORS để frontend có thể gọi API
- Đảm bảo backend server đang chạy và accessible
- Kiểm tra logs trong Vercel/Railway để debug nếu cần

## 🐛 Debug

Nếu vẫn lỗi:
1. Kiểm tra backend URL có đúng không
2. Test API trực tiếp: `curl https://your-backend.vercel.app/api/health`
3. Kiểm tra CORS settings trong backend
4. Xem console trong browser để xem lỗi chi tiết

