# NABIP Association Management System (AMS)

A comprehensive, enterprise-grade Association Management System built for the National Association of Benefits and Insurance Professionals (NABIP). This system unifies 15-20 disconnected tools into one source of truth for managing 20,000+ members across national, state, and local chapters.

## ✨ Features

### 📊 Advanced Reporting & Analytics
- **Interactive Data Visualizations**: Beautiful charts powered by Recharts
  - Line charts for member growth trends
  - Area charts for revenue analysis
  - Bar charts for performance metrics
  - Pie charts for distribution analysis
- **Custom Report Builder**: Drag-and-drop interface for creating custom reports
  - Select fields from members, chapters, events, and financial data
  - Configure aggregations (sum, average, count, min, max)
  - Schedule automated report generation (daily, weekly, monthly)
  - Export to multiple formats (CSV, Excel, PDF)
- **Real-time Dashboard**: Live KPIs and metrics
  - Member growth tracking
  - Revenue analytics by source
  - Event performance monitoring
  - Email engagement metrics

### 👥 Member Management
- Unified member database with flexible membership tiers
- Hierarchical structure (National → State → Local chapters)
- Smart duplicate detection
- Automated renewal reminders
- Member engagement scoring
- Self-service member portal

### 📅 Event Management
- Complete event lifecycle management
- Multiple registration types with dynamic pricing
- Capacity management and waitlists
- QR code check-in
- Virtual/hybrid event support
- Post-event analytics

### 💌 Communications
- Email campaign builder with templates
- Dynamic member segmentation
- A/B testing capabilities
- Real-time engagement tracking
- Automated workflow sequences

### 💰 Financial Management
- Integrated payment processing simulation
- Automated invoicing and billing
- Transaction tracking
- Revenue analytics
- Multi-source revenue reporting

### 🏛️ Chapter Management
- Multi-level organizational hierarchy
- Chapter-specific dashboards
- Revenue sharing calculations
- Performance metrics
- Inter-chapter collaboration

### 🎓 Learning Management
- Course catalog and enrollment tracking
- Professional designation management
- CE credit tracking
- Progress monitoring
- Certificate generation

## 🎨 Design Philosophy

Built with Apple/Stripe-inspired radical simplicity:
- **Effortlessly Professional**: Complex workflows feel natural
- **Instantly Responsive**: <100ms UI interactions
- **Confidently Powerful**: AI-assisted workflows
- **Beautiful Data Visualization**: Charts that tell stories

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript
- **UI Components**: Shadcn/ui v4 with Radix UI
- **Styling**: Tailwind CSS v4
- **Icons**: Phosphor Icons
- **Charts**: Recharts
- **Data Visualization**: D3.js integration ready
- **State Management**: React hooks + useKV persistence
- **Runtime**: Spark SDK with AI capabilities

## 🚀 Getting Started

This Spark is pre-configured and ready to use:

1. **Navigate through modules**: Use the sidebar or ⌘K command palette
2. **View visualizations**: Check Reports & Analytics → Visualizations tab
3. **Create custom reports**: Click "Create Report" to build your own
4. **Explore dashboards**: Member trends and revenue charts on the main dashboard

## 💻 Development Setup

### Prerequisites
- **Node.js**: Version 22.19.0 or higher

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5000](http://localhost:5000) in your browser

3. **Build for production**
   ```bash
   npm run build
   ```

### Troubleshooting

If you encounter build errors, try:
```bash
# Remove dependencies and reinstall
rm -rf node_modules package-lock.json
npm install
```

On Windows PowerShell:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

## 📈 Key Metrics Tracked

- Total Members & Growth Rate
- Active vs. Pending Members
- Revenue by Source (Dues, Events, Donations)
- Event Attendance & Capacity
- Email Engagement Rates
- Chapter Performance
- Member Engagement Scores
- Renewal Rates

## 🎯 Use Cases

1. **Executive Reporting**: High-level KPIs and trends
2. **Financial Analysis**: Revenue tracking across sources
3. **Member Insights**: Engagement and retention analytics
4. **Event Planning**: Attendance forecasting and ROI
5. **Chapter Performance**: Comparative analytics
6. **Custom Analysis**: Build reports for specific needs

## 🔐 Security & Compliance

- Role-based access control
- Audit trails for all actions
- Data encryption
- GDPR/CCPA ready
- Secure payment handling

## 🗺️ Roadmap & Feature Requests

We have three major feature request initiatives planned:

### 1. Core Functionality Fixes (Priority: Critical)
Fixing broken core features including Add Member, Campaign Creation, Course Creation, Event Workflow, Reports, and Member Portal Login. See [Feature Request #1](FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md#feature-request-1-core-functionality-fixes) for details.

### 2. Chapter Management Enhancement (Priority: High)
Comprehensive improvements including bulk operations, hierarchy visualization, sparkline analytics, export tools, and comparison features. See [Feature Request #2](FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md#feature-request-2-chapter-management-system-enhancement) for details.

### 3. Role-Based Access Control (RBAC) System (Priority: High)
Implementing four-tier RBAC with Member, Chapter Admin, State Admin, and National Admin views, plus comprehensive permission management and audit logging. See [Feature Request #3](FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md#feature-request-3-role-based-access-control-rbac-system) for details.

**Total Sub-Issues**: 36 detailed tasks across all feature requests

For complete documentation, issue creation scripts, and custom agent assignments, see:
- [`FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md`](FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md) - Complete feature request documentation
- [`feature-requests-data.json`](feature-requests-data.json) - Structured JSON data
- [`.github/scripts/README.md`](.github/scripts/README.md) - Issue creation guide

## 📱 Mobile Responsive

Fully optimized for:
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (< 768px)

## 🎨 Color Palette

- **Primary (Deep Navy)**: `oklch(0.25 0.05 250)` - Trust & authority
- **Secondary (Teal)**: `oklch(0.60 0.12 200)` - Modern energy
- **Accent (Gold)**: `oklch(0.75 0.15 85)` - Success & premium

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
