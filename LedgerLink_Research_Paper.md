# LedgerLink: A Web-Based Receipt and Invoice Management System for Small and Medium Enterprises Using the Prototyping Model

**Osikhena Emmanuel Mikainu Amanokha**  
Department of Computer Science  

---

## Abstract

Small and Medium Enterprises (SMEs) in Nigeria face significant challenges in managing their financial transactions, particularly in the areas of invoice tracking, receipt management, and cash flow monitoring. Manual and fragmented approaches to financial record-keeping result in delayed payments, inaccurate reporting, and poor visibility into a business's financial health. This paper presents LedgerLink, a web-based Receipt and Invoice Management System (RIMS) designed to address these challenges. Developed using the SDLC Prototyping Model, LedgerLink provides a centralised platform for managing invoices, receipts, vendors, clients, and documents, with additional features including Optical Character Recognition (OCR) for automated receipt data extraction, role-based access control (RBAC), electronic signatures, and exportable financial reports. The system was built using a modern JavaScript stack comprising React 19, Express 5, and MongoDB. Evaluation through functional testing confirms that all core modules operate correctly and meet the requirements gathered during the design phase. LedgerLink demonstrates that a lightweight, well-structured web application can substantially improve financial management efficiency for SMEs operating in developing economies.

**Keywords:** Invoice Management, Receipt Management, SME Finance, Role-Based Access Control, OCR, Web-Based Application, Prototyping Model.

---

## 1. Introduction

The growth of small and medium enterprises (SMEs) in Nigeria has accelerated in recent years, with the sector accounting for a significant share of employment and economic output [1]. Despite this growth, many SMEs continue to rely on manual methods — spreadsheets, paper records, and physical filing — to manage their financial transactions [2]. These methods introduce a range of operational problems: invoices are issued late or lost, payments are not tracked accurately, and business owners lack real-time visibility into their cash position [3].

The invoice lifecycle in a typical SME involves multiple stakeholders — accountants, vendors, and clients — each requiring different levels of access and visibility [4]. Without a structured system, invoices may remain in draft status indefinitely, payments go unrecorded, and overdue balances accumulate without triggering timely follow-up [5]. Similarly, expense receipts are often collected inconsistently, making it difficult to reconcile payments with vendor obligations or produce accurate financial reports [6].

Beyond operational inefficiency, manual financial management also introduces compliance risks. Nigerian tax regulations and standard accounting practices require businesses to maintain organised records of income and expenditure for a minimum of six years [7]. Physical records are vulnerable to loss or damage, and manually compiled reports are prone to human error [8].

Existing enterprise resource planning (ERP) systems address many of these issues but are typically too costly and complex for SME adoption [9]. There is therefore a clear need for a purpose-built, accessible, and affordable web-based solution tailored to the specific workflows of Nigerian SMEs [10].

This paper presents LedgerLink, a web-based financial management platform developed to address these challenges. The system covers the full invoice lifecycle from creation to payment confirmation, automates receipt data extraction using OCR, enforces role-based access control across five user roles, and produces exportable financial reports in both PDF and Excel formats. The development followed the SDLC Prototyping Model, enabling iterative refinement of features based on evolving requirements.

---

## 2. Research Method

### 2.1 Prototyping Model

The Prototyping Model was selected as the development methodology for LedgerLink due to its iterative nature, which is well-suited to projects where requirements evolve during the design and construction phases [11]. Unlike the Waterfall model, which requires complete requirements specification before development begins, the Prototyping Model allows working prototypes to be tested and refined continuously [12].

The model was applied across six sequential phases as illustrated in Figure 1.

**Figure 1. Sequential Phases of the Prototyping Model Applied to LedgerLink**

```
Requirements Analysis → Rapid Design → Prototype Build → User Evaluation → Refinement → Implementation
```

### 2.2 Phase Descriptions

**Phase 1 — Requirements Gathering and Analysis:**  
Interviews and observational analysis were conducted to identify the core pain points in SME financial management. Key requirements were identified around invoice tracking, receipt capture, access control, and reporting. These were consolidated into a functional requirements table.

**Phase 2 — Rapid Design:**  
System architecture was designed using component diagrams. The technology stack was selected based on performance, developer productivity, and open-source availability. A REST API architecture was chosen to separate the backend from the frontend, enabling future mobile client development.

**Phase 3 — Prototype Construction:**  
A functional prototype was built using React 19 (frontend), Express 5 (backend), and MongoDB (database). The prototype included all core modules: authentication, invoices, receipts, vendors, clients, documents, and reports.

**Phase 4 — Initial Evaluation:**  
The prototype was tested against functional requirements. Issues identified included silent OCR failures, hardcoded URL references, and incorrect aggregate queries on the dashboard. These were documented and addressed in Phase 5.

**Phase 5 — Refinement:**  
Bug fixes were applied across multiple modules. OCR error logging was improved, the dashboard payables calculation was corrected to aggregate from receipts rather than static vendor balances, and the document store was updated to automatically mirror uploaded receipt files.

**Phase 6 — Implementation:**  
The system was deployed for use, with environment-based configuration enabling both local and network-accessible deployment.

### 2.3 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | 19 / 6 |
| UI | Inline styles + Recharts | — |
| Backend | Node.js + Express | 22 / 5 |
| Database | MongoDB + Mongoose | Atlas / 9 |
| Authentication | JSON Web Tokens (JWT) | 9 |
| File Upload | Multer | 2 |
| OCR | Tesseract.js | 7 |
| PDF Generation | PDFKit | 0.18 |
| Excel Generation | ExcelJS | 4 |
| Email | Nodemailer | 8 |

---

## 3. Results and Discussion

Six stages were carried out based on the Prototyping Model. The discussion focuses on requirements gathering, rapid design, construction, and evaluation. The following sections present the requirements gathered and the resulting system features.

### 3.1 Requirements Gathering

Requirement analysis identified five core functional areas as shown in Table 1.

**Table 1. Requirement Gathering Analysis**

| No | Requirement | Feature |
|---|---|---|
| 1 | Centralised financial overview | Dashboard with KPI cards and charts |
| 2 | Invoice lifecycle management | Create, send, record payment, e-sign invoices |
| 3 | Receipt capture and processing | Upload receipts with OCR auto-extraction |
| 4 | Vendor and client management | Add, view, and track vendors and clients |
| 5 | Document storage and retrieval | Secure 7-year document repository |
| 6 | Financial reporting | Export reports to PDF and Excel |
| 7 | Multi-user access control | Role-based permissions across five roles |
| 8 | Account security | Password recovery with email reset links |

### 3.2 System Architecture

LedgerLink follows a standard client-server architecture. The React frontend communicates with the Express backend exclusively through a REST API secured by JWT bearer tokens. MongoDB Atlas is used as the cloud-hosted database, eliminating the need for local database administration.

**Figure 2. System Architecture Diagram**

```
┌─────────────────┐        REST API (JWT)       ┌──────────────────────┐
│  React Client   │ ◄─────────────────────────► │   Express Server     │
│  (Vite / SPA)   │                             │   (Node.js / ES5)    │
└─────────────────┘                             └──────────┬───────────┘
                                                           │
                                               ┌───────────▼──────────┐
                                               │   MongoDB Atlas      │
                                               │   (Cloud Database)   │
                                               └──────────────────────┘
```

### 3.3 Role-Based Access Control

LedgerLink implements five user roles, each with a defined permission set. Role assignment occurs during account registration and determines both navigation access and available actions within each module.

**Table 2. Role Permissions Matrix**

| Role | Dashboard | Invoices | Receipts | Vendors | Documents | Reports | Settings |
|---|---|---|---|---|---|---|---|
| Admin | ✔ | ✔ Full | ✔ | ✔ | ✔ | ✔ | ✔ |
| Accountant | ✔ | ✔ Full | ✔ | ✔ | ✔ | ✔ | ✗ |
| Sysadmin | ✔ | ✔ View | ✔ | ✔ | ✔ | ✔ | ✔ |
| Vendor | ✗ | ✔ View | ✗ | ✗ | ✔ View | ✗ | ✗ |
| Client | ✗ | ✔ View | ✗ | ✗ | ✔ View | ✗ | ✗ |

### 3.4 Dashboard Module

The dashboard provides a real-time financial overview through four KPI cards and four data visualisations.

**KPI Cards:**
- **Total Receivables** — sum of outstanding balances on unpaid invoices (sent, viewed, partial, overdue)
- **Total Payables** — sum of all recorded expense receipts
- **Net Cash Position** — receivables minus payables
- **Overdue Invoices** — total value and count of overdue invoices

**Visualisations:**
- Area chart of monthly cash flow trends
- Pie chart of invoice status distribution
- Bar chart of aging report (0–30, 31–60, 61–90, 90+ days)
- Recent invoices list with quick navigation

### 3.5 Invoice Management Module

The invoice module supports the full invoice lifecycle as defined in Table 3.

**Table 3. Invoice Lifecycle Statuses**

| Status | Description |
|---|---|
| Draft | Created but not yet sent to the client |
| Sent | Dispatched to the client |
| Viewed | Client has opened the invoice |
| Partial | A partial payment has been recorded |
| Overdue | Past due date with outstanding balance |
| Paid | Fully settled |

Key features include:

- **Automatic invoice numbering** — sequential format `INV-YYYY-NNN`
- **Line item builder** — add multiple items with quantity, unit price, and auto-calculated amounts
- **Tax and discount** — configurable tax rate (%) and flat discount
- **Send action** — transitions invoice from Draft to Sent
- **Record Payment modal** — accepts full or partial payment with quick-fill percentage buttons (25%, 50%, 75%, 100%); automatically promotes to Paid when balance reaches zero
- **Electronic signature** — HTML5 Canvas pad supporting mouse and touch input; base64 PNG stored on the invoice record
- **Search and filter** — filter by status, search by client name or invoice number

### 3.6 Receipt Management with OCR

The receipt module allows users to upload expense and income receipts in PDF, JPG, PNG, or WEBP format. Upon upload, an OCR pipeline runs automatically in the background without blocking the HTTP response.

**OCR Pipeline:**
1. File is saved to disk via Multer
2. Receipt record is created in MongoDB
3. `processReceipt()` fires asynchronously
4. For PDFs: text is extracted using pdf-parse; if no text is found, the file is treated as a scanned image
5. For images: Tesseract.js processes the file using the English language model
6. Extracted text is parsed with regular expressions to identify vendor name, date, amount, and reference number
7. If confidence ≥ 90%, extracted data is applied automatically (status: `processed`)
8. If confidence < 90%, the receipt is flagged for manual review (status: `needs_review`)

The frontend polls every 4 seconds while any receipt has `processing` status and displays an OCR confidence badge on each row. A review modal allows users to correct and confirm extracted data.

**Table 4. OCR Status Values**

| Status | Meaning |
|---|---|
| Pending | File uploaded, OCR not yet started |
| Processing | OCR pipeline running |
| Processed | Extracted with confidence ≥ 90%, auto-applied |
| Needs Review | Confidence < 90%, awaiting manual confirmation |
| Confirmed | User has reviewed and confirmed the data |

### 3.7 Vendor and Client Management

The vendor and client module provides a card-based view of all business relationships. Each vendor record stores contact details, payment terms, payment status (Good / Late / Dispute), bank details, and category. Each client record stores contact information and a credit limit.

### 3.8 Document Storage Module

LedgerLink maintains a centralised document repository with a 7-year retention policy in compliance with standard accounting requirements. Documents are automatically created when receipts are uploaded, linking the file to the originating receipt record. Users can also upload documents manually.

Each document record stores:
- File metadata (name, size, MIME type, path)
- Document type (receipt, invoice, contract, statement, other)
- Links to related receipt or invoice records
- Entity name for display and search
- Tags and notes
- Archive status and retention date

### 3.9 Reports Module

The reports module generates four exportable reports available in both PDF and Excel formats:

| Report | Description |
|---|---|
| Invoice Report | Full list of invoices with status, totals, and balances |
| Receipt Report | All expense receipts with vendor, amount, and date |
| Summary Report | KPI summary including receivables, payables, and net position |
| Aging Report | Outstanding invoices grouped by days overdue |

Reports are authenticated — download requests include the JWT token — and are served as binary file downloads directly from the server.

### 3.10 Authentication and Security

LedgerLink implements the following security measures:

- **Password hashing** — bcryptjs with salt rounds
- **JWT authentication** — 7-day expiry, sent as a Bearer token in the Authorization header
- **Account lockout** — accounts are locked for 30 minutes after 5 consecutive failed login attempts
- **Password recovery** — cryptographically random reset token (SHA-256 hashed before storage), 1-hour expiry, anti-enumeration response
- **Role enforcement** — both server-side (`restrictTo` middleware) and client-side (`can(user, action)` helper) checks

### 3.11 Functional Testing

Functional testing was conducted across all major modules. Table 5 presents the results.

**Table 5. Functional Test Results**

| No | Module | Test Case | Result |
|---|---|---|---|
| 1 | Authentication | Register with role selection | Passed |
| 2 | Authentication | Login with correct credentials | Passed |
| 3 | Authentication | Account lockout after failed attempts | Passed |
| 4 | Authentication | Password reset via email link | Passed |
| 5 | Invoices | Create invoice with line items | Passed |
| 6 | Invoices | Send invoice (Draft → Sent) | Passed |
| 7 | Invoices | Record full payment (→ Paid) | Passed |
| 8 | Invoices | Record partial payment (→ Partial) | Passed |
| 9 | Invoices | Apply electronic signature | Passed |
| 10 | Receipts | Upload image receipt | Passed |
| 11 | Receipts | OCR extraction and auto-apply | Passed |
| 12 | Receipts | Manual review and confirmation | Passed |
| 13 | Vendors | Add vendor with payment terms | Passed |
| 14 | Clients | Add client with credit limit | Passed |
| 15 | Documents | Auto-mirror receipt upload | Passed |
| 16 | Reports | Export invoice report as PDF | Passed |
| 17 | Reports | Export summary report as Excel | Passed |
| 18 | Dashboard | KPI cards reflect live data | Passed |
| 19 | RBAC | Vendor role cannot access receipts | Passed |
| 20 | RBAC | Admin role accesses all modules | Passed |

All 20 test cases passed. The system functions correctly across all defined use cases.

---

## 4. Conclusion

This paper presented LedgerLink, a web-based receipt and invoice management system developed for SMEs using the Prototyping Model. The system addresses real financial management challenges faced by small businesses in Nigeria, including fragmented invoice tracking, manual receipt processing, and limited financial visibility.

The Prototyping Model proved effective for this project, enabling iterative discovery and resolution of issues throughout development — including corrections to the dashboard aggregation logic, OCR pipeline error handling, and document store population. The resulting system covers the complete invoice lifecycle, automates receipt data extraction via OCR, enforces granular role-based access control, and produces auditable financial reports.

Functional testing confirmed that all 20 core test cases pass without issues. Future work should include a formal User Acceptance Testing (UAT) phase with real SME users, development of a mobile client application, integration with Nigerian payment gateways (e.g. Paystack, Flutterwave), and automated email notifications for overdue invoices.

LedgerLink demonstrates that a well-architected, purpose-built web application using open-source technologies can deliver professional-grade financial management capabilities within the reach of small businesses.

---

## References

[1] Eniola, A. A., & Entebang, H. (2015). SME Firm Performance — Financial Innovation and Challenges. *Procedia — Social and Behavioral Sciences*, 195, 334–342.

[2] Olatunji, O. C. (2013). Impact of Accounting Information System on Organisational Effectiveness of Automobile Companies in Nigeria. *Arabian Journal of Business and Management Review*, 3(1), 1–16.

[3] Taiwo, J. N., Falohun, T. O., & Agwu, E. (2016). SMEs Financing and its Effects on Nigerian Economic Growth. *European Journal of Business, Economics and Accountancy*, 4(4), 37–54.

[4] Wiratama, J., Wijaya, S. F., Santoso, H., Selvia, M., & Jonathan. (2023). Improving Invoice Management: A Web-based Application for the Hospitality IT Vendor Industry using Prototyping Model. *Jurnal Informatika Ekonomi Bisnis*, 5(4), 1501–1506.

[5] Gupta, H. (2022). Invoice Management System Using Salesforce. *International Journal of Scientific Research in Engineering and Management*, 06(05), 5–8.

[6] Perko, I. (2017). Behaviour-Based Short-Term Invoice Probability of Default Evaluation. *European Journal of Operational Research*, 257(3), 1045–1054.

[7] Federal Inland Revenue Service (FIRS). (2020). *Tax Administration and Enforcement Act*. Abuja: FIRS.

[8] Adebayo, P. F., & Adebiyi, W. K. (2016). Financial Statement Analysis as a Tool for Investment Decisions and Assessment of Companies' Performance. *International Journal of Economics, Commerce and Management*, 4(7), 518–530.

[9] Nguyen, T. H. (2009). Information Technology Adoption in SMEs: An Integrated Framework. *International Journal of Entrepreneurial Behaviour & Research*, 15(2), 162–186.

[10] Oluwaseun, Y., & Comfort, A. (2016). The Impact of Computerised Accounting System on the Performance of Banks in Nigeria. *International Journal of Business and Management*, 11(9), 124–131.

[11] Pressman, R. S. (2014). *Software Engineering: A Practitioner's Approach* (8th ed.). McGraw-Hill.

[12] Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson.

---

*Manuscript prepared: June 2026*
