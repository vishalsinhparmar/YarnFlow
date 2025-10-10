# YarnFlow - Textile Supply Chain Management System

## 🎯 What Problem Does YarnFlow Solve?

**Imagine you run a textile business:**
- You buy raw materials (cotton yarn, polyester) from suppliers
- You need to track every bag and roll that comes in
- You sell these materials to customers
- You need to know what's in stock, what's sold, and what's being delivered

**Without YarnFlow:** You use Excel sheets, paper records, phone calls - everything is scattered and confusing!

**With YarnFlow:** Everything is organized in one place, from buying to selling to delivery tracking.

---

## 🏭 Real Business Example

Let's say you're "ABC Textile Company":

1. **You need cotton yarn** → Create Purchase Order to supplier
2. **Supplier delivers 100 bags** → Record in Goods Receipt Note (GRN)
3. **Store in warehouse** → Track each bag in Inventory Lots
4. **Customer orders 50 bags** → Create Sales Order
5. **Deliver to customer** → Generate Sales Challan
6. **Track everything** → View reports on Dashboard

---

## 🔄 How YarnFlow Works - Step by Step

### Step 1: 🏭 **Supplier** (Raw Materials Source)
```
Supplier: "ABC Textiles Ltd"
Products: Cotton Yarn, Polyester Rolls
```

### Step 2: 🛒 **Purchase Order (PO)**
```
You create: PO-2024-001
Order: 100 bags of Cotton Yarn (50kg each)
From: ABC Textiles Ltd
Total: ₹5,00,000
```

### Step 3: 📋 **Goods Receipt Note (GRN)**
```
When goods arrive, you record:
GRN-2024-045
- Bag 1: 50.0 kg ✓
- Bag 2: 50.2 kg ✓
- Bag 3: 50.2 kg ✓
- Bag 4: 50.5 kg ✓
(Just like your image!)
```

### Step 4: 📦 **Inventory Lots**
```
Create Lot: LOT-2024-001
Contains: 100 bags
Status: Available for sale
Location: Warehouse A
```

### Step 5: 📄 **Sales Order (SO)**
```
Customer: Fashion Hub Ltd
Orders: 50 bags from LOT-2024-001
Create: SO-2024-123
Amount: ₹2,50,000
```

### Step 6: 🚚 **Sales Challan**
```
Delivery document: CH-2024-090
Vehicle: MH-12-AB-1234
Driver: Ramesh Kumar
Destination: Mumbai
Status: In Transit
```

### Step 7: 📊 **Dashboard/Reports**
```
See everything at once:
- Total inventory: 1,245 bags
- Sales this month: ₹12.4L
- Pending deliveries: 34
- Low stock alerts: 18 items
```

---

## 🗂️ Master Data (The Foundation)

Before you start the workflow, you need to set up:

### **Customers** 👥
```
- Fashion Hub Ltd (Mumbai)
- Textile World Co (Delhi)
- Premium Fabrics Inc (Bangalore)
```

### **Suppliers** 🏭
```
- ABC Textiles Ltd (Cotton Yarn)
- XYZ Cotton Mills (Raw Cotton)
- Polyester Mills Inc (Polyester Rolls)
```

### **Products** 🧶
```
- Cotton Yarn 20s (100kg bags)
- Cotton Yarn 30s (100kg bags)
- Polyester Rolls (75kg each)
- Blended Yarn 50/50 (80kg bags)
```

---

## 💻 How the UI Pages Connect

### **Dashboard** 🏠
- **Purpose:** See everything at a glance
- **Shows:** Workflow status, key numbers, recent activity
- **Connects to:** All other pages

### **Purchase Order** 🛒
- **Purpose:** Order materials from suppliers
- **Creates:** PO documents
- **Connects to:** GRN (when goods arrive)

### **Goods Receipt Note** 📋
- **Purpose:** Record received goods
- **Uses:** PO reference
- **Creates:** Inventory lots
- **Connects to:** Inventory management

### **Inventory Lots** 📦
- **Purpose:** Track every bag/roll in warehouse
- **Uses:** GRN data
- **Connects to:** Sales orders (when selling)

### **Sales Order** 📄
- **Purpose:** Record customer orders
- **Uses:** Available inventory
- **Creates:** Sales commitments
- **Connects to:** Sales challan (for delivery)

### **Sales Challan** 🚚
- **Purpose:** Delivery documentation
- **Uses:** Sales order reference
- **Tracks:** Shipment status

### **Master Data** 🗂️
- **Purpose:** Manage basic information
- **Contains:** Customers, suppliers, products
- **Used by:** All other modules

---

## 🔗 Data Flow Connection

```
Master Data → Purchase Order → GRN → Inventory → Sales Order → Sales Challan
     ↓              ↓           ↓         ↓           ↓              ↓
  Products      PO-2024-001  GRN-045  LOT-2024-001  SO-2024-123  CH-2024-090
  Suppliers        ↓           ↓         ↓           ↓              ↓
  Customers    Order 100    Receive    Store in    Sell 50      Deliver
               bags         100 bags   warehouse   bags         to customer
```

---

## 📁 Project Structure

```
YarnFlow/
├── client/                          # Frontend (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── SideBarApp.jsx      # Navigation menu
│   │   │   └── NavbarApp.jsx       # Top header
│   │   ├── layout/
│   │   │   └── Layout.jsx          # Main page structure
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # 🏠 Main overview
│   │   │   ├── PurchaseOrder.jsx   # 🛒 Buying from suppliers
│   │   │   ├── GoodsReceipt.jsx    # 📋 Recording deliveries
│   │   │   ├── Inventory.jsx       # 📦 Stock management
│   │   │   ├── SalesOrder.jsx      # 📄 Customer orders
│   │   │   ├── SalesChallan.jsx    # 🚚 Delivery tracking
│   │   │   └── MasterData.jsx      # 🗂️ Basic data setup
│   │   └── App.jsx                 # Main routing
└── server/                         # Backend (Express.js - Future)
```

---

## 🚀 How to Run the Project

### Prerequisites
```bash
Node.js installed on your computer
```

### Installation
```bash
# Navigate to client folder
cd YarnFlow/client

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Access the Application
```
Open your browser and go to: http://localhost:5173
```

---

## 🎨 UI Features

### **Navigation**
- **Sidebar:** Quick access to all modules
- **Active highlighting:** Shows current page
- **Responsive:** Works on mobile and desktop

### **Dashboard Workflow**
- **Visual process flow:** See the complete supply chain
- **Real-time metrics:** Live inventory and sales data
- **Quick actions:** Jump to any module

### **Data Tables**
- **Sortable columns:** Organize data your way
- **Action buttons:** Edit, view, approve records
- **Status indicators:** Color-coded for quick understanding

### **Forms & Inputs**
- **Validation:** Prevents wrong data entry
- **Auto-suggestions:** Speed up data entry
- **File uploads:** Attach documents

---

## 🔮 Future Enhancements

### **Phase 1: Backend Integration**
- Connect to Express.js server
- Real database (MongoDB/PostgreSQL)
- API endpoints for all operations

### **Phase 2: Advanced Features**
- Barcode scanning for bags/rolls
- Automatic reorder alerts
- Financial reporting
- Multi-location support

### **Phase 3: Mobile App**
- Warehouse staff mobile app
- Delivery tracking for customers
- Supplier portal

---

## 🤝 How This Helps Your Business

### **Before YarnFlow:**
- ❌ Lost track of inventory
- ❌ Manual paperwork
- ❌ Customer complaints about delays
- ❌ Overstocking or understocking
- ❌ Difficult to find specific lots

### **After YarnFlow:**
- ✅ Know exactly what's in stock
- ✅ Digital records, no paper
- ✅ Real-time delivery tracking
- ✅ Smart reorder alerts
- ✅ Find any bag/roll instantly

---

## 📞 Support

If you need help understanding any part:
1. Check this README first
2. Look at the code comments
3. Test with sample data
4. Ask specific questions about any module

---

## 🏷️ Key Terms

- **PO:** Purchase Order (buying from supplier)
- **GRN:** Goods Receipt Note (recording delivery)
- **LOT:** Batch of similar products
- **SO:** Sales Order (customer buying from you)
- **Challan:** Delivery document
- **Master Data:** Basic information setup

---

**Remember:** Each page solves one specific business problem, but they all work together to manage your complete textile business workflow!
