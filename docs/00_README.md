# Unicon Schedule - Documentation Index

**Last Updated**: 2026-02-04  
**Version**: 1.0  
**Status**: Active

---

## 📚 Quick Navigation

### 🚀 **Getting Started**
- [Project Context](01_core/01_CONTEXT.md) - What is Unicon Schedule?
- [Product Requirements](01_core/02_PRD.md) - What we're building
- [Architecture Overview](01_core/03_ARCHITECTURE.md) - How it's built

### 👨‍💻 **For Developers**
- [Database Schema](01_core/04_DATABASE_SCHEMA.md) - Data models & ERD
- [API Contracts](01_core/05_API_CONTRACTS.md) - API documentation
- [Implementation Plan](04_development/IMPLEMENTATION_PLAN.md) - Current progress & roadmap
- [Testing Strategy](04_development/TESTING_STRATEGY.md) - How to test
- [File Upload Strategy](04_development/FILE_UPLOAD_STRATEGY.md) - File handling

### 🎨 **For Designers**
- [UI Design](01_core/06_UI_DESIGN.md) - UI/UX specifications
- [URL Structure](01_core/07_URLS_SITEMAP.md) - Routes & sitemap

### 🚢 **For Operations/DevOps**
- **[🚀 Deployment Documentation](deployment/README.md)** - Complete deployment guide ⭐
  - [Quick Start Deploy](deployment/QUICK_START_DEPLOY.md) - Deploy in 10 minutes
  - [Full Deployment Guide](deployment/DEPLOYMENT_GUIDE.md) - Detailed instructions
  - [Deployment Files](deployment/DEPLOYMENT_FILES.md) - File overview
- [Upload Structure](UPLOAD_STRUCTURE.md) - File upload organization
- [Monitoring & Alerting](03_operations/MONITORING.md) - System monitoring
- [Security Guidelines](03_operations/SECURITY.md) - Security best practices
- [Performance Optimization](03_operations/PERFORMANCE.md) - Performance tuning
- [Data Migration](03_operations/DATA_MIGRATION.md) - Migration strategy
- [Runbook](03_operations/RUNBOOK.md) - Operational procedures

### 📦 **Features**
- [Debt Management](02_features/debt_management/README.md) - Debt management feature docs

### 📅 **Planning & History**
- [Milestone Plan](05_planning/MILESTONE_PLAN.md) - M1, M2, M3 milestones
- [Changelog](05_planning/CHANGELOG.md) - Version history

---

## 📂 Documentation Structure

```
docs/
├── 00_README.md                          # ← You are here
├── UPLOAD_STRUCTURE.md                   # File upload organization
│
├── 01_core/                              # Core system documentation
│   ├── 01_CONTEXT.md                     # Project overview
│   ├── 02_PRD.md                         # Product requirements
│   ├── 03_ARCHITECTURE.md                # System architecture
│   ├── 04_DATABASE_SCHEMA.md             # Database design & ERD
│   ├── 05_API_CONTRACTS.md               # API documentation
│   ├── 06_UI_DESIGN.md                   # UI/UX specifications
│   └── 07_URLS_SITEMAP.md                # URL structure
│
├── 02_features/                          # Feature-specific documentation
│   └── debt_management/                  # Debt Management feature
│       ├── README.md                     # Feature overview
│       ├── PRD.md                        # Feature requirements
│       ├── SCHEMA.md                     # Feature database schema
│       ├── API.md                        # Feature API docs
│       ├── UI.md                         # Feature UI specs
│       └── USER_GUIDE.md                 # End-user guide
│
├── 03_operations/                        # Operational documentation
│   ├── MONITORING.md                     # Monitoring & alerting
│   ├── SECURITY.md                       # Security guidelines
│   ├── PERFORMANCE.md                    # Performance optimization
│   ├── DATA_MIGRATION.md                 # Data migration strategy
│   └── RUNBOOK.md                        # Operational runbook
│
├── 04_development/                       # Development workflow
│   ├── IMPLEMENTATION_PLAN.md            # Progress & roadmap
│   ├── TESTING_STRATEGY.md               # Testing approach
│   └── FILE_UPLOAD_STRATEGY.md           # File handling strategy
│
├── 05_planning/                          # Historical planning docs
│   ├── MILESTONE_PLAN.md                 # M1, M2, M3 milestones
│   └── CHANGELOG.md                      # Version history
│
├── deployment/                           # 🚀 Deployment documentation
│   ├── README.md                         # Deployment overview
│   ├── QUICK_START_DEPLOY.md             # Quick start guide
│   ├── DEPLOYMENT_GUIDE.md               # Full deployment guide
│   ├── DEPLOYMENT_FILES.md               # File overview
│   ├── config/                           # Configuration files
│   │   ├── .env.server.example           # PM2 env template
│   │   ├── .env.docker.example           # Docker env template
│   │   ├── ecosystem.config.js           # PM2 config
│   │   ├── Dockerfile                    # Docker image
│   │   └── docker-compose.yml            # Docker Compose
│   └── scripts/                          # Deployment scripts
│       ├── backup-database.sh            # Database backup
│       ├── backup-uploads.sh             # Uploads backup
│       └── restore-database.sh           # Database restore
│
└── archive/                              # Obsolete/historical docs
    ├── README.md                         # Why files are archived
    └── [6 archived files]
```

---

## 🎯 Common Tasks

### **I want to...**

#### **Understand the system**
→ Start with [01_CONTEXT.md](01_core/01_CONTEXT.md), then [02_PRD.md](01_core/02_PRD.md)

#### **Set up development environment**
→ See main [README.md](../README.md) in project root

#### **Understand the database**
→ Read [04_DATABASE_SCHEMA.md](01_core/04_DATABASE_SCHEMA.md)

#### **Use the API**
→ Check [05_API_CONTRACTS.md](01_core/05_API_CONTRACTS.md)

#### **Deploy to production**
→ Follow [Deployment Guide](deployment/README.md) - Start with [Quick Start](deployment/QUICK_START_DEPLOY.md)

#### **Troubleshoot issues**
→ Check [RUNBOOK.md](03_operations/RUNBOOK.md)

#### **Add a new feature**
→ See [IMPLEMENTATION_PLAN.md](04_development/IMPLEMENTATION_PLAN.md) for roadmap

#### **Learn about Debt Management**
→ Start with [debt_management/README.md](02_features/debt_management/README.md)

#### **Train end users**
→ Use [debt_management/USER_GUIDE.md](02_features/debt_management/USER_GUIDE.md)

---

## 📊 System Overview

### **What is Unicon Schedule?**

Unicon Schedule is an internal logistics and financial management system for container transportation, designed for:
- **Ops**: Manage orders and shipments
- **Dispatcher**: Assign vehicles and drivers
- **Accounting**: Manage debts and payments
- **Admin**: Full system access

### **Key Modules**

1. **Logistics System** (M1)
   - Order & Shipment Management
   - Dispatch & Vehicle Assignment
   - Status Tracking
   - POD (Proof of Delivery)

2. **Debt Management** (M1.5)
   - Debt CRUD
   - Customer Management
   - Payment Tracking
   - File Upload (Invoices, Payment Proofs)

3. **Financial Layer** (M2 - In Progress)
   - Charge Items
   - Auto-create Debts
   - Invoice Generation
   - Financial Reports

4. **Optimization** (M3 - Planned)
   - Dashboard & KPIs
   - Notifications
   - User Management
   - External Integrations

---

## 🔄 Current Status

**Latest Milestone**: M1.5 Debt Management ✅ Complete  
**Current Sprint**: Testing & Polish 🔄 In Progress  
**Next Milestone**: M2 Financial Layer ⏳ Planned

**Progress**: 
- M1: ✅ 100%
- M1.5: ✅ 100%
- M2: 🔄 20%
- M3: ⏳ 0%

See [IMPLEMENTATION_PLAN.md](04_development/IMPLEMENTATION_PLAN.md) for detailed progress.

---

## 👥 Team & Roles

### **Documentation Ownership**

| Directory | Owner | Purpose |
|-----------|-------|---------|
| `01_core/` | Tech Lead | Core system design & architecture |
| `02_features/` | Feature Teams | Feature-specific documentation |
| `03_operations/` | DevOps Team | Production operations |
| `04_development/` | Dev Team | Development workflow |
| `05_planning/` | Product Owner | Planning & history |

### **Update Frequency**

| Directory | Update Frequency |
|-----------|------------------|
| `01_core/` | Rarely (major changes only) |
| `02_features/` | Per feature release |
| `03_operations/` | As needed (ops changes) |
| `04_development/` | Weekly (sprint updates) |
| `05_planning/` | Per milestone |

---

## 📝 Documentation Guidelines

### **When to Create New Docs**

**New Feature**:
1. Create folder: `02_features/{feature_name}/`
2. Add files: `README.md`, `PRD.md`, `SCHEMA.md`, `API.md`, `UI.md`, `USER_GUIDE.md`
3. Link from this index

**New Operational Procedure**:
1. Add to `03_operations/`
2. Update RUNBOOK.md if needed

**New Development Process**:
1. Add to `04_development/`
2. Update IMPLEMENTATION_PLAN.md

### **When to Update Docs**

- **Code changes**: Update API docs, schema docs
- **Feature complete**: Update implementation plan
- **Bug fixes**: Update changelog
- **Deployment**: Update runbook
- **Architecture change**: Update architecture doc

### **Documentation Standards**

- Use Markdown format
- Include table of contents for long docs
- Add "Last Updated" date
- Use clear headings and structure
- Include code examples where relevant
- Link to related docs

---

## 🔗 External Resources

- **Project Repository**: [GitHub](https://github.com/your-org/unicon_schedule) (if applicable)
- **Issue Tracker**: [Issues](https://github.com/your-org/unicon_schedule/issues) (if applicable)
- **Wasp Documentation**: https://wasp-lang.dev/docs
- **Prisma Documentation**: https://www.prisma.io/docs

---

## 📞 Contact & Support

**Questions about documentation?**
- Check this index first
- Search within docs directory
- Ask in team chat
- Contact documentation owner

**Found an error?**
- Create an issue
- Or fix it and submit PR
- Update "Last Updated" date

---

## 🎉 Welcome!

This documentation is your guide to understanding and working with Unicon Schedule. Start with the Quick Navigation above, or explore the directory structure.

**Happy coding!** 🚀

---

**Document Status**: ✅ Active - Master Index  
**Maintained By**: Development Team
