# RBAC Permission Matrix
## NABIP Association Management System

**Version:** 1.0
**Last Updated:** 2025-11-15
**Total Permissions:** 87

---

## Overview

This document defines the complete permission matrix for the NABIP AMS RBAC system. Permissions follow the naming convention: `{resource}.{action}.{scope}`

### Role Hierarchy
- **Level 1:** Member (Base permissions)
- **Level 2:** Chapter Admin (Inherits Member + Chapter management)
- **Level 3:** State Admin (Inherits Chapter Admin + State oversight)
- **Level 4:** National Admin (Full system access)

### Permission Inheritance
Higher-level roles automatically inherit all permissions from lower levels.

---

## Complete Permission Matrix

### Legend
- ✓ = Direct permission
- ↓ = Inherited from lower role
- — = Not granted

| Permission | Member (L1) | Chapter Admin (L2) | State Admin (L3) | National Admin (L4) |
|------------|-------------|-------------------|-----------------|-------------------|
| **MEMBER MANAGEMENT** |
| member.view.own | ✓ | ↓ | ↓ | ↓ |
| member.edit.own | ✓ | ↓ | ↓ | ↓ |
| member.view.chapter | — | ✓ | ↓ | ↓ |
| member.edit.chapter | — | ✓ | ↓ | ↓ |
| member.create.chapter | — | ✓ | ↓ | ↓ |
| member.delete.chapter | — | — | ✓ | ↓ |
| member.view.state | — | — | ✓ | ↓ |
| member.edit.state | — | — | ✓ | ↓ |
| member.create.state | — | — | ✓ | ↓ |
| member.export.state | — | — | ✓ | ↓ |
| member.view.national | — | — | — | ✓ |
| member.edit.national | — | — | — | ✓ |
| member.delete.national | — | — | — | ✓ |
| member.export.national | — | — | — | ✓ |
| **CHAPTER MANAGEMENT** |
| chapter.view.public | ✓ | ↓ | ↓ | ↓ |
| chapter.view.own | ✓ | ↓ | ↓ | ↓ |
| chapter.edit.own | — | ✓ | ↓ | ↓ |
| chapter.view.state | — | — | ✓ | ↓ |
| chapter.edit.state | — | — | ✓ | ↓ |
| chapter.create.state | — | — | ✓ | ↓ |
| chapter.delete.state | — | — | — | ✓ |
| chapter.view.national | — | — | — | ✓ |
| chapter.edit.national | — | — | — | ✓ |
| chapter.delete.national | — | — | — | ✓ |
| **EVENT MANAGEMENT** |
| event.view.public | ✓ | ↓ | ↓ | ↓ |
| event.register.own | ✓ | ↓ | ↓ | ↓ |
| event.view.chapter | — | ✓ | ↓ | ↓ |
| event.create.chapter | — | ✓ | ↓ | ↓ |
| event.edit.chapter | — | ✓ | ↓ | ↓ |
| event.delete.chapter | — | ✓ | ↓ | ↓ |
| event.view.state | — | — | ✓ | ↓ |
| event.create.state | — | — | ✓ | ↓ |
| event.edit.state | — | — | ✓ | ↓ |
| event.export.state | — | — | ✓ | ↓ |
| event.view.national | — | — | — | ✓ |
| event.edit.national | — | — | — | ✓ |
| event.delete.national | — | — | — | ✓ |
| **CAMPAIGN MANAGEMENT** |
| campaign.view.chapter | — | ✓ | ↓ | ↓ |
| campaign.create.chapter | — | ✓ | ↓ | ↓ |
| campaign.edit.chapter | — | ✓ | ↓ | ↓ |
| campaign.delete.chapter | — | ✓ | ↓ | ↓ |
| campaign.view.state | — | — | ✓ | ↓ |
| campaign.create.state | — | — | ✓ | ↓ |
| campaign.edit.state | — | — | ✓ | ↓ |
| campaign.delete.state | — | — | — | ✓ |
| campaign.create.national | — | — | — | ✓ |
| campaign.edit.national | — | — | — | ✓ |
| campaign.delete.national | — | — | — | ✓ |
| **COURSE MANAGEMENT** |
| course.view.public | ✓ | ↓ | ↓ | ↓ |
| course.enroll.own | ✓ | ↓ | ↓ | ↓ |
| course.view.chapter | — | ✓ | ↓ | ↓ |
| course.create.chapter | — | ✓ | ↓ | ↓ |
| course.edit.chapter | — | ✓ | ↓ | ↓ |
| course.view.state | — | — | ✓ | ↓ |
| course.create.state | — | — | ✓ | ↓ |
| course.create.national | — | — | — | ✓ |
| course.edit.national | — | — | — | ✓ |
| course.delete.national | — | — | — | ✓ |
| **REPORT & ANALYTICS** |
| report.view.own | ✓ | ↓ | ↓ | ↓ |
| report.view.chapter | — | ✓ | ↓ | ↓ |
| report.create.chapter | — | ✓ | ↓ | ↓ |
| report.export.chapter | — | ✓ | ↓ | ↓ |
| report.view.state | — | — | ✓ | ↓ |
| report.create.state | — | — | ✓ | ↓ |
| report.export.state | — | — | ✓ | ↓ |
| report.view.national | — | — | — | ✓ |
| report.create.national | — | — | — | ✓ |
| report.delete.national | — | — | — | ✓ |
| **TRANSACTION MANAGEMENT** |
| transaction.view.own | ✓ | ↓ | ↓ | ↓ |
| transaction.view.chapter | — | ✓ | ↓ | ↓ |
| transaction.export.chapter | — | ✓ | ↓ | ↓ |
| transaction.view.state | — | — | ✓ | ↓ |
| transaction.export.state | — | — | ✓ | ↓ |
| transaction.view.national | — | — | — | ✓ |
| transaction.edit.national | — | — | — | ✓ |
| transaction.delete.national | — | — | — | ✓ |
| **ROLE MANAGEMENT** |
| role.view.all | — | — | ✓ | ↓ |
| role.assign.chapter | — | — | ✓ | ↓ |
| role.assign.state | — | — | — | ✓ |
| role.assign.national | — | — | — | ✓ |
| role.create.national | — | — | — | ✓ |
| role.edit.national | — | — | — | ✓ |
| role.delete.national | — | — | — | ✓ |
| **AUDIT & COMPLIANCE** |
| audit.view.own | ✓ | ↓ | ↓ | ↓ |
| audit.view.chapter | — | ✓ | ↓ | ↓ |
| audit.view.state | — | — | ✓ | ↓ |
| audit.view.all | — | — | — | ✓ |
| audit.export.all | — | — | — | ✓ |
| **SYSTEM CONFIGURATION** |
| system.view.all | — | — | — | ✓ |
| system.configure.all | — | — | — | ✓ |

---

## Detailed Permission Definitions

### 1. Member Management (14 permissions)

#### Member Level (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| member.view.own | View own member profile | Member views their dashboard |
| member.edit.own | Edit own member profile | Member updates contact info |

#### Chapter Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| member.view.chapter | View members in same chapter | Chapter admin views member roster |
| member.edit.chapter | Edit chapter member profiles | Chapter admin updates member status |
| member.create.chapter | Add new members to chapter | Chapter admin processes new applications |

#### State Admin Level (5 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| member.delete.chapter | Soft delete chapter members | State admin removes inactive members |
| member.view.state | View all state members | State admin generates state roster |
| member.edit.state | Edit any state member | State admin corrects data errors |
| member.create.state | Create members in any state chapter | State admin bulk imports members |
| member.export.state | Export state member data | State admin generates compliance reports |

#### National Admin Level (4 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| member.view.national | View all members nationwide | National admin audits membership |
| member.edit.national | Edit any member nationwide | National admin resolves escalated issues |
| member.delete.national | Delete members (soft delete) | National admin handles GDPR requests |
| member.export.national | Export all member data | National admin generates annual reports |

---

### 2. Chapter Management (10 permissions)

#### Member Level (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| chapter.view.public | View public chapter information | Member browses chapter directory |
| chapter.view.own | View own chapter details | Member sees chapter events/news |

#### Chapter Admin Level (1 permission)
| Permission | Description | Use Case |
|------------|-------------|----------|
| chapter.edit.own | Edit own chapter details | Chapter admin updates meeting schedule |

#### State Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| chapter.view.state | View all state chapters | State admin monitors chapters |
| chapter.edit.state | Edit state chapter details | State admin corrects chapter info |
| chapter.create.state | Create new chapters in state | State admin establishes local chapter |

#### National Admin Level (4 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| chapter.delete.state | Soft delete state chapter | National admin closes inactive chapter |
| chapter.view.national | View all chapters nationwide | National admin generates chapter map |
| chapter.edit.national | Edit any chapter | National admin standardizes chapter data |
| chapter.delete.national | Delete any chapter | National admin handles mergers |

---

### 3. Event Management (13 permissions)

#### Member Level (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| event.view.public | View public events | Member browses event calendar |
| event.register.own | Register for events | Member signs up for conference |

#### Chapter Admin Level (4 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| event.view.chapter | View all chapter events | Chapter admin sees draft events |
| event.create.chapter | Create chapter events | Chapter admin creates networking event |
| event.edit.chapter | Edit chapter events | Chapter admin updates event details |
| event.delete.chapter | Cancel chapter events | Chapter admin cancels due to low attendance |

#### State Admin Level (4 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| event.view.state | View all state events | State admin monitors event activity |
| event.create.state | Create state-wide events | State admin creates annual conference |
| event.edit.state | Edit state events | State admin adjusts state conference |
| event.export.state | Export state event data | State admin generates attendance reports |

#### National Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| event.view.national | View all events nationwide | National admin sees event calendar |
| event.edit.national | Edit any event | National admin corrects event errors |
| event.delete.national | Delete any event | National admin removes duplicate events |

---

### 4. Campaign Management (11 permissions)

#### Chapter Admin Level (4 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| campaign.view.chapter | View chapter campaigns | Chapter admin reviews email history |
| campaign.create.chapter | Create chapter email campaigns | Chapter admin sends monthly newsletter |
| campaign.edit.chapter | Edit draft chapter campaigns | Chapter admin revises campaign content |
| campaign.delete.chapter | Delete draft chapter campaigns | Chapter admin removes outdated draft |

#### State Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| campaign.view.state | View all state campaigns | State admin monitors email activity |
| campaign.create.state | Create state-wide campaigns | State admin announces state legislation |
| campaign.edit.state | Edit state campaigns | State admin updates campaign segment |

#### National Admin Level (4 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| campaign.delete.state | Delete state campaigns | National admin removes policy violation |
| campaign.create.national | Create national campaigns | National admin announces federal policy |
| campaign.edit.national | Edit national campaigns | National admin revises national message |
| campaign.delete.national | Delete any campaign | National admin removes spam campaign |

---

### 5. Course Management (10 permissions)

#### Member Level (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| course.view.public | View public course catalog | Member browses available courses |
| course.enroll.own | Enroll in courses | Member registers for CE course |

#### Chapter Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| course.view.chapter | View chapter courses | Chapter admin sees unpublished courses |
| course.create.chapter | Create chapter courses | Chapter admin creates local training |
| course.edit.chapter | Edit chapter courses | Chapter admin updates course details |

#### State Admin Level (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| course.view.state | View all state courses | State admin monitors course activity |
| course.create.state | Create state courses | State admin creates state certification |

#### National Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| course.create.national | Create national courses | National admin creates certification program |
| course.edit.national | Edit any course | National admin updates course content |
| course.delete.national | Delete any course | National admin removes outdated course |

---

### 6. Report & Analytics (10 permissions)

#### Member Level (1 permission)
| Permission | Description | Use Case |
|------------|-------------|----------|
| report.view.own | View own activity reports | Member sees personal engagement metrics |

#### Chapter Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| report.view.chapter | View chapter analytics | Chapter admin reviews growth metrics |
| report.create.chapter | Create custom chapter reports | Chapter admin builds membership report |
| report.export.chapter | Export chapter reports | Chapter admin downloads CSV for Excel |

#### State Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| report.view.state | View state analytics | State admin monitors state performance |
| report.create.state | Create state-level reports | State admin builds regional comparison |
| report.export.state | Export state reports | State admin generates board presentation |

#### National Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| report.view.national | View all reports | National admin sees system-wide analytics |
| report.create.national | Create any report | National admin builds custom analysis |
| report.delete.national | Delete any report | National admin removes duplicate reports |

---

### 7. Transaction Management (8 permissions)

#### Member Level (1 permission)
| Permission | Description | Use Case |
|------------|-------------|----------|
| transaction.view.own | View own transaction history | Member sees payment history |

#### Chapter Admin Level (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| transaction.view.chapter | View chapter transactions | Chapter admin reviews chapter revenue |
| transaction.export.chapter | Export chapter financial data | Chapter admin generates financial report |

#### State Admin Level (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| transaction.view.state | View state transactions | State admin monitors state revenue |
| transaction.export.state | Export state financial data | State admin creates annual budget |

#### National Admin Level (3 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| transaction.view.national | View all transactions | National admin audits financials |
| transaction.edit.national | Edit transaction details | National admin corrects payment errors |
| transaction.delete.national | Delete transactions | National admin removes test transactions |

---

### 8. Role Management (7 permissions)

#### State Admin Level (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| role.view.all | View all roles and assignments | State admin sees chapter admin list |
| role.assign.chapter | Assign chapter admin roles | State admin appoints new chapter president |

#### National Admin Level (5 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| role.assign.state | Assign state admin roles | National admin appoints state coordinator |
| role.assign.national | Assign any role | National admin delegates national admin |
| role.create.national | Create custom roles | National admin creates "Marketing Director" role |
| role.edit.national | Edit role permissions | National admin adjusts role capabilities |
| role.delete.national | Delete custom roles | National admin removes obsolete role |

---

### 9. Audit & Compliance (5 permissions)

#### Member Level (1 permission)
| Permission | Description | Use Case |
|------------|-------------|----------|
| audit.view.own | View own activity log | Member reviews login history |

#### Chapter Admin Level (1 permission)
| Permission | Description | Use Case |
|------------|-------------|----------|
| audit.view.chapter | View chapter audit logs | Chapter admin investigates data change |

#### State Admin Level (1 permission)
| Permission | Description | Use Case |
|------------|-------------|----------|
| audit.view.state | View state audit logs | State admin reviews compliance |

#### National Admin Level (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| audit.view.all | View all audit logs | National admin investigates security incident |
| audit.export.all | Export audit logs | National admin generates compliance report |

---

### 10. System Configuration (2 permissions)

#### National Admin Only (2 permissions)
| Permission | Description | Use Case |
|------------|-------------|----------|
| system.view.all | View system configuration | National admin reviews system settings |
| system.configure.all | Modify system configuration | National admin updates email gateway |

---

## Permission Naming Convention

**Format:** `{resource}.{action}.{scope}`

### Resources
- member
- chapter
- event
- campaign
- course
- report
- transaction
- role
- permission
- audit
- system

### Actions
- view: Read-only access
- create: Create new records
- edit: Modify existing records
- delete: Soft delete records
- export: Export data to external formats
- manage: Full CRUD operations
- assign: Grant roles/permissions

### Scopes
- own: Personal data only
- chapter: Current chapter scope
- state: All chapters in state
- national: All chapters nationwide
- all: System-wide (cross-cutting concerns)
- public: Publicly accessible data

---

## Special Permissions

### Dynamic Permissions
Some permissions are evaluated dynamically based on context:

**member.view.own** - Grants access to:
- Own profile data
- Own transaction history
- Own event registrations
- Own course enrollments
- Own audit logs

**Scope Resolution:**
When a user has multiple role assignments with different scopes (e.g., chapter_admin for Chapter A AND state_admin for State CA), the broadest scope wins.

Example:
- Member has `chapter_admin` for "Los Angeles Chapter" (scope: chapter)
- Member also has `state_admin` for "CA" (scope: state)
- Permission check for `member.view.chapter` against "San Francisco Chapter":
  - chapter_admin role: NO (different chapter)
  - state_admin role: YES (both chapters in CA)
  - **Result: GRANTED** (state scope includes all CA chapters)

---

## Permission Groups (For UI Organization)

### Member Self-Service
- member.view.own
- member.edit.own
- event.view.public
- event.register.own
- course.view.public
- course.enroll.own
- transaction.view.own
- report.view.own
- audit.view.own

### Chapter Administration
- member.{view,edit,create}.chapter
- chapter.edit.own
- event.{view,create,edit,delete}.chapter
- campaign.{view,create,edit,delete}.chapter
- course.{view,create,edit}.chapter
- report.{view,create,export}.chapter
- transaction.{view,export}.chapter
- audit.view.chapter

### State Oversight
- member.{view,edit,create,delete,export}.state
- chapter.{view,edit,create}.state
- event.{view,create,edit,export}.state
- campaign.{view,create,edit}.state
- course.{view,create}.state
- report.{view,create,export}.state
- transaction.{view,export}.state
- role.{view,assign}.chapter
- audit.view.state

### National Administration
- All permissions with `.national` or `.all` scope
- role.{create,edit,delete,assign}.national
- system.{view,configure}.all
- audit.{view,export}.all

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-15 | Initial permission matrix (87 permissions) |

---

## Related Documentation
- Database Schema: `RBAC_DATABASE_SCHEMA.md`
- RLS Policies: `RBAC_RLS_POLICIES.md`
- Admin Guide: `RBAC_ADMIN_GUIDE.md`
