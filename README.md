# 🚛 Unicon Schedule - Container Logistics Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Wasp](https://img.shields.io/badge/Wasp-0.13-orange.svg)](https://wasp-lang.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

> Internal logistics management system for domestic container transportation operations

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Unicon Schedule is a comprehensive logistics management system designed to streamline domestic container transportation operations. It replaces manual Excel/Zalo-based workflows with a modern, data-driven platform that provides:

- **Real-time shipment tracking** from order creation to delivery completion
- **Automated dispatch management** for vehicle and driver assignment
- **Digital POD (Proof of Delivery)** with image/document upload
- **Comprehensive audit trails** for all operations
- **Business intelligence** through data analytics and reporting

### Problem Statement

Transportation companies currently manage operations through:
- ❌ Excel spreadsheets (error-prone, no real-time updates)
- ❌ Zalo messaging (unstructured, hard to track)
- ❌ Manual processes (time-consuming, no audit trail)

### Solution

✅ Centralized web application with:
- Real-time status updates
- Automated workflows
- Complete audit history
- Data-driven insights

---

## ✨ Features

### Core Features (M1 - Current)

#### 🚢 Shipment Management
- Create and manage shipments with multiple stops
- Track shipment lifecycle: Draft → Ready → Assigned → In Transit → Completed
- Multi-stop routing with sequence management
- Priority levels (Low, Normal, High, Urgent)

#### 🚗 Dispatch Operations
- Assign vehicles and drivers to shipments
- View available resources in real-time
- Track dispatch history and performance
- Handle reassignments and exceptions

#### 📊 Status Tracking
- Real-time status updates with timestamps
- Complete status history timeline
- Event logging for audit purposes
- Location tracking (manual entry)

#### 📸 POD Management
- Upload proof of delivery documents (JPG, PNG, PDF)
- Attach PODs to specific stops or general shipment
- Immutable POD records after submission
- File size limit: 5MB per file

#### 👥 User Roles
- **Ops**: Create/manage shipments, upload PODs
- **Dispatcher**: Assign vehicles/drivers, update status
- **Accounting**: View shipments, manage invoices (future)
- **Driver**: View assignments, update status, upload PODs (future mobile app)
- **Admin**: Full system access

### Upcoming Features (M2-M3)

- 💰 Financial management (charges, invoices)
- 📈 KPI dashboards and analytics
- 📱 Mobile app for drivers
- 🔔 Real-time notifications
- 🗺️ GPS tracking integration
- 🤖 Automated route optimization

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) with TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: React Context + Hooks
- **Routing**: React Router (via Wasp)

### Backend
- **Framework**: [Wasp](https://wasp-lang.dev/) (Full-stack framework)
- **Runtime**: Node.js 18+
- **API**: REST-like Actions & Queries
- **Authentication**: JWT-based with email/password

### Database
- **Database**: [PostgreSQL 15](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Migrations**: Prisma Migrate
- **Hosting**: [Supabase](https://supabase.com/) (recommended)

### Infrastructure
- **Hosting**: [Vercel](https://vercel.com/) (recommended)
- **File Storage**: [Cloudinary](https://cloudinary.com/)
- **Email**: Lark Suite SMTP
- **Monitoring**: [Sentry](https://sentry.io/)
- **Analytics**: Vercel Analytics

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **PostgreSQL**: 15.x or higher
- **Wasp CLI**: Latest version

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/unicon_schedule.git
   cd unicon_schedule
   ```

2. **Install Wasp CLI** (if not already installed)
   ```bash
   curl -sSL https://get.wasp-lang.dev/installer.sh | sh
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.server
   ```
   
   Edit `.env.server` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/unicon_schedule"
   JWT_SECRET="your-secret-key-change-in-production"
   SMTP_HOST="smtp.larksuite.com"
   SMTP_PORT="465"
   SMTP_USER="no-reply@unicon.ltd"
   SMTP_PASSWORD="your-smtp-password"
   ```

5. **Run database migrations**
   ```bash
   wasp db migrate-dev
   ```

6. **Start development server**
   ```bash
   wasp start
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### First-time Setup

1. **Create admin user** (via Prisma Studio)
   ```bash
   npx prisma studio
   ```
   Navigate to User table and create an admin account.

2. **Seed test data** (optional)
   ```bash
   npm run seed
   ```

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

### Core Documentation
- **[00_CONTEXT.md](docs/00_CONTEXT.md)** - Project background and objectives
- **[01_PRD.md](docs/01_PRD.md)** - Product requirements and user stories
- **[02_PLAN.md](docs/02_PLAN.md)** - Development roadmap and milestones
- **[03_ARCHITECTURE.md](docs/03_ARCHITECTURE.md)** - System architecture overview
- **[04_ERD.md](docs/04_ERD.md)** - Database schema and relationships

### Technical Documentation
- **[06_API_CONTRACTS.md](docs/06_API_CONTRACTS.md)** - API endpoints and contracts
- **[07_UI_DESIGN.md](docs/07_UI_DESIGN.md)** - UI components and patterns
- **[08_URLS_AND_SITEMAP.md](docs/08_URLS_AND_SITEMAP.md)** - URL structure and routing

### Operational Documentation
- **[09_TESTING_STRATEGY.md](docs/09_TESTING_STRATEGY.md)** - Testing approach and guidelines
- **[10_DEPLOYMENT.md](docs/10_DEPLOYMENT.md)** - Deployment procedures and CI/CD
- **[11_SECURITY.md](docs/11_SECURITY.md)** - Security guidelines and best practices
- **[12_DATA_MIGRATION.md](docs/12_DATA_MIGRATION.md)** - Data migration from Excel/Zalo
- **[13_PERFORMANCE.md](docs/13_PERFORMANCE.md)** - Performance optimization guide
- **[14_MONITORING.md](docs/14_MONITORING.md)** - Monitoring and alerting setup
- **[15_RUNBOOK.md](docs/15_RUNBOOK.md)** - Operational runbook and troubleshooting

### Change Log
- **[05_CHANGELOG.md](docs/05_CHANGELOG.md)** - Version history and updates
- **[REVIEW_AND_IMPROVEMENTS.md](docs/REVIEW_AND_IMPROVEMENTS.md)** - Documentation review and gaps

---

## 📁 Project Structure

```
unicon_schedule/
├── docs/                      # Documentation
│   ├── 00_CONTEXT.md
│   ├── 01_PRD.md
│   ├── ...
│   └── 15_RUNBOOK.md
│
├── src/                       # Source code
│   ├── auth/                  # Authentication pages
│   │   ├── AuthLayout.tsx
│   │   └── email/            # Email auth components
│   │
│   ├── logistics/            # Logistics domain
│   │   ├── actions/          # Server actions
│   │   │   ├── shipments.ts
│   │   │   ├── dispatch.ts
│   │   │   ├── status.ts
│   │   │   └── pods.ts
│   │   │
│   │   ├── queries/          # Server queries
│   │   │   ├── shipments.ts
│   │   │   ├── dispatch.ts
│   │   │   └── orders.ts
│   │   │
│   │   ├── components/       # React components
│   │   │   ├── StatusBadge.tsx
│   │   │   └── ShipmentCard.tsx
│   │   │
│   │   └── pages/            # Page components
│   │       ├── OpsShipmentsPage.tsx
│   │       ├── CreateShipmentPage.tsx
│   │       ├── DispatcherDashboardPage.tsx
│   │       └── ShipmentDetailsPage.tsx
│   │
│   ├── shared/               # Shared components
│   │   └── components/
│   │       ├── Button.tsx
│   │       ├── Dialog.tsx
│   │       ├── Header.tsx
│   │       ├── Input.tsx
│   │       └── Portal.tsx
│   │
│   ├── App.tsx               # Root component
│   └── App.css               # Global styles
│
├── migrations/               # Database migrations
│   └── 20251222044353_init_db_for_m1/
│
├── public/                   # Static assets
│   └── favicon.ico
│
├── main.wasp                 # Wasp configuration
├── schema.prisma             # Prisma schema
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind config
├── vite.config.ts            # Vite config
└── README.md                 # This file
```

---

## 💻 Development

### Available Scripts

```bash
# Start development server
wasp start

# Run database migrations
wasp db migrate-dev

# Open Prisma Studio (database GUI)
wasp db studio

# Build for production
wasp build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   ```bash
   wasp start
   # Test your changes
   ```

3. **Run linter and tests**
   ```bash
   npm run lint
   npm test
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with recommended rules
- **Naming**: camelCase for variables, PascalCase for components
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🚢 Deployment

### Production Deployment

See [docs/10_DEPLOYMENT.md](docs/10_DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy to Vercel:**

1. **Build the application**
   ```bash
   wasp build
   ```

2. **Deploy to Vercel**
   ```bash
   cd .wasp/build/web-app
   vercel --prod
   ```

3. **Set environment variables** in Vercel Dashboard

4. **Run database migrations**
   ```bash
   DATABASE_URL="production-url" wasp db migrate-deploy
   ```

### Environment Variables (Production)

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-random-secret"
SMTP_HOST="smtp.larksuite.com"
SMTP_PORT="465"
SMTP_USER="no-reply@unicon.ltd"
SMTP_PASSWORD="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
SENTRY_DSN="..."
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'feat: Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep PRs focused and atomic

---

## 📊 Project Status

### Current Version: v0.3 (M1 Complete)

- ✅ Core shipment management
- ✅ Dispatch operations
- ✅ Status tracking
- ✅ POD upload
- ✅ User authentication & authorization
- ✅ Comprehensive documentation

### Roadmap

- **M2** (Q1 2024): Financial layer, invoicing, basic reporting
- **M3** (Q2 2024): KPI dashboards, mobile app, GPS integration
- **M4** (Q3 2024): Advanced analytics, route optimization

---

## 📞 Support

- **Documentation**: See `docs/` folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/unicon_schedule/issues)
- **Email**: support@unicon.ltd
- **Slack**: #unicon-schedule (internal)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Wasp](https://wasp-lang.dev/) - Full-stack framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Vercel](https://vercel.com/) - Hosting platform
- [Supabase](https://supabase.com/) - Database hosting

---

## 📈 Statistics

![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/unicon_schedule)
![GitHub issues](https://img.shields.io/github/issues/yourusername/unicon_schedule)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/unicon_schedule)

---

**Built with ❤️ by the Unicon Team**
