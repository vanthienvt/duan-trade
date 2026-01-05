# Hướng Dẫn Deploy lên GitHub Pages

## 🚀 Cấu hình GitHub Pages

### Bước 1: Bật GitHub Pages
1. Vào **Settings** của repository
2. Scroll xuống **Pages**
3. Chọn **Source**: `GitHub Actions`
4. Save

### Bước 2: Cấu hình Secrets (nếu cần)

Vào **Settings** → **Secrets and variables** → **Actions**, thêm:

- `GEMINI_API_KEY`: API key của Gemini (nếu cần)
- `VITE_API_URL`: URL của backend API (ví dụ: `https://your-backend.vercel.app`)

### Bước 3: Push code

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

GitHub Actions sẽ tự động build và deploy.

---

## 🔧 Cấu hình Base Path

Nếu repository của bạn là `username/trade`, URL sẽ là:
- `https://username.github.io/trade/`

Base path sẽ tự động được detect từ tên repository.

Nếu muốn set thủ công, thêm vào `.env`:
```
VITE_BASE_URL=/trade/
```

---

## 📝 Các file quan trọng

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `404.html` - File redirect cho SPA routing
- `vite.config.ts` - Cấu hình base path

---

## ✅ Kiểm tra sau khi deploy

1. Vào **Actions** tab để xem build status
2. Vào **Settings** → **Pages** để xem URL
3. Mở URL và kiểm tra:
   - UI hiển thị đúng
   - Không có lỗi 404
   - Assets load được (JS, CSS)
   - API calls hoạt động (nếu có backend)

---

## 🐛 Xử lý lỗi

### Lỗi 404 khi refresh trang
- Đảm bảo `404.html` đã được copy vào `dist/`
- Kiểm tra base path trong `vite.config.ts`

### Assets không load
- Kiểm tra base path có đúng không
- Xem Network tab trong DevTools để xem path của assets

### API không hoạt động
- Kiểm tra `VITE_API_URL` trong secrets
- Đảm bảo backend đã được deploy và CORS đã được cấu hình

