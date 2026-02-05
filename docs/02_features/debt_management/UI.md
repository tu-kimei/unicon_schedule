# Debt Management - UI/UX Design (MVP)

## Overview

Thiết kế giao diện cho tính năng Quản lý Công nợ MVP, tập trung vào:
- Danh sách công nợ dạng table, phân section theo tháng
- Filter theo tháng, khách hàng, trạng thái quá hạn
- Form tạo/sửa công nợ
- Form cập nhật thanh toán
- Upload hình ảnh hóa đơn và UNC

---

## Page Structure

### 1. Debts List Page (`/accounting/debts`)

**URL**: `/accounting/debts`

**Access**: ADMIN, ACCOUNTING (full), OPS (read-only)

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Quản lý Công nợ                    [+ Tạo công nợ] │
├─────────────────────────────────────────────────────────────┤
│ Filters:                                                     │
│ [Tháng ▼] [Khách hàng ▼] [Trạng thái ▼] [🔍 Tìm kiếm]     │
│ ☐ Chỉ hiển thị quá hạn                                     │
├─────────────────────────────────────────────────────────────┤
│ Summary Cards:                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ Tổng CN  │ │ Chưa TT  │ │ Đã TT    │ │ Quá hạn  │       │
│ │ 500M     │ │ 300M     │ │ 200M     │ │ 50M      │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│ ▼ Tháng 02/2026 (10 công nợ - 150M VND)                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Table: Debts for Feb 2026                               │ │
│ │ [Columns: Khách hàng | Loại | Số tiền | Ngày GN |       │ │
│ │           Đến hạn | Trạng thái | Actions]                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ▼ Tháng 01/2026 (8 công nợ - 120M VND)                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Table: Debts for Jan 2026                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Pagination: < 1 2 3 ... 10 >]                             │
└─────────────────────────────────────────────────────────────┘
```

#### Components:

**A. Header Section**
```tsx
<div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-2xl font-bold">Quản lý Công nợ</h1>
    <p className="text-gray-600">Theo dõi công nợ khách hàng</p>
  </div>
  {(isAdmin || isAccounting) && (
    <Button onClick={handleCreateDebt}>
      + Tạo công nợ mới
    </Button>
  )}
</div>
```

**B. Filter Section**
```tsx
<div className="bg-white p-4 rounded-lg shadow mb-6">
  <div className="grid grid-cols-4 gap-4 mb-4">
    <Select
      label="Tháng"
      value={selectedMonth}
      onChange={setSelectedMonth}
      options={monthOptions} // ["2026-02", "2026-01", ...]
    />
    
    <Select
      label="Khách hàng"
      value={selectedCustomer}
      onChange={setSelectedCustomer}
      options={customerOptions}
      placeholder="Tất cả khách hàng"
    />
    
    <Select
      label="Trạng thái"
      value={selectedStatus}
      onChange={setSelectedStatus}
      options={[
        { value: 'all', label: 'Tất cả' },
        { value: 'UNPAID', label: 'Chưa thanh toán' },
        { value: 'PAID', label: 'Đã thanh toán' },
        { value: 'OVERDUE', label: 'Quá hạn' },
      ]}
    />
    
    <Input
      type="search"
      placeholder="Tìm kiếm..."
      value={searchQuery}
      onChange={setSearchQuery}
    />
  </div>
  
  <Checkbox
    label="Chỉ hiển thị công nợ quá hạn"
    checked={showOverdueOnly}
    onChange={setShowOverdueOnly}
  />
</div>
```

**C. Summary Cards**
```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
  <SummaryCard
    title="Tổng công nợ"
    value={formatCurrency(summary.totalAmount)}
    icon={<DollarIcon />}
    color="blue"
  />
  <SummaryCard
    title="Chưa thanh toán"
    value={formatCurrency(summary.totalUnpaid)}
    count={summary.countUnpaid}
    icon={<ClockIcon />}
    color="yellow"
  />
  <SummaryCard
    title="Đã thanh toán"
    value={formatCurrency(summary.totalPaid)}
    count={summary.countPaid}
    icon={<CheckIcon />}
    color="green"
  />
  <SummaryCard
    title="Quá hạn"
    value={formatCurrency(summary.totalOverdue)}
    count={summary.countOverdue}
    icon={<AlertIcon />}
    color="red"
  />
</div>
```

**D. Debts Table (Grouped by Month)**
```tsx
{groupedDebts.map(({ month, debts, total }) => (
  <div key={month} className="mb-6">
    <div 
      className="flex justify-between items-center bg-gray-100 p-3 rounded cursor-pointer"
      onClick={() => toggleMonth(month)}
    >
      <div className="flex items-center gap-2">
        <ChevronIcon className={isExpanded ? 'rotate-90' : ''} />
        <h3 className="font-semibold">
          Tháng {formatMonth(month)}
        </h3>
        <span className="text-gray-600">
          ({debts.length} công nợ - {formatCurrency(total)})
        </span>
      </div>
    </div>
    
    {isExpanded && (
      <table className="w-full mt-2">
        <thead>
          <tr className="bg-gray-50">
            <th>Khách hàng</th>
            <th>Loại công nợ</th>
            <th>Số tiền</th>
            <th>Ngày ghi nhận</th>
            <th>Đến hạn</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {debts.map(debt => (
            <DebtRow key={debt.id} debt={debt} />
          ))}
        </tbody>
      </table>
    )}
  </div>
))}
```

**E. Debt Row Component**
```tsx
<tr className={debt.isOverdue ? 'bg-red-50' : ''}>
  <td>
    <div className="font-medium">{debt.customer.name}</div>
    <div className="text-sm text-gray-500">{debt.customer.email}</div>
  </td>
  
  <td>
    <DebtTypeBadge type={debt.debtType} />
  </td>
  
  <td className="font-semibold">
    {formatCurrency(debt.amount)}
  </td>
  
  <td>{formatDate(debt.recognitionDate)}</td>
  
  <td>
    <div>{formatDate(debt.dueDate)}</div>
    {debt.isOverdue && (
      <div className="text-xs text-red-600">
        Quá hạn {debt.daysOverdue} ngày
      </div>
    )}
    {!debt.isOverdue && debt.daysUntilDue <= 7 && (
      <div className="text-xs text-yellow-600">
        Còn {debt.daysUntilDue} ngày
      </div>
    )}
  </td>
  
  <td>
    <DebtStatusBadge status={debt.status} />
  </td>
  
  <td>
    <div className="flex gap-2">
      <Button size="sm" onClick={() => viewDebt(debt.id)}>
        Xem
      </Button>
      {debt.status === 'UNPAID' && (isAdmin || isAccounting) && (
        <>
          <Button size="sm" onClick={() => editDebt(debt.id)}>
            Sửa
          </Button>
          <Button 
            size="sm" 
            variant="success"
            onClick={() => markAsPaid(debt.id)}
          >
            Thanh toán
          </Button>
        </>
      )}
    </div>
  </td>
</tr>
```

---

### 2. Debt Details Page (`/accounting/debts/:id`)

**URL**: `/accounting/debts/:id`

**Access**: ADMIN, ACCOUNTING (full), OPS (read-only)

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ ← Quay lại                                    [Sửa] [Xóa]  │
├─────────────────────────────────────────────────────────────┤
│ Công nợ #DEBT-2026-001                                      │
│ Khách hàng: ABC Logistics Co.                               │
│ Trạng thái: [BADGE: Chưa thanh toán]                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────────────┐│
│ │ Thông tin công nợ   │ │ Thông tin thanh toán            ││
│ │                     │ │                                 ││
│ │ Loại: Cước vận      │ │ Trạng thái: Chưa thanh toán     ││
│ │ Tháng: 02/2026      │ │ Số tiền đã trả: -               ││
│ │ Số tiền: 50,000,000 │ │ Ngày thanh toán: -              ││
│ │ Ngày GN: 28/02/2026 │ │                                 ││
│ │ Đến hạn: 30/03/2026 │ │ [Cập nhật thanh toán]           ││
│ │ Còn: 30 ngày        │ │                                 ││
│ └─────────────────────┘ └─────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Bảng kê / Chứng từ:                                         │
│ 🔗 https://docs.google.com/spreadsheets/d/abc123            │
├─────────────────────────────────────────────────────────────┤
│ Hình ảnh Hóa đơn:                                           │
│ [📷 Image 1] [📷 Image 2]                                   │
├─────────────────────────────────────────────────────────────┤
│ Ghi chú:                                                     │
│ Công nợ tháng 2/2026 - 10 chuyến hàng                      │
├─────────────────────────────────────────────────────────────┤
│ Lịch sử:                                                     │
│ • 28/02/2026 10:30 - Tạo công nợ (Accounting User)         │
└─────────────────────────────────────────────────────────────┘
```

#### Components:

**A. Header**
```tsx
<div className="flex justify-between items-center mb-6">
  <div className="flex items-center gap-4">
    <Button variant="ghost" onClick={goBack}>
      ← Quay lại
    </Button>
    <div>
      <h1 className="text-2xl font-bold">
        Công nợ #{debt.id.slice(0, 8)}
      </h1>
      <p className="text-gray-600">{debt.customer.name}</p>
    </div>
  </div>
  
  {debt.status === 'UNPAID' && (isAdmin || isAccounting) && (
    <div className="flex gap-2">
      <Button onClick={handleEdit}>Sửa</Button>
      <Button variant="danger" onClick={handleDelete}>Xóa</Button>
    </div>
  )}
</div>
```

**B. Info Cards**
```tsx
<div className="grid grid-cols-2 gap-6 mb-6">
  {/* Debt Info */}
  <Card title="Thông tin công nợ">
    <InfoRow label="Loại công nợ">
      <DebtTypeBadge type={debt.debtType} />
    </InfoRow>
    <InfoRow label="Tháng">{formatMonth(debt.debtMonth)}</InfoRow>
    <InfoRow label="Số tiền" highlight>
      {formatCurrency(debt.amount)}
    </InfoRow>
    <InfoRow label="Ngày ghi nhận">
      {formatDate(debt.recognitionDate)}
    </InfoRow>
    <InfoRow label="Đến hạn">
      <div>
        {formatDate(debt.dueDate)}
        {debt.isOverdue && (
          <span className="text-red-600 ml-2">
            (Quá hạn {debt.daysOverdue} ngày)
          </span>
        )}
        {!debt.isOverdue && (
          <span className="text-gray-600 ml-2">
            (Còn {debt.daysUntilDue} ngày)
          </span>
        )}
      </div>
    </InfoRow>
  </Card>
  
  {/* Payment Info */}
  <Card title="Thông tin thanh toán">
    <InfoRow label="Trạng thái">
      <DebtStatusBadge status={debt.status} />
    </InfoRow>
    
    {debt.status === 'PAID' ? (
      <>
        <InfoRow label="Số tiền đã trả" highlight>
          {formatCurrency(debt.paidAmount)}
        </InfoRow>
        <InfoRow label="Ngày thanh toán">
          {formatDate(debt.paidDate)}
        </InfoRow>
        {debt.paymentNotes && (
          <InfoRow label="Ghi chú TT">
            {debt.paymentNotes}
          </InfoRow>
        )}
        {debt.paymentProofImages.length > 0 && (
          <InfoRow label="Hình UNC">
            <ImageGallery images={debt.paymentProofImages} />
          </InfoRow>
        )}
      </>
    ) : (
      <>
        <InfoRow label="Số tiền đã trả">-</InfoRow>
        <InfoRow label="Ngày thanh toán">-</InfoRow>
        {(isAdmin || isAccounting) && (
          <div className="mt-4">
            <Button 
              variant="success" 
              onClick={handleMarkAsPaid}
              fullWidth
            >
              Cập nhật thanh toán
            </Button>
          </div>
        )}
      </>
    )}
  </Card>
</div>
```

**C. Documents & Images**
```tsx
{debt.documentLink && (
  <Card title="Bảng kê / Chứng từ" className="mb-6">
    <a 
      href={debt.documentLink} 
      target="_blank"
      className="text-blue-600 hover:underline flex items-center gap-2"
    >
      <LinkIcon />
      {debt.documentLink}
    </a>
  </Card>
)}

{debt.invoiceImages.length > 0 && (
  <Card title="Hình ảnh Hóa đơn" className="mb-6">
    <ImageGallery images={debt.invoiceImages} />
  </Card>
)}

{debt.notes && (
  <Card title="Ghi chú" className="mb-6">
    <p className="whitespace-pre-wrap">{debt.notes}</p>
  </Card>
)}
```

---

### 3. Create/Edit Debt Modal

**Component**: `<DebtFormModal />`

**Trigger**: Click "Tạo công nợ mới" or "Sửa"

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Tạo công nợ mới                                        [X]  │
├─────────────────────────────────────────────────────────────┤
│ Khách hàng *                                                 │
│ [Select: Chọn khách hàng ▼]                                 │
│                                                              │
│ Loại công nợ *                                              │
│ ○ Cước vận chuyển  ○ Chi hộ  ○ Khác                        │
│                                                              │
│ Tháng *                                                      │
│ [Input: MM/YYYY]                                            │
│                                                              │
│ Số tiền *                                                    │
│ [Input: 0] VND                                              │
│                                                              │
│ Ngày ghi nhận *                                             │
│ [DatePicker: DD/MM/YYYY] (Mặc định: hôm nay)               │
│                                                              │
│ Ngày đến hạn (Tự động tính)                                 │
│ [Display: 30/03/2026] (Dựa vào thời hạn của KH)           │
│                                                              │
│ Link bảng kê / Chứng từ                                     │
│ [Input: https://...]                                        │
│                                                              │
│ Hình ảnh Hóa đơn                                            │
│ [Upload Area: Kéo thả hoặc click để upload]                │
│ [Preview: 📷 invoice1.jpg [X]]                              │
│                                                              │
│ Ghi chú                                                      │
│ [Textarea]                                                   │
│                                                              │
│                                    [Hủy]  [Tạo công nợ]    │
└─────────────────────────────────────────────────────────────┘
```

#### Form Fields:

```tsx
<form onSubmit={handleSubmit}>
  <Select
    label="Khách hàng"
    name="customerId"
    required
    options={customers.map(c => ({
      value: c.id,
      label: `${c.name} (${c.email})`
    }))}
    onChange={handleCustomerChange}
  />
  
  <RadioGroup
    label="Loại công nợ"
    name="debtType"
    required
    options={[
      { value: 'FREIGHT', label: 'Cước vận chuyển' },
      { value: 'ADVANCE', label: 'Chi hộ' },
      { value: 'OTHER', label: 'Khác' },
    ]}
  />
  
  <Input
    label="Tháng"
    name="debtMonth"
    type="month"
    required
    placeholder="MM/YYYY"
  />
  
  <Input
    label="Số tiền"
    name="amount"
    type="number"
    required
    min="0"
    step="1000"
    suffix="VND"
  />
  
  <DatePicker
    label="Ngày ghi nhận"
    name="recognitionDate"
    required
    defaultValue={new Date()}
  />
  
  {selectedCustomer && (
    <InfoBox>
      Ngày đến hạn: {calculateDueDate(recognitionDate, selectedCustomer)}
      <br />
      (Thời hạn: {selectedCustomer.paymentTermDays} {selectedCustomer.paymentTermType})
    </InfoBox>
  )}
  
  <Input
    label="Link bảng kê / Chứng từ"
    name="documentLink"
    type="url"
    placeholder="https://docs.google.com/..."
  />
  
  <FileUpload
    label="Hình ảnh Hóa đơn"
    name="invoiceImages"
    accept="image/jpeg,image/png,application/pdf"
    multiple
    maxSize={5 * 1024 * 1024} // 5MB
    onUpload={handleInvoiceUpload}
  />
  
  <Textarea
    label="Ghi chú"
    name="notes"
    rows={4}
    placeholder="Nhập ghi chú..."
  />
  
  <div className="flex justify-end gap-2 mt-6">
    <Button variant="ghost" onClick={onClose}>
      Hủy
    </Button>
    <Button type="submit" variant="primary">
      {isEdit ? 'Cập nhật' : 'Tạo công nợ'}
    </Button>
  </div>
</form>
```

---

### 4. Mark as Paid Modal

**Component**: `<MarkAsPaidModal />`

**Trigger**: Click "Thanh toán" or "Cập nhật thanh toán"

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Cập nhật thanh toán                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│ Thông tin công nợ:                                          │
│ • Khách hàng: ABC Logistics Co.                            │
│ • Số tiền: 50,000,000 VND                                   │
│ • Đến hạn: 30/03/2026                                       │
├─────────────────────────────────────────────────────────────┤
│ Số tiền thanh toán *                                        │
│ [Input: 50,000,000] VND (Phải bằng số tiền công nợ)       │
│                                                              │
│ Ngày thanh toán *                                           │
│ [DatePicker: DD/MM/YYYY]                                    │
│                                                              │
│ Hình ảnh UNC (Ủy nhiệm chi)                                 │
│ [Upload Area: Kéo thả hoặc click để upload]                │
│ [Preview: 📷 unc1.jpg [X]]                                  │
│                                                              │
│ Ghi chú thanh toán                                          │
│ [Textarea: Đã nhận chuyển khoản...]                        │
│                                                              │
│                                    [Hủy]  [Xác nhận TT]    │
└─────────────────────────────────────────────────────────────┘
```

#### Form Fields:

```tsx
<form onSubmit={handleMarkAsPaid}>
  <InfoBox className="mb-4">
    <div><strong>Khách hàng:</strong> {debt.customer.name}</div>
    <div><strong>Số tiền công nợ:</strong> {formatCurrency(debt.amount)}</div>
    <div><strong>Đến hạn:</strong> {formatDate(debt.dueDate)}</div>
  </InfoBox>
  
  <Input
    label="Số tiền thanh toán"
    name="paidAmount"
    type="number"
    required
    value={debt.amount}
    readOnly
    suffix="VND"
    helperText="MVP chỉ hỗ trợ thanh toán full"
  />
  
  <DatePicker
    label="Ngày thanh toán"
    name="paidDate"
    required
    defaultValue={new Date()}
  />
  
  <FileUpload
    label="Hình ảnh UNC (Ủy nhiệm chi)"
    name="paymentProofImages"
    accept="image/jpeg,image/png,application/pdf"
    multiple
    maxSize={5 * 1024 * 1024}
    onUpload={handleUNCUpload}
    helperText="Upload hình chứng từ chuyển khoản"
  />
  
  <Textarea
    label="Ghi chú thanh toán"
    name="paymentNotes"
    rows={3}
    placeholder="Ví dụ: Đã nhận chuyển khoản ngày 25/3..."
  />
  
  <div className="flex justify-end gap-2 mt-6">
    <Button variant="ghost" onClick={onClose}>
      Hủy
    </Button>
    <Button type="submit" variant="success">
      Xác nhận thanh toán
    </Button>
  </div>
</form>
```

---

## Shared Components

### DebtTypeBadge
```tsx
const DebtTypeBadge = ({ type }: { type: DebtType }) => {
  const config = {
    FREIGHT: { label: 'Cước vận chuyển', color: 'blue' },
    ADVANCE: { label: 'Chi hộ', color: 'purple' },
    OTHER: { label: 'Khác', color: 'gray' },
  };
  
  return (
    <Badge color={config[type].color}>
      {config[type].label}
    </Badge>
  );
};
```

### DebtStatusBadge
```tsx
const DebtStatusBadge = ({ status }: { status: DebtStatus }) => {
  const config = {
    UNPAID: { label: 'Chưa thanh toán', color: 'yellow' },
    PAID: { label: 'Đã thanh toán', color: 'green' },
    OVERDUE: { label: 'Quá hạn', color: 'red' },
    CANCELLED: { label: 'Đã hủy', color: 'gray' },
  };
  
  return (
    <Badge color={config[status].color}>
      {config[status].label}
    </Badge>
  );
};
```

### ImageGallery
```tsx
const ImageGallery = ({ images }: { images: string[] }) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {images.map((url, index) => (
        <div key={index} className="relative group">
          <img 
            src={url} 
            alt={`Image ${index + 1}`}
            className="w-full h-24 object-cover rounded cursor-pointer"
            onClick={() => openLightbox(url)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
            <ZoomIcon className="text-white opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Routing

```wasp
// Debt Management Routes
route DebtsListRoute { path: "/accounting/debts", to: DebtsListPage }
page DebtsListPage {
  authRequired: true,
  component: import { DebtsListPage } from "@src/debt/pages/DebtsListPage"
}

route DebtDetailsRoute { path: "/accounting/debts/:id", to: DebtDetailsPage }
page DebtDetailsPage {
  authRequired: true,
  component: import { DebtDetailsPage } from "@src/debt/pages/DebtDetailsPage"
}
```

---

## Responsive Design

- Desktop (>1024px): Full layout as shown
- Tablet (768-1024px): 2-column grid for cards, table scrollable
- Mobile (<768px): Single column, cards stack, table becomes cards

---

## Accessibility

- Keyboard navigation support
- ARIA labels for all interactive elements
- Color contrast meets WCAG AA standards
- Screen reader friendly
- Focus indicators visible

---

## Notes

- Use Tailwind CSS for styling (consistent with existing app)
- Reuse existing components (Button, Input, Select, etc.)
- File uploads use Cloudinary (same as POD)
- Date formatting uses Vietnamese locale
- Currency formatting: 50,000,000 VND (no decimals)
