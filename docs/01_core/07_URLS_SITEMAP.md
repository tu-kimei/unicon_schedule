# 8. URLs & Site Map - Unicon Schedule System

## Overview

This document contains the complete URL structure and site map for the Unicon Schedule logistics management system. All URLs are relative to the base application URL (http://localhost:3000 in development).

## Base URL
```
http://localhost:3000
```

## 🔐 Authentication URLs

| Page | URL | HTTP Method | Auth Required | Description |
|------|-----|-------------|---------------|-------------|
| **Login** | `/login` | GET | ❌ No | User login with email/password |
| **Signup** | `/signup` | GET | ❌ No | User registration form |
| **Email Verification** | `/email-verification` | GET | ❌ No | Email verification after signup |
| **Request Password Reset** | `/request-password-reset` | GET | ❌ No | Request password reset form |
| **Password Reset** | `/password-reset` | GET | ❌ No | Password reset with token |

## 🚛 Logistics System URLs

### Operations (Ops) URLs

| Page | URL | HTTP Method | Auth Required | Role Required | Description |
|------|-----|-------------|---------------|---------------|-------------|
| **Ops Dashboard** | `/` | GET | ✅ Yes | OPS, ADMIN | Main dashboard - view all shipments |
| **Create Shipment** | `/ops/shipments/create` | GET | ✅ Yes | OPS, ADMIN | 3-step shipment creation wizard |
| **Shipment Details** | `/ops/shipments/{id}` | GET | ✅ Yes | OPS, ADMIN | Detailed view of specific shipment |

**URL Parameters:**
- `{id}`: Shipment UUID (e.g., `/ops/shipments/123e4567-e89b-12d3-a456-426614174000`)

### Dispatcher URLs

| Page | URL | HTTP Method | Auth Required | Role Required | Description |
|------|-----|-------------|---------------|---------------|-------------|
| **Dispatcher Dashboard** | `/dispatcher` | GET | ✅ Yes | DISPATCHER, ADMIN | Assign vehicles and drivers to shipments |

## 📊 API Endpoints

### Query Endpoints (Data Fetching)

| Endpoint | HTTP Method | Auth Required | Entities | Description |
|----------|-------------|---------------|----------|-------------|
| `/operations/get-all-shipments` | POST | ✅ Yes | Shipment, ShipmentStop, Dispatch, Vehicle, Driver, ShipmentStatusEvent, POD | Get all shipments with filters |
| `/operations/get-shipment` | POST | ✅ Yes | Same as above | Get single shipment by ID |
| `/operations/get-pending-shipments` | POST | ✅ Yes | Shipment, ShipmentStop | Get shipments awaiting dispatch |
| `/operations/get-available-vehicles` | POST | ✅ Yes | Vehicle | Get available vehicles |
| `/operations/get-available-drivers` | POST | ✅ Yes | Driver, User | Get available drivers |
| `/operations/get-available-orders` | POST | ✅ Yes | Order, Customer | Get available orders for shipment creation |

### Action Endpoints (Business Operations)

| Endpoint | HTTP Method | Auth Required | Entities | Description |
|----------|-------------|---------------|----------|-------------|
| `/operations/create-shipment` | POST | ✅ Yes | Shipment, ShipmentStop | Create new shipment |
| `/operations/update-shipment` | POST | ✅ Yes | Shipment, ShipmentStop | Update existing shipment |
| `/operations/create-dispatch` | POST | ✅ Yes | Dispatch, Shipment, Vehicle, Driver | Assign dispatch to shipment |
| `/operations/update-shipment-status` | POST | ✅ Yes | Shipment, ShipmentStatusEvent, ShipmentStop | Update shipment status |
| `/operations/upload-pod` | POST | ✅ Yes | POD, Shipment | Upload proof of delivery |

## 🔄 User Flow & Navigation Map

### Authentication Flow
```
Public Access
├── /signup → Email verification → /
├── /login → /
├── /request-password-reset → /password-reset → /
└── /email-verification → /
```

### Main Application Flow
```
Authenticated Users (/)
├── OPS/ADMIN Users
│   ├── View Dashboard (/)
│   ├── Create Shipment (/ops/shipments/create)
│   └── View Shipment Details (/ops/shipments/{id})
│
└── DISPATCHER/ADMIN Users
    └── Dispatcher Dashboard (/dispatcher)
        ├── View Pending Shipments
        ├── Assign Vehicles & Drivers
        └── Update Shipment Status
```

### Complete Site Map
```
📁 Unicon Schedule (http://localhost:3000)
├── 🔐 Authentication
│   ├── /login (LoginPage)
│   ├── /signup (SignupPage)
│   ├── /email-verification (EmailVerificationPage)
│   ├── /request-password-reset (RequestPasswordResetPage)
│   └── /password-reset (PasswordResetPage)
│
├── 🏠 Main Application (Auth Required)
│   ├── / (OpsShipmentsPage) - OPS Dashboard
│   ├── /ops/shipments/create (CreateShipmentPage)
│   ├── /ops/shipments/{id} (ShipmentDetailsPage)
│   └── /dispatcher (DispatcherDashboardPage)
│
└── 🔌 API Endpoints
    ├── Queries (POST /operations/*)
    └── Actions (POST /operations/*)
```

## 🎯 User Role Access Matrix

| URL | OPS | DISPATCHER | ACCOUNTING | DRIVER | ADMIN | Public |
|-----|-----|------------|------------|--------|-------|--------|
| `/login` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/signup` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/ops/shipments/create` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/ops/shipments/{id}` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/dispatcher` | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| API Endpoints | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |

## 🔍 URL Patterns & Parameters

### Dynamic URL Parameters
```
Shipment Details: /ops/shipments/:id
Where :id is a valid UUID (36 characters)
Example: /ops/shipments/123e4567-e89b-12d3-a456-426614174000
```

### Query Parameters (Future Implementation)
```
Shipment List Filtering: /?status=ASSIGNED&priority=HIGH
Date Range: /?startDate=2024-01-01&endDate=2024-01-31
Pagination: /?page=1&pageSize=20
```

## 🚀 Development URLs

### Local Development
```
Base URL: http://localhost:3000
Database: postgresql://localhost:5432 (managed by Wasp)
```

### Production URLs (Future)
```
Base URL: https://schedule.unicon.ltd
Database: External PostgreSQL instance
Email: Lark Suite SMTP (Production)
```

## 📱 Mobile Responsiveness

All pages are designed to be mobile-responsive:

- **Desktop**: Full layout with sidebars and multi-column grids
- **Tablet**: Adapted layouts with collapsible elements
- **Mobile**: Single-column layout with touch-friendly buttons

## 🔒 Security & Access Control

### Route Protection
- **Public Routes**: `/login`, `/signup`, `/email-verification`, `/request-password-reset`, `/password-reset`
- **Protected Routes**: All others require authentication
- **Role-based Access**: API endpoints validate user roles

### Redirect Rules
```
Not Authenticated → /login
Wrong Role Access → / (home dashboard)
Invalid URLs → / (404 handling)
```

## 📊 Monitoring & Analytics

### Key URLs for Monitoring
- **User Registration**: Track `/signup` conversions
- **Login Success**: Monitor `/login` to dashboard redirects
- **Shipment Creation**: Track `/ops/shipments/create` usage
- **Dispatch Assignment**: Monitor `/dispatcher` activity

### Performance Metrics
- **Page Load Times**: All routes < 2 seconds
- **API Response Times**: All endpoints < 500ms
- **Error Rates**: Track 4xx/5xx responses

## 🔧 Maintenance & Administration

### Admin URLs (Future Implementation)
```
Admin Dashboard: /admin
User Management: /admin/users
System Settings: /admin/settings
Audit Logs: /admin/logs
```

### Health Check Endpoints (Future)
```
Health Check: /health
Database Status: /health/db
API Status: /health/api
```

## 📋 Testing Checklist

### URL Testing
- [ ] All public URLs accessible without authentication
- [ ] All protected URLs redirect to login when not authenticated
- [ ] Role-based access works correctly
- [ ] Dynamic URL parameters work (shipment IDs)
- [ ] 404 handling for invalid URLs

### Navigation Testing
- [ ] Authentication flow works end-to-end
- [ ] User role redirects work correctly
- [ ] Back/forward browser navigation works
- [ ] Bookmarking URLs works after login

### Mobile Testing
- [ ] All URLs work on mobile devices
- [ ] Touch interactions work properly
- [ ] Responsive layouts display correctly

---

## 📞 Support & Documentation Links

- **API Contracts**: `docs/06_API_CONTRACTS.md`
- **UI Design**: `docs/07_UI_DESIGN.md`
- **Architecture**: `docs/03_ARCHITECTURE.md`
- **Database Schema**: `docs/04_ERD.md`
- **Setup Guide**: `README.md`
