# Data Directory

This directory contains extracted data from Excel files in JSON format.

## 📁 Structure

After running `npm run extract:json`, this directory will contain:

```
data/
├── customers.json          # Thông tin khách hàng (34 records)
├── vehicles.json           # Thông tin xe (51 records)
├── drivers.json            # Thông tin tài xế (19 records)
├── orders.json             # Thông tin đơn hàng (2,303 records)
├── freight_rates.json      # Giá cước vận chuyển (10 records)
├── maintenance_logs.json   # Thông tin sửa chữa xe (353 records)
├── distances.json          # Khoảng cách (12 records)
├── fuel_logs.json          # Quản lý xăng dầu (495 records)
├── locations.json          # Danh sách địa điểm (161 records)
└── metadata.json           # Metadata về extraction
```

## 🚀 Usage

### Extract data from Excel to JSON

```bash
npm run extract:json
```

This will:
1. Read the Excel file from `uploads/Quản lý đội xe vận tải.xlsx`
2. Extract all sheets to JSON files
3. Clean and normalize the data
4. Save to this directory

### Migrate data from JSON to Database

```bash
# Migrate all data
npm run migrate:json

# Migrate specific dataset
npm run migrate:json -- customers
npm run migrate:json -- vehicles
npm run migrate:json -- drivers
```

## 📊 Data Format

Each JSON file contains an array of objects with the original Excel column names as keys.

Example `customers.json`:
```json
[
  {
    "Tên khách hàng": "CTY CỔ PHẦN MACSTAR HCM",
    "Mô tả sơ bộ": "KV các cảng, depot TP HCM...",
    "Bảng kê": "Chốt bảng kê 25",
    "Công nợ": "25~30 ngày",
    "VAT": "Có",
    "Trạng thái": "Đang vận chuyển",
    ...
  }
]
```

## 🔒 Security

**Important:** These JSON files may contain sensitive business data. They are:
- ✅ Excluded from git (via `.gitignore`)
- ✅ Stored locally only
- ⚠️  Should not be committed to version control
- ⚠️  Should not be shared publicly

## 📝 Notes

- Date fields are converted to ISO 8601 format
- Empty values are removed
- Excel date serial numbers are converted to readable dates
- All data is cleaned and normalized

## 🔄 Workflow

1. **Extract**: `npm run extract:json` - Convert Excel → JSON
2. **Review**: Check the JSON files in this directory
3. **Migrate**: `npm run migrate:json` - Import JSON → Database
4. **Develop**: Use the JSON files for testing and development

## 💡 Benefits

- **Version Control**: JSON files are easier to diff and track changes
- **Flexibility**: Can be used for testing without database
- **Portability**: Easy to share structure without sensitive data
- **Development**: Can mock data for frontend development
- **Backup**: Serves as a data backup in readable format
