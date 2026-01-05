# Sửa Lỗi 404 Khi Deploy GitHub Pages

## 🔍 Nguyên nhân

Lỗi 404 thường do:
1. **Base path không đúng** - Assets không được load từ đúng đường dẫn
2. **404.html không được copy** - SPA routing không hoạt động
3. **Repository name không được detect** - Base path mặc định sai

## ✅ Đã sửa

### 1. Cải thiện Base Path Detection
- Tự động detect từ `GITHUB_REPOSITORY`
- Hỗ trợ cả `username.github.io` (base = `/`) và `username/repo` (base = `/repo/`)
- Ưu tiên `VITE_BASE_URL` nếu được set

### 2. Workflow Improvements
- Thêm step detect repository name
- Set `VITE_BASE_URL` trong build
- Log base path để debug

### 3. Build Verification
- Thêm script check build
- Verify index.html có script tag
- Verify base path được inject

## 🚀 Cách Deploy

### Bước 1: Push code
```bash
git add .
git commit -m "Fix 404 errors for GitHub Pages"
git push origin main
```

### Bước 2: Kiểm tra Actions
- Vào tab **Actions** trên GitHub
- Xem log của workflow
- Tìm dòng `Building with base: /repo-name/`
- Đảm bảo build thành công

### Bước 3: Kiểm tra Deploy
- Vào **Settings** → **Pages**
- Xem URL được deploy
- Mở URL và kiểm tra:
  - UI hiển thị đúng
  - Không có lỗi 404 trong Console
  - Assets load được (check Network tab)

## 🐛 Debug

### Kiểm tra Base Path
Trong build log, tìm:
```
Building with base: /your-repo-name/
```

### Kiểm tra Assets
Mở DevTools → Network tab:
- Assets phải load từ: `https://username.github.io/repo-name/assets/...`
- Nếu thấy `https://username.github.io/assets/...` → Base path sai

### Kiểm tra 404.html
Sau khi build, verify:
```bash
ls -la dist/404.html
```

File này phải tồn tại.

## 📝 Manual Fix

Nếu vẫn lỗi, set base path thủ công:

1. Thêm vào GitHub Secrets:
   - Name: `VITE_BASE_URL`
   - Value: `/your-repo-name/` (thay your-repo-name)

2. Hoặc thêm vào `.env`:
   ```
   VITE_BASE_URL=/your-repo-name/
   ```

## ✅ Checklist

- [ ] Workflow chạy thành công
- [ ] Build log hiển thị base path đúng
- [ ] `dist/404.html` tồn tại
- [ ] `dist/index.html` có script tag
- [ ] Assets load từ đúng path
- [ ] UI hiển thị đúng trên GitHub Pages

