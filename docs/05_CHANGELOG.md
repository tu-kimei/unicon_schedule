# Changelog

## v0.3 – M1 Implementation Complete

- **✅ Database Migration**: PostgreSQL schema deployed với migration `20251222044353_init_db_for_m1`
- **✅ Wasp Configuration**: Full logistics system routes, queries, và actions
- **✅ Backend Implementation**: Complete business logic cho Shipment, Dispatch, Status, POD
- **✅ UI Components**: StatusBadge, ShipmentCard, OpsShipmentsPage với state management
- **✅ Authentication**: Updated User model với email/fullName, role-based access
- **✅ Email System**: Dummy email provider configured, Lark Suite SMTP details documented for production setup
- **✅ Documentation**: Comprehensive README với setup instructions, API docs, và URL site map

## v0.2 – M1 Technical Design

- **ERD v0.2**: Thiết kế chi tiết database schema với entities, relationships, và Mermaid diagram
- **Prisma Schema**: Tạo schema hoàn chỉnh cho PostgreSQL với enums, indexes, và constraints
- **API Contracts**: Định nghĩa endpoints cho Shipment CRUD, Dispatch, Status updates, POD upload
- **UI Design**: Component structure và state management cho Ops & Dispatcher pages
- **Migration Strategy**: Chi tiết migration từ v0.1 → v0.2 với risk mitigation
- **Validation Rules**: Business logic validation cho tất cả operations
- **Authorization Matrix**: Role-based access control per endpoint

## v0.1 – Initial project documentation

- Khởi tạo context dự án logistics container nội địa
- Định nghĩa PRD v0.1 (core flows, scope M1)
- Lập plan triển khai theo milestone
- Định hướng kiến trúc và ERD nền tảng
- Bổ sung chi tiết vai trò, quyền hạn và các mối quan hệ trong tài liệu
