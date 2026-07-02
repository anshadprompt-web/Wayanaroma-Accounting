# Wayanaroma Accounting Dashboard

A complete, interactive accounting & billing management system for **Wayanaroma Spice Mountain** business.

## ✨ Features

### 📊 Sales Management
- Create invoices with auto-calculated totals
- GST/Non-GST invoice options
- Quotations, Proforma invoices, Sale orders
- Delivery challans & Credit notes
- Multiple payment modes (Cash, Cheque, Bank Transfer, Card, Credit)
- Partial payments & payment reminders
- Print & PDF export

### 📦 Purchase & Expenses
- Purchase bills with category options (Raw Material, Packing, Machinery)
- Payment-out tracking
- Expense management with categorization
- Purchase orders & Return notes

### 📋 Inventory Management
- Add/Edit/Delete products
- Track stock levels
- Auto-link products to sales invoices
- Product categories & SKU management

### 💰 Cash & Bank
- Manage multiple bank accounts
- Cash-in-hand tracking
- Cheque management
- Loan account tracking with EMI calculations

### 📈 Reports & Analytics
- Daily/Weekly/Monthly/Yearly reports
- Sales reports with outstanding tracking
- Purchase reports by category
- Stock reports with inventory value
- Expense analysis
- Cash flow statements
- Financial overview dashboard

### 🔐 Security
- Email/Password authentication
- Multi-user support
- Cloud storage with Firebase
- Auto-save to cloud

---

## 🚀 Quick Start

### Option 1: Use Firebase Hosting (Recommended)

1. **Create Firebase Project**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Create a new project
   - Enable Firestore Database (start in test mode)
   - Enable Email/Password authentication
   - Copy your Firebase config

2. **Deploy to Firebase Hosting**
   ```bash
   npm install -g firebase-tools
   git clone https://github.com/anshadprompt-web/Wayanaroma-Accounting.git
   cd Wayanaroma-Accounting
   firebase login
   firebase init hosting
   firebase deploy
   ```

   Your app will be live at: `https://wayanaroma-accounting.web.app`

### Option 2: Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/anshadprompt-web/Wayanaroma-Accounting.git
   cd Wayanaroma-Accounting
   ```

2. **Open in browser**
   - Double-click `index.html` OR
   - Use a local server:
   ```bash
   python -m http.server 8000
   # Open http://localhost:8000 in browser
   ```

3. **First login**
   - Sign up with your email & password
   - Dashboard loads automatically

---

## 📱 Device Compatibility

- ✅ Desktop (Windows, Mac, Linux)
- ✅ Tablet (iPad, Android tablets)
- ✅ Mobile (iOS, Android)
- ✅ Responsive design - works on all screen sizes

---

## 📁 File Structure

```
Wayanaroma-Accounting/
├── index.html           # Main UI structure
├── styles.css          # Responsive styling
├── app.js              # All functionality
├── firebase-config.js  # Firebase setup
└── README.md           # This file
```

---

## 🔧 Configuration

### Firestore Security Rules

For development (test mode):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For production:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /invoices/{doc} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    match /products/{doc} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    // Add similar rules for other collections
  }
}
```

---

## 💾 Database Schema

### Collections

**invoices**
- invoiceNumber, invoiceDate, dueDate
- customerName, customerEmail, customerPhone
- lineItems, deliveryCharge, totalAmount
- paymentMode, advancePaid, balanceDue
- applyGST, gstAmount, status
- createdAt, userId

**products**
- name, sku, price, stock
- category, unit, description
- createdAt, userId

**purchaseBills**
- billNumber, billDate, dueDate
- supplierName, supplierEmail
- category, totalAmount
- createdAt, userId

**expenses**
- date, category, amount, description
- createdAt, userId

**bankAccounts**
- bankName, accountNumber, ifsc
- accountName, branch
- openingBalance, currentBalance
- createdAt, userId

**cashTransactions**
- date, type (in/out), amount, description
- createdAt, userId

---

## 🎨 Company Details

**WayanAroma Spice Mountain**
- Location: Kuzhivayal, Thrikkaipetta P.O, Meppadi, Wayanad, Kerala
- Phone: +91 79078 06468
- Email: wayanaromaindia@gmail.com
- Website: www.wayanaroma.com

**Bank Details**
- Bank: Federal Bank
- Account Name: WAYAN AROMA
- Account Number: 13450200012187
- IFSC Code: FDRL0001345
- Branch: KALPETTA

---

## 📖 Usage Guide

### Creating an Invoice
1. Go to **Sales Tab** → **Invoices**
2. Fill in customer details
3. Add line items (Product, Qty, Price)
4. Apply GST if needed
5. Click **Preview** to see formatted invoice
6. Click **Save Invoice** to store in cloud

### Adding Products
1. Go to **Inventory Tab**
2. Fill in Product Name, SKU, Price, Stock
3. Select Category & Unit
4. Click **Add Product**
5. Products auto-appear in invoice dropdown

### Viewing Reports
1. Go to **Reports Tab**
2. Select report type (Overview, Sales, Purchase, Stock, Expense, Cash Flow)
3. Choose date range
4. Click **Generate**
5. Export to Excel or print

---

## 🔐 Login Credentials

First time:
- Click **Sign Up** button
- Enter any email & password (min 6 characters)
- Creates account automatically

Next time:
- Use same email & password to login

---

## 🐛 Troubleshooting

**App not loading?**
- Check internet connection
- Verify Firebase config in `firebase-config.js`
- Clear browser cache and refresh

**Can't save data?**
- Verify Firestore is enabled in Firebase Console
- Check database security rules allow writes
- Ensure you're logged in

**PDF export not working?**
- Update browser to latest version
- Try different browser (Chrome, Firefox, Safari)

**Mobile display issues?**
- Rotate device to landscape for better view
- Use browser zoom-in function
- App is fully responsive but works best at 100% zoom

---

## 📊 Features Roadmap

### Completed ✅
- Invoice creation & management
- Product/Inventory management
- Purchase bill tracking
- Expense management
- Cash & Bank management
- Financial reports
- Print & Export
- Multi-user login
- Cloud storage
- Mobile responsive

### Coming Soon 🔄
- Advanced PDF customization
- Email invoice sending
- Recurring invoices
- Auto-backup to Google Drive
- SMS/Email reminders for due payments
- Advanced analytics with charts
- API integration for automated tasks
- Mobile app (iOS/Android)

---

## 📞 Support

For issues or feature requests:
- Email: wayanaromaindia@gmail.com
- Check GitHub Issues: [https://github.com/anshadprompt-web/Wayanaroma-Accounting/issues](https://github.com/anshadprompt-web/Wayanaroma-Accounting/issues)

---

## 📄 License

This project is proprietary to WayanAroma Spice Mountain. All rights reserved.

---

## 🙏 Credits

Built with:
- Firebase (Backend & Authentication)
- HTML5, CSS3, JavaScript (Frontend)
- html2pdf.js (PDF export)
- XLSX.js (Excel export)

---

**Version:** 1.0  
**Last Updated:** July 2024  
**Status:** Production Ready ✅

---

### 🎯 Next Steps

1. **Create Firebase Account** - [firebase.google.com](https://firebase.google.com)
2. **Deploy or Run Locally** - Follow Quick Start section above
3. **Sign Up** - Create your first account
4. **Add Products** - Start building your inventory
5. **Create Invoices** - Begin issuing bills to customers
6. **Track Reports** - Monitor your business analytics

**Happy Accounting! 📊💰**
