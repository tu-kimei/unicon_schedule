# Unicon Schedule - Logistics Management System

Hệ thống quản lý vận tải container nội địa cho doanh nghiệp logistics.

## Tính năng chính (M1)

- **Quản lý Shipment**: CRUD operations với multi-stop support
- **Dispatch Assignment**: Gán xe và tài xế cho shipment
- **Status Tracking**: Theo dõi trạng thái shipment theo thời gian
- **POD Upload**: Upload hình ảnh/văn bản proof of delivery
- **Role-based Access**: Phân quyền cho Ops, Dispatcher, Driver, Accounting

## Kiến trúc kỹ thuật

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Wasp Actions (Node.js)
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: Email/Password với role-based access

## Prerequisites

- **Node.js v22.12.0+**: Cài đặt qua nvm
  ```sh
  nvm install 22
  nvm use 22
  ```
- **Wasp CLI**: Cài đặt từ source
  ```sh
  curl -sSL https://get.wasp.sh/installer.sh | sh
  ```
- **PostgreSQL**: Managed by Wasp (hoặc external instance)
- **SMTP Server**: Cho email notifications (production)

## Quick Start

1. **Clone & Setup**:
   ```bash
   git clone <repo>
   cd unicon_schedule
   npm install
   ```

2. **Database Setup**:
   ```bash
   # Start PostgreSQL (managed by Wasp)
   wasp start db

   # In another terminal, run migration
   wasp db migrate-dev
   ```

3. **Start Development Server**:
   ```bash
   wasp start
   ```

4. **Access Application**:
   - Frontend: http://localhost:3000
   - Database: postgresql://localhost:5432 (managed)

## Project Structure

```
unicon_schedule/
├── docs/                    # Documentation
│   ├── 00_CONTEXT.md       # Business context
│   ├── 01_PRD.md          # Product requirements
│   ├── 04_ERD.md          # Database schema
│   └── 06_API_CONTRACTS.md # API specifications
├── src/
│   ├── logistics/          # Core business logic
│   │   ├── actions/        # Wasp actions (mutations)
│   │   ├── queries/        # Wasp queries
│   │   ├── components/     # Reusable UI components
│   │   └── pages/          # Page components
│   └── auth/               # Authentication
├── schema.prisma           # Database schema
└── main.wasp              # Wasp configuration
```

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **OPS** | Create/edit shipments, view all, upload POD |
| **DISPATCHER** | Assign vehicles/drivers, update status |
| **DRIVER** | Update shipment status, upload POD |
| **ACCOUNTING** | View shipments for invoicing |
| **ADMIN** | All permissions |

## Development Workflow

### Adding New Features

1. **Update Schema** (`schema.prisma`)
2. **Create Queries/Actions** (`src/logistics/`)
3. **Update Wasp Config** (`main.wasp`)
4. **Create UI Components** (`src/logistics/components/`)
5. **Run Migration**: `wasp db migrate-dev`

### Code Quality

- **TypeScript**: Strict typing enabled
- **ESLint**: Code quality checks
- **Prettier**: Code formatting
- **Wasp Linting**: Framework-specific rules

## API Overview

### Core Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/shipments` | Create shipment | OPS/ADMIN |
| PUT | `/api/shipments/{id}` | Update shipment | OPS/ADMIN |
| POST | `/api/shipments/{id}/dispatch` | Assign dispatch | DISPATCHER/ADMIN |
| PATCH | `/api/shipments/{id}/status` | Update status | Role-based |
| POST | `/api/shipments/{id}/pods` | Upload POD | DRIVER/OPS/ADMIN |

### Response Format

```typescript
// Success Response
{
  success: true,
  data: { /* result */ }
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

## Deployment

### Production Build

```bash
# Build for production
wasp build

# Start production server
wasp build start
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
WASP_WEB_CLIENT_URL="https://yourdomain.com"
```

## Contributing

1. **Branch Strategy**: `feature/`, `bugfix/`, `hotfix/`
2. **Code Review**: Required for all changes
3. **Testing**: Unit tests for critical business logic
4. **Documentation**: Update docs for schema/API changes

## Learn More

- [Wasp Documentation](https://wasp.sh/docs)
- [Prisma ORM](https://www.prisma.io/docs)
- [React + TypeScript](https://react-typescript-cheatsheet.netlify.app/)
