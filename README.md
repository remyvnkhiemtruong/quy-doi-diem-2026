# Bộ công cụ quy đổi điểm xét tuyển 2026

File zip này gồm **2 project web tĩnh độc lập**, mỗi project là 1 trang GitHub Pages riêng biệt (không phụ thuộc lẫn nhau), tương ứng với 2 nguồn dữ liệu quy đổi khác nhau:

## 1. `dgnl-thpt-quydoi/`
Quy đổi tương đương điểm thi **Đánh giá năng lực ĐHQG-HCM ↔ điểm thi tốt nghiệp THPT 2026**, theo đúng khung quy đổi trong **Công văn số 1540/ĐHQG-ĐT ngày 03/07/2026**. Áp dụng cho 5 tổ hợp: A00, A01, B00, C00, D01.

## 2. `khoi-thi-quydoi/`
Tra phân vị điểm THPT theo khối thi và quy đổi điểm tương đương **giữa các khối xét tuyển với nhau** (154 tổ hợp: A00–Y11), dựa trên bảng phân vị P1–P99 trong file Excel người dùng cung cấp (`Bach_phan_vi_khoi_thi_va_cong_cu_quy_doi.xlsx`).

Hai công cụ dùng **hai nguồn dữ liệu khác nhau** và trả lời **hai câu hỏi khác nhau**:
- Công cụ 1: "Điểm ĐGNL của tôi tương đương bao nhiêu điểm THPT (hoặc ngược lại)?"
- Công cụ 2: "Điểm khối A00 của tôi tương đương bao nhiêu điểm ở khối D01 (hay khối bất kỳ khác)?"

## Cách dùng mỗi project
Mỗi thư mục là 1 project GitHub Pages hoàn chỉnh, độc lập:
1. Mở thư mục tương ứng, đọc `README.md` bên trong để biết chi tiết.
2. Tạo 1 repository GitHub riêng cho từng project (khuyến khích tách 2 repo để deploy 2 địa chỉ khác nhau), copy `index.html` vào nhánh `main`.
3. Bật GitHub Pages trong Settings → Pages → Source: Deploy from a branch → `main` / `root`.

Cả hai đều là file HTML thuần (kèm CSS/JS nhúng sẵn, dữ liệu nhúng sẵn dạng JSON trong file) — không cần cài đặt, build hay phụ thuộc gì thêm.
