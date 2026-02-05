# Phân tích và Đề xuất Cải thiện PRD - Unicon Schedule

**Ngày phân tích**: 2024-01-22  
**Phiên bản PRD hiện tại**: v0.1  
**Người phân tích**: System Analysis Team

---

## 📊 Tổng quan Phân tích

### Điểm mạnh của PRD hiện tại
✅ **Rõ ràng về scope**: Phân định rõ IN/OUT scope cho v0.1  
✅ **Personas được định nghĩa**: 4 user roles với responsibilities  
✅ **Core flows**: 7 bước workflow cơ bản  
✅ **Acceptance criteria**: Có tiêu chí chấp nhận cơ bản  

### Điểm yếu cần cải thiện
❌ **Thiếu user stories chi tiết**: Không có format "As a... I want... So that..."  
❌ **Thiếu edge cases**: Không xử lý các tình huống ngoại lệ  
❌ **Thiếu business rules**: Không rõ các quy tắc nghiệp vụ cụ thể  
❌ **Thiếu success metrics**: Không có KPIs để đo lường thành công  
❌ **Thiếu pain points chi tiết**: Chưa phân tích sâu vấn đề hiện tại  
❌ **Thiếu competitive analysis**: Không so sánh với giải pháp khác  

---

## 🎯 Phần 1: Làm rõ Bối cảnh & Mục tiêu

### 1.1 Pain Points Chi tiết (Cần bổ sung)

#### Vấn đề hiện tại với Excel/Zalo

**Excel Spreadsheets:**
```
Vấn đề cụ thể:
├── Không có version control
│   └── Nhiều người edit cùng lúc → mất dữ liệu
├── Công thức Excel dễ bị lỗi
│   └── Tính toán sai cước phí → tranh chấp với khách
├── Không có validation
│   └── Nhập sai format → dữ liệu không nhất quán
├── Khó tìm kiếm
│   └── Tìm 1 shipment trong 1000 dòng mất nhiều thời gian
└── Không có audit trail
    └── Không biết ai sửa gì, khi nào
```

**Zalo Messaging:**
```
Vấn đề cụ thể:
├── Thông tin rải rác
│   └── Phải scroll chat history để tìm thông tin
├── Không có cấu trúc
│   └── Mỗi người viết theo cách riêng
├── Dễ bỏ sót
│   └── Tin nhắn quan trọng bị chìm trong group chat
├── Không thể báo cáo
│   └── Không export được data để phân tích
└── Phụ thuộc cá nhân
    └── Nếu người đó nghỉ việc → mất thông tin
```

**Quy trình thủ công:**
```
Vấn đề cụ thể:
├── Gọi điện tìm xe
│   └── Mất 30-60 phút/shipment để tìm xe phù hợp
├── Cập nhật trạng thái thủ công
│   └── Dispatcher phải gọi tài xế liên tục để hỏi
├── POD giấy
│   └── Dễ thất lạc, khó lưu trữ, không thể search
└── Đối soát thủ công
    └── Accounting mất 2-3 ngày cuối tháng để đối soát
```

### 1.2 Quantified Impact (Cần bổ sung)

**Câu hỏi cần trả lời:**

1. **Thời gian xử lý hiện tại:**
   - Tạo 1 shipment mất bao lâu? (ước tính: 15-20 phút)
   - Tìm xe phù hợp mất bao lâu? (ước tính: 30-60 phút)
   - Cập nhật trạng thái mất bao lâu? (ước tính: 5-10 phút/lần)
   - Đối soát cuối tháng mất bao lâu? (ước tính: 2-3 ngày)

2. **Tỷ lệ lỗi hiện tại:**
   - Bao nhiêu % shipment có sai sót về thông tin?
   - Bao nhiêu % invoice bị tranh chấp?
   - Bao nhiêu % POD bị thất lạc?

3. **Chi phí vận hành:**
   - Chi phí nhân công cho việc quản lý thủ công?
   - Chi phí do sai sót (refund, bồi thường)?
   - Chi phí cơ hội (mất khách do dịch vụ kém)?

4. **Khối lượng công việc:**
   - Bao nhiêu shipment/ngày?
   - Bao nhiêu xe trong đội?
   - Bao nhiêu tài xế?
   - Bao nhiêu khách hàng?

### 1.3 Success Metrics (Cần bổ sung)

**KPIs cần đo lường:**

```typescript
interface SuccessMetrics {
  // Operational Efficiency
  operational: {
    shipmentCreationTime: {
      current: '15-20 minutes',
      target: '< 5 minutes',
      measurement: 'Average time from order to shipment creation'
    },
    dispatchTime: {
      current: '30-60 minutes',
      target: '< 10 minutes',
      measurement: 'Time to find and assign vehicle/driver'
    },
    statusUpdateFrequency: {
      current: '2-3 times/day (manual calls)',
      target: '5-10 times/day (real-time)',
      measurement: 'Number of status updates per shipment'
    }
  },
  
  // Data Quality
  dataQuality: {
    dataAccuracy: {
      current: '~80% (estimated)',
      target: '> 99%',
      measurement: 'Percentage of shipments with correct data'
    },
    podCompleteness: {
      current: '~70% (many lost)',
      target: '> 95%',
      measurement: 'Percentage of shipments with POD uploaded'
    },
    auditTrail: {
      current: '0% (no tracking)',
      target: '100%',
      measurement: 'Percentage of changes with audit log'
    }
  },
  
  // Business Impact
  business: {
    invoiceAccuracy: {
      current: '~85% (many disputes)',
      target: '> 98%',
      measurement: 'Percentage of invoices without disputes'
    },
    monthEndClosing: {
      current: '2-3 days',
      target: '< 4 hours',
      measurement: 'Time to complete month-end reconciliation'
    },
    customerSatisfaction: {
      current: 'Unknown',
      target: '> 4.5/5',
      measurement: 'Customer satisfaction score'
    }
  },
  
  // User Adoption
  adoption: {
    activeUsers: {
      target: '> 80% of team using system daily',
      measurement: 'Daily active users / Total users'
    },
    featureUsage: {
      target: '> 90% of shipments created in system',
      measurement: 'Shipments in system / Total shipments'
    },
    trainingTime: {
      target: '< 2 hours per user',
      measurement: 'Time to train new user'
    }
  }
}
```

---

## 👥 Phần 2: Chi tiết hóa Personas

### 2.1 Ops (Operations Manager)

**Thông tin cơ bản:**
- **Tuổi**: 28-45
- **Kinh nghiệm**: 3-10 năm trong logistics
- **Kỹ năng công nghệ**: Trung bình (quen Excel, email)
- **Thời gian làm việc**: 8:00 - 18:00, thỉnh thoảng OT

**Một ngày làm việc điển hình:**
```
08:00 - 09:00: Check email, Zalo từ khách hàng về đơn hàng mới
09:00 - 11:00: Nhập đơn hàng vào Excel, tạo shipment
11:00 - 12:00: Gọi điện cho Dispatcher để confirm xe
12:00 - 13:00: Nghỉ trưa
13:00 - 15:00: Follow up các shipment đang chạy
15:00 - 17:00: Thu thập POD từ tài xế (qua Zalo)
17:00 - 18:00: Update Excel, báo cáo cho sếp
```

**Pain Points chi tiết:**
1. **Nhập liệu nhiều lần**: Nhập vào Excel, rồi copy sang Zalo, rồi gửi email cho khách
2. **Khó theo dõi**: Phải mở nhiều file Excel để xem tình trạng các shipment
3. **Sợ mất dữ liệu**: Excel crash hoặc ghi đè nhầm
4. **Khó tìm kiếm**: Tìm 1 shipment cũ mất nhiều thời gian
5. **Không biết xe đang ở đâu**: Phải gọi điện hỏi tài xế

**Goals & Motivations:**
- Muốn giảm thời gian nhập liệu
- Muốn theo dõi shipment real-time
- Muốn có báo cáo tự động
- Muốn giảm stress do sai sót

**User Stories:**

```gherkin
Feature: Shipment Management for Ops

Scenario: Create shipment quickly
  Given I am logged in as Ops
  When I receive a new order from customer
  Then I want to create a shipment in < 5 minutes
  So that I can process more orders per day

Scenario: Track shipment status
  Given I have created a shipment
  When I want to check its status
  Then I should see real-time status without calling anyone
  So that I can update customer immediately

Scenario: Find historical shipment
  Given I need to check a shipment from 3 months ago
  When I search by shipment number or customer name
  Then I should find it in < 10 seconds
  So that I can answer customer inquiries quickly

Scenario: Collect POD efficiently
  Given A shipment is completed
  When Driver uploads POD via mobile
  Then I should receive notification immediately
  So that I can close the shipment and invoice customer
```

### 2.2 Dispatcher

**Thông tin cơ bản:**
- **Tuổi**: 30-50
- **Kinh nghiệm**: 5-15 năm, biết rõ tài xế và xe
- **Kỹ năng công nghệ**: Cơ bản (dùng điện thoại, Zalo)
- **Thời gian làm việc**: 7:00 - 19:00 (ca dài)

**Một ngày làm việc điển hình:**
```
07:00 - 08:00: Check Zalo, xem shipment nào cần xe hôm nay
08:00 - 10:00: Gọi điện tìm xe và tài xế phù hợp
10:00 - 12:00: Confirm với Ops, gửi thông tin cho tài xế
12:00 - 13:00: Nghỉ trưa (vẫn nhận điện thoại)
13:00 - 15:00: Follow up tài xế, xử lý phát sinh
15:00 - 17:00: Chuẩn bị xe cho ngày mai
17:00 - 19:00: Update trạng thái cuối ngày
```

**Pain Points chi tiết:**
1. **Không biết xe nào available**: Phải gọi từng tài xế để hỏi
2. **Khó match xe với shipment**: Phải nhớ trong đầu xe nào phù hợp
3. **Tài xế không update**: Phải gọi liên tục để hỏi đến đâu rồi
4. **Xử lý phát sinh khó**: Xe hỏng giữa đường, phải tìm xe thay khẩn cấp
5. **Không có lịch sử**: Không biết tài xế nào hay delay, xe nào hay hỏng

**Goals & Motivations:**
- Muốn biết xe nào available ngay lập tức
- Muốn tài xế tự update trạng thái
- Muốn có data để đánh giá performance tài xế
- Muốn giảm số cuộc gọi điện thoại

**User Stories:**

```gherkin
Feature: Dispatch Management

Scenario: Find available vehicle quickly
  Given I have a new shipment to assign
  When I open dispatch dashboard
  Then I should see all available vehicles and drivers
  So that I can assign in < 2 minutes

Scenario: Assign vehicle and driver
  Given I found a suitable vehicle
  When I assign it to a shipment
  Then Driver should receive notification immediately
  And Ops should see the assignment
  So that everyone is on the same page

Scenario: Handle vehicle breakdown
  Given A vehicle breaks down mid-transit
  When I need to reassign to another vehicle
  Then I should be able to reassign in < 5 minutes
  And Keep full history of the change
  So that I can handle emergencies efficiently

Scenario: Track driver performance
  Given I want to evaluate drivers
  When I check driver history
  Then I should see on-time rate, completion rate
  So that I can assign better drivers to important shipments
```

### 2.3 Accounting

**Thông tin cơ bản:**
- **Tuổi**: 25-40
- **Kinh nghiệm**: 2-8 năm trong accounting
- **Kỹ năng công nghệ**: Tốt (Excel advanced, accounting software)
- **Thời gian làm việc**: 8:00 - 17:00, OT cuối tháng

**Một ngày làm việc điển hình:**
```
08:00 - 09:00: Check email, xem shipment nào hoàn thành
09:00 - 11:00: Kiểm tra chi phí, tính toán cước phí
11:00 - 12:00: Tạo invoice draft
12:00 - 13:00: Nghỉ trưa
13:00 - 15:00: Gửi invoice cho khách, follow up payment
15:00 - 17:00: Đối soát công nợ, update Excel
Cuối tháng: OT 2-3 ngày để đối soát tổng
```

**Pain Points chi tiết:**
1. **Tính toán phức tạp**: Nhiều loại phí (cước chính, phụ phí, phát sinh)
2. **Dữ liệu không đầy đủ**: Thiếu POD, thiếu thông tin chi phí
3. **Tranh chấp với khách**: Khách không đồng ý với invoice
4. **Đối soát mất thời gian**: Phải đối chiếu nhiều file Excel
5. **Không có báo cáo**: Không biết doanh thu, lợi nhuận real-time

**Goals & Motivations:**
- Muốn tính toán tự động, giảm sai sót
- Muốn có đầy đủ POD và thông tin để lập invoice
- Muốn giảm tranh chấp với khách hàng
- Muốn đối soát nhanh hơn

**User Stories:**

```gherkin
Feature: Financial Management

Scenario: Calculate charges automatically
  Given A shipment is completed
  When I review the charges
  Then System should calculate all fees automatically
  So that I don't make calculation errors

Scenario: Create invoice with POD
  Given I need to invoice a customer
  When I create invoice
  Then System should include all PODs and supporting documents
  So that Customer can verify and pay quickly

Scenario: Handle invoice disputes
  Given Customer disputes an invoice
  When I check the shipment history
  Then I should see complete audit trail
  So that I can resolve dispute with evidence

Scenario: Month-end reconciliation
  Given It's end of month
  When I run reconciliation report
  Then System should show all completed shipments and payments
  So that I can close books in < 4 hours instead of 2-3 days
```

### 2.4 Driver (Tài xế)

**Thông tin cơ bản:**
- **Tuổi**: 25-55
- **Kinh nghiệm**: 3-20 năm lái xe
- **Kỹ năng công nghệ**: Cơ bản (dùng smartphone, Zalo)
- **Thời gian làm việc**: Không cố định, theo chuyến

**Một ngày làm việc điển hình:**
```
06:00 - 07:00: Nhận lệnh qua Zalo từ Dispatcher
07:00 - 08:00: Chuẩn bị xe, đi lấy container
08:00 - 12:00: Vận chuyển đến điểm giao
12:00 - 13:00: Nghỉ trưa
13:00 - 17:00: Tiếp tục vận chuyển hoặc trả container
17:00 - 18:00: Chụp POD, gửi Zalo cho Ops
```

**Pain Points chi tiết:**
1. **Nhận lệnh không rõ ràng**: Zalo message thiếu thông tin
2. **Không biết lịch trình**: Không biết ngày mai có việc không
3. **Khó báo cáo sự cố**: Phải gọi điện, giải thích nhiều lần
4. **Chụp POD rồi quên gửi**: Ảnh nằm trong máy, không gửi kịp
5. **Không có bằng chứng**: Nếu có tranh chấp, không có proof

**Goals & Motivations:**
- Muốn nhận lệnh rõ ràng, đầy đủ thông tin
- Muốn biết lịch trình trước
- Muốn báo cáo sự cố dễ dàng
- Muốn upload POD ngay, không lo quên

**User Stories:**

```gherkin
Feature: Driver Mobile App (Future M3)

Scenario: Receive clear assignment
  Given Dispatcher assigns me to a shipment
  When I open mobile app
  Then I should see full details (pickup, delivery, contact, special instructions)
  So that I know exactly what to do

Scenario: Update status easily
  Given I arrive at pickup location
  When I tap "Arrived at Pickup"
  Then Status is updated automatically
  And Dispatcher sees it immediately
  So that I don't need to call

Scenario: Upload POD immediately
  Given I complete delivery
  When I take photo of POD
  Then I can upload it immediately via app
  So that I don't forget later

Scenario: Report issues quickly
  Given My vehicle breaks down
  When I report issue via app
  Then Dispatcher receives alert immediately
  And Can arrange backup vehicle
  So that Shipment is not delayed too much
```

---

## 🔄 Phần 3: Chi tiết hóa Core Flows

### 3.1 Flow 1: Tạo Order từ Khách hàng

**Current Process (Excel/Zalo):**
```
1. Khách gửi yêu cầu qua Zalo/Email
2. Ops đọc và ghi chép thông tin
3. Ops mở Excel, tìm dòng trống
4. Ops nhập thông tin thủ công
5. Ops gửi lại Zalo confirm cho khách
6. Ops forward cho Dispatcher qua Zalo
Total time: 15-20 minutes
Error rate: ~15% (thiếu thông tin, nhập sai)
```

**Proposed Process (System):**
```
1. Khách gửi yêu cầu qua Zalo/Email (unchanged)
2. Ops login vào system
3. Ops click "Create Order"
4. Ops fill form với validation
5. System auto-generate order number
6. System send confirmation email to customer (optional)
7. Order appears in Dispatcher dashboard automatically
Total time: < 5 minutes
Error rate: < 2% (validation prevents errors)
```

**Detailed Steps:**

```typescript
// Step-by-step flow
interface CreateOrderFlow {
  step1: {
    action: 'Ops clicks "Create Order" button',
    screen: 'Orders List Page',
    validation: 'User must have OPS or ADMIN role'
  },
  
  step2: {
    action: 'Ops selects existing customer or creates new',
    screen: 'Create Order Form - Customer Selection',
    fields: {
      customerSearch: 'Autocomplete search by name/code',
      createNew: 'Button to create new customer inline'
    },
    validation: 'Customer must be selected or created'
  },
  
  step3: {
    action: 'Ops fills order details',
    screen: 'Create Order Form - Order Details',
    fields: {
      description: 'Text area, max 500 chars',
      totalWeight: 'Number, in kg',
      totalVolume: 'Number, in m³',
      specialInstructions: 'Text area, optional',
      priority: 'Dropdown: LOW, NORMAL, HIGH, URGENT'
    },
    validation: {
      description: 'Required, min 10 chars',
      totalWeight: 'Optional, must be > 0 if provided',
      totalVolume: 'Optional, must be > 0 if provided'
    }
  },
  
  step4: {
    action: 'System generates order number',
    format: 'ORD-YYYYMMDD-XXX',
    example: 'ORD-20240122-001',
    logic: 'Auto-increment per day'
  },
  
  step5: {
    action: 'Ops reviews and submits',
    screen: 'Create Order Form - Review',
    display: 'Show all entered information',
    actions: ['Edit', 'Submit', 'Cancel']
  },
  
  step6: {
    action: 'System creates order',
    database: 'Insert into Order table',
    status: 'CONFIRMED',
    notification: 'Optional email to customer'
  },
  
  step7: {
    action: 'Redirect to order details',
    screen: 'Order Details Page',
    nextAction: 'Create Shipment button visible'
  }
}
```

**Edge Cases:**

1. **Customer không tồn tại trong hệ thống**
   - Solution: Inline customer creation form
   - Fields: Name, Email, Phone, Address
   - Validation: Email format, phone format

2. **Duplicate order (khách gửi 2 lần)**
   - Detection: Check same customer + similar description + same day
   - Warning: "Similar order exists, continue?"
   - Action: Allow user to decide

3. **Order quá lớn (vượt capacity)**
   - Validation: Warning if weight > 20 tons or volume > 50 m³
   - Message: "This order may require multiple shipments"
   - Action: Allow creation, suggest splitting

4. **Thông tin không đầy đủ**
   - Validation: Mark required fields
   - Save as DRAFT: Allow saving incomplete order
   - Complete later: Can edit and submit when ready

### 3.2 Flow 2: Tạo Shipment từ Order

**Current Process:**
```
1. Ops xem Order trong Excel
2. Ops tạo dòng mới trong sheet "Shipments"
3. Ops copy thông tin từ Order
4. Ops thêm thông tin điểm lấy/giao
5. Ops gửi Zalo cho Dispatcher
Total time: 10-15 minutes
Error rate: ~10% (copy sai, thiếu thông tin)
```

**Proposed Process:**
```
1. Ops opens Order details
2. Ops clicks "Create Shipment"
3. System pre-fills order information
4. Ops adds stops (pickup, delivery, etc.)
5. System validates and creates shipment
6. Shipment appears in Dispatcher dashboard
Total time: < 5 minutes
Error rate: < 2%
```

**Detailed Steps:**

```typescript
interface CreateShipmentFlow {
  step1: {
    action: 'Ops clicks "Create Shipment" from Order details',
    screen: 'Order Details Page',
    precondition: 'Order status must be CONFIRMED'
  },
  
  step2: {
    action: 'System opens shipment creation wizard',
    screen: 'Create Shipment Wizard - Step 1: Basic Info',
    preFilled: {
      orderId: 'Auto-filled from current order',
      orderNumber: 'Display only',
      customerName: 'Display only'
    },
    fields: {
      priority: 'Dropdown, default from order',
      plannedStartDate: 'DateTime picker',
      plannedEndDate: 'DateTime picker',
      specialInstructions: 'Text area, optional'
    },
    validation: {
      plannedEndDate: 'Must be after plannedStartDate',
      dates: 'Cannot be in the past'
    }
  },
  
  step3: {
    action: 'Ops adds stops',
    screen: 'Create Shipment Wizard - Step 2: Stops',
    interface: {
      addStop: 'Button to add new stop',
      stopList: 'List of stops with drag-to-reorder',
      stopForm: {
        sequence: 'Auto-assigned, can reorder',
        stopType: 'Dropdown: PICKUP, DROPOFF, DEPOT, PORT',
        locationName: 'Text input or select from saved locations',
        address: 'Text input with Google Maps autocomplete (future)',
        contactPerson: 'Text input, optional',
        contactPhone: 'Text input with format validation',
        plannedArrival: 'DateTime picker',
        plannedDeparture: 'DateTime picker',
        specialInstructions: 'Text area, optional'
      }
    },
    validation: {
      minStops: 'At least 2 stops required',
      sequence: 'Must be unique and sequential',
      times: 'Arrival < Departure for each stop',
      chronological: 'Stop times must be chronological'
    },
    features: {
      savedLocations: 'Dropdown of frequently used locations',
      copyFromPrevious: 'Copy stops from previous shipment',
      templates: 'Load stop template (e.g., "Standard Port Route")'
    }
  },
  
  step4: {
    action: 'Ops reviews shipment',
    screen: 'Create Shipment Wizard - Step 3: Review',
    display: {
      orderInfo: 'Order number, customer, description',
      shipmentInfo: 'Priority, dates',
      stops: 'List of all stops with timeline',
      warnings: 'Any validation warnings'
    },
    actions: ['Back to Edit', 'Create Shipment', 'Cancel']
  },
  
  step5: {
    action: 'System creates shipment',
    database: {
      shipment: 'Insert into Shipment table',
      stops: 'Insert into ShipmentStop table',
      statusEvent: 'Create initial status event (DRAFT)'
    },
    shipmentNumber: 'Auto-generate: SH-YYYYMMDD-XXX',
    status: 'DRAFT'
  },
  
  step6: {
    action: 'Redirect to shipment details',
    screen: 'Shipment Details Page',
    nextActions: [
      'Edit Shipment (if still DRAFT)',
      'Mark as READY (to make available for dispatch)',
      'Add more stops',
      'Cancel shipment'
    ]
  }
}
```

**Edge Cases:**

1. **Order đã có nhiều shipments**
   - Display: Show existing shipments
   - Warning: "This order already has X shipments"
   - Action: Allow creating more

2. **Stops không hợp lý (thời gian)**
   - Validation: Check if timeline is realistic
   - Warning: "Time between stops may be too short"
   - Action: Allow override with confirmation

3. **Location không rõ ràng**
   - Feature: Google Maps integration (future)
   - Current: Free text input
   - Suggestion: Save frequently used locations

4. **Shipment quá phức tạp (nhiều stops)**
   - Limit: Max 10 stops per shipment
   - Reason: Keep it manageable
   - Alternative: Create multiple shipments

### 3.3 Flow 3: Dispatch (Gán xe và tài xế)

**Current Process:**
```
1. Dispatcher xem Zalo message từ Ops
2. Dispatcher gọi điện tìm xe available
3. Dispatcher gọi điện tìm tài xế available
4. Dispatcher gửi Zalo cho tài xế với thông tin
5. Dispatcher update Excel
6. Dispatcher gửi Zalo confirm cho Ops
Total time: 30-60 minutes
Error rate: ~20% (gán sai xe, tài xế không nhận được thông tin)
```

**Proposed Process:**
```
1. Dispatcher opens dispatch dashboard
2. System shows pending shipments + available resources
3. Dispatcher selects shipment
4. Dispatcher assigns vehicle and driver
5. System sends notification to driver (future: mobile app)
6. Status updated automatically
Total time: < 5 minutes
Error rate: < 5%
```

**Detailed Steps:**

```typescript
interface DispatchFlow {
  step1: {
    action: 'Dispatcher opens dashboard',
    screen: 'Dispatcher Dashboard',
    display: {
      pendingShipments: {
        filter: 'Status = READY',
        sort: 'By priority DESC, plannedStartDate ASC',
        columns: [
          'Shipment Number',
          'Customer',
          'Priority',
          'Planned Start',
          'Stops Count',
          'Actions'
        ]
      },
      availableVehicles: {
