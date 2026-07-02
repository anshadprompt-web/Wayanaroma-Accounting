// ============================================
// WAYANAROMA ACCOUNTING DASHBOARD - Main App
// ============================================

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables
let currentUser = null;
let invoiceCounter = 0;
let products = [];
let invoices = [];
let expenses = [];
let bankAccounts = [];

// ============================================
// AUTHENTICATION
// ============================================

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');

    if (!email || !password) {
        errorMsg.textContent = 'Please fill in all fields';
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            currentUser = userCredential.user;
            showDashboard();
            loadAllData();
        })
        .catch(error => {
            errorMsg.textContent = error.message;
        });
}

function signup() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');

    if (!email || !password) {
        errorMsg.textContent = 'Please fill in all fields';
        return;
    }

    if (password.length < 6) {
        errorMsg.textContent = 'Password must be at least 6 characters';
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            currentUser = userCredential.user;
            showDashboard();
            loadAllData();
        })
        .catch(error => {
            errorMsg.textContent = error.message;
        });
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboardScreen').style.display = 'none';
        document.getElementById('loginForm').reset();
    });
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'flex';
    document.getElementById('userEmail').textContent = currentUser.email;
    setDefaultDates();
}

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active from all tab buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function switchSubTab(section, subTab) {
    // Hide all subtabs in this section
    const subtabs = document.querySelectorAll(`#${section}Tab .subtab-content`);
    subtabs.forEach(tab => tab.classList.remove('active'));

    // Remove active from all subtab buttons
    const buttons = document.querySelectorAll(`#${section}Tab .subtab-btn`);
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected subtab
    document.getElementById(subTab + 'Subtab').classList.add('active');
    event.target.classList.add('active');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    document.getElementById('purchaseBillDate').value = today;
    document.getElementById('cashDate').value = today;
    document.getElementById('expenseDate').value = today;
}

function generateInvoiceNumber() {
    return 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

function convertNumberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    function convert(n) {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    }

    if (num === 0) return 'Zero';
    return convert(num) + ' Rupees Only';
}

// ============================================
// LINE ITEMS MANAGEMENT
// ============================================

function addLineItem() {
    const tbody = document.getElementById('lineItemsBody');
    const rowCount = tbody.querySelectorAll('tr').length + 1;
    const newRow = document.createElement('tr');
    newRow.className = 'line-item-row';
    newRow.setAttribute('data-index', rowCount);
    newRow.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="item-name" placeholder="Select product" list="productsList"></td>
        <td><input type="text" class="item-sku" placeholder="SKU"></td>
        <td><input type="number" class="item-qty" placeholder="0" min="0" onchange="calculateInvoiceTotal()"></td>
        <td><input type="number" class="item-price" placeholder="0" min="0" step="0.01" onchange="calculateInvoiceTotal()"></td>
        <td><input type="number" class="item-total" placeholder="0" readonly></td>
        <td><button type="button" onclick="removeLineItem(this)" class="btn-remove">✕</button></td>
    `;
    tbody.appendChild(newRow);
    attachLineItemListeners();
}

function removeLineItem(btn) {
    btn.closest('tr').remove();
    calculateInvoiceTotal();
}

function attachLineItemListeners() {
    const rows = document.querySelectorAll('.line-item-row');
    rows.forEach(row => {
        const qtyInput = row.querySelector('.item-qty');
        const priceInput = row.querySelector('.item-price');
        qtyInput.addEventListener('change', () => {
            const total = (parseFloat(qtyInput.value) || 0) * (parseFloat(priceInput.value) || 0);
            row.querySelector('.item-total').value = total.toFixed(2);
            calculateInvoiceTotal();
        });
        priceInput.addEventListener('change', () => {
            const total = (parseFloat(qtyInput.value) || 0) * (parseFloat(priceInput.value) || 0);
            row.querySelector('.item-total').value = total.toFixed(2);
            calculateInvoiceTotal();
        });
    });
}

function calculateInvoiceTotal() {
    let subtotal = 0;
    const rows = document.querySelectorAll('.line-item-row');
    rows.forEach(row => {
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        subtotal += total;
    });

    const delivery = parseFloat(document.getElementById('deliveryCharge').value) || 0;
    const other = parseFloat(document.getElementById('otherCharges').value) || 0;
    const discount = parseFloat(document.getElementById('discountAmount').value) || 0;

    let gstAmount = 0;
    let totalAmount = subtotal + delivery + other - discount;

    document.getElementById('subtotal').value = subtotal.toFixed(2);

    if (document.getElementById('applyGST').checked) {
        const gstRate = parseFloat(document.getElementById('gstRate').value) || 0;
        gstAmount = totalAmount * (gstRate / 100);
        totalAmount += gstAmount;
        document.getElementById('gstAmount').value = gstAmount.toFixed(2);
        document.getElementById('gstRow').style.display = 'flex';
    } else {
        document.getElementById('gstRow').style.display = 'none';
    }

    document.getElementById('totalAmount').value = totalAmount.toFixed(2);
    document.getElementById('totalWords').value = convertNumberToWords(Math.floor(totalAmount));
    updateBalanceDue();
}

function updateBalanceDue() {
    const total = parseFloat(document.getElementById('totalAmount').value) || 0;
    const advance = parseFloat(document.getElementById('advancePaid').value) || 0;
    document.getElementById('balanceDue').value = (total - advance).toFixed(2);
}

// ============================================
// INVOICE OPERATIONS
// ============================================

function createInvoice() {
    const invoiceNumber = document.getElementById('invoiceNumber').value || generateInvoiceNumber();
    const invoiceDate = document.getElementById('invoiceDate').value;
    const customerName = document.getElementById('customerName').value;
    const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
    const paymentMode = document.getElementById('paymentMode').value;

    if (!customerName || !invoiceDate) {
        alert('Please fill in all required fields');
        return;
    }

    const lineItems = [];
    document.querySelectorAll('.line-item-row').forEach(row => {
        lineItems.push({
            name: row.querySelector('.item-name').value,
            sku: row.querySelector('.item-sku').value,
            qty: parseFloat(row.querySelector('.item-qty').value) || 0,
            price: parseFloat(row.querySelector('.item-price').value) || 0,
            total: parseFloat(row.querySelector('.item-total').value) || 0
        });
    });

    const invoice = {
        invoiceNumber,
        invoiceDate,
        dueDate: document.getElementById('dueDate').value,
        customerName,
        customerEmail: document.getElementById('customerEmail').value,
        customerPhone: document.getElementById('customerPhone').value,
        billingAddress: document.getElementById('billingAddress').value,
        shippingAddress: document.getElementById('shippingAddress').value,
        lineItems,
        deliveryCharge: parseFloat(document.getElementById('deliveryCharge').value) || 0,
        otherCharges: parseFloat(document.getElementById('otherCharges').value) || 0,
        discountAmount: parseFloat(document.getElementById('discountAmount').value) || 0,
        subtotal: parseFloat(document.getElementById('subtotal').value) || 0,
        applyGST: document.getElementById('applyGST').checked,
        gstRate: parseFloat(document.getElementById('gstRate').value) || 0,
        gstAmount: parseFloat(document.getElementById('gstAmount').value) || 0,
        totalAmount,
        totalWords: document.getElementById('totalWords').value,
        paymentMode,
        advancePaid: parseFloat(document.getElementById('advancePaid').value) || 0,
        balanceDue: parseFloat(document.getElementById('balanceDue').value) || 0,
        paymentNotes: document.getElementById('paymentNotes').value,
        notes: document.getElementById('invoiceNotes').value,
        terms: document.getElementById('invoiceTerms').value,
        status: 'pending',
        createdAt: new Date(),
        userId: currentUser.uid
    };

    db.collection('invoices').add(invoice)
        .then(() => {
            alert('Invoice created successfully!');
            clearInvoiceForm();
            loadInvoices();
        })
        .catch(error => alert('Error: ' + error.message));
}

function loadInvoices() {
    if (!currentUser) return;

    db.collection('invoices')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('invoicesList');
            tbody.innerHTML = '';
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No invoices yet</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const inv = doc.data();
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${inv.invoiceNumber}</td>
                    <td>${new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td>${inv.customerName}</td>
                    <td>₹${inv.totalAmount.toFixed(2)}</td>
                    <td><span class="badge">${inv.status}</span></td>
                    <td>
                        <button onclick="previewInvoice('${doc.id}')" class="btn-secondary">View</button>
                        <button onclick="deleteInvoice('${doc.id}')" class="btn-danger">Delete</button>
                    </td>
                `;
            });
        });
}

function previewInvoice(docId = null) {
    // If no docId, create from current form
    if (!docId) {
        const invoiceNumber = document.getElementById('invoiceNumber').value || generateInvoiceNumber();
        const html = generateInvoiceHTML({
            invoiceNumber,
            invoiceDate: document.getElementById('invoiceDate').value,
            customerName: document.getElementById('customerName').value,
            customerEmail: document.getElementById('customerEmail').value,
            billingAddress: document.getElementById('billingAddress').value,
            lineItems: getLineItemsFromForm(),
            deliveryCharge: parseFloat(document.getElementById('deliveryCharge').value) || 0,
            totalAmount: parseFloat(document.getElementById('totalAmount').value) || 0,
            totalWords: document.getElementById('totalWords').value,
            advancePaid: parseFloat(document.getElementById('advancePaid').value) || 0,
            balanceDue: parseFloat(document.getElementById('balanceDue').value) || 0
        });
        document.getElementById('printContent').innerHTML = html;
        document.getElementById('printModal').style.display = 'flex';
    }
}

function getLineItemsFromForm() {
    const items = [];
    document.querySelectorAll('.line-item-row').forEach((row, index) => {
        items.push({
            slno: index + 1,
            name: row.querySelector('.item-name').value,
            sku: row.querySelector('.item-sku').value,
            qty: parseFloat(row.querySelector('.item-qty').value) || 0,
            price: parseFloat(row.querySelector('.item-price').value) || 0,
            total: parseFloat(row.querySelector('.item-total').value) || 0
        });
    });
    return items;
}

function generateInvoiceHTML(data) {
    return `
        <div class="invoice-header">
            <div class="invoice-company">
                <div class="invoice-company-info">
                    <h1>WayanAroma</h1>
                    <p>Spice Mountain</p>
                    <p>Kuzhivayal, Thrikkaipetta P.O, Meppadi</p>
                    <p>Wayanad, Kerala | +91 79078 06468</p>
                    <p>wayanaromaindia@gmail.com</p>
                </div>
            </div>
            <div class="invoice-details">
                <h3>INVOICE</h3>
                <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p><strong>Date:</strong> ${new Date(data.invoiceDate).toLocaleDateString()}</p>
            </div>
        </div>

        <div class="invoice-info">
            <div class="invoice-info-block">
                <h4>Bill To:</h4>
                <p><strong>${data.customerName}</strong></p>
                <p>${data.billingAddress}</p>
                <p>${data.customerEmail}</p>
            </div>
        </div>

        <div class="invoice-items">
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>SL.NO</th>
                        <th>Item</th>
                        <th>SKU</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.lineItems.map(item => `
                        <tr>
                            <td>${item.slno}</td>
                            <td>${item.name}</td>
                            <td>${item.sku}</td>
                            <td>${item.qty}</td>
                            <td>₹${item.price.toFixed(2)}</td>
                            <td>₹${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="invoice-total">
                <div class="invoice-total-row">
                    <span>Subtotal:</span>
                    <span>₹${(data.lineItems.reduce((sum, item) => sum + item.total, 0)).toFixed(2)}</span>
                </div>
                ${data.deliveryCharge > 0 ? `
                    <div class="invoice-total-row">
                        <span>Delivery Charge:</span>
                        <span>₹${data.deliveryCharge.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="invoice-total-final">
                    <span>Total Amount:</span>
                    <span>₹${data.totalAmount.toFixed(2)}</span>
                </div>
                <div class="invoice-total-row">
                    <span>Amount in Words:</span>
                    <span>${data.totalWords}</span>
                </div>
                ${data.advancePaid > 0 ? `
                    <div class="invoice-total-row">
                        <span>Advance Paid:</span>
                        <span>₹${data.advancePaid.toFixed(2)}</span>
                    </div>
                    <div class="invoice-total-row">
                        <span>Balance Due:</span>
                        <span>₹${data.balanceDue.toFixed(2)}</span>
                    </div>
                ` : ''}
            </div>
        </div>

        <div class="invoice-bank">
            <h4>Bank Details for Payment Transfer:</h4>
            <p><strong>Bank Name:</strong> Federal Bank</p>
            <p><strong>Account Name:</strong> WAYAN AROMA</p>
            <p><strong>Account Number:</strong> 13450200012187</p>
            <p><strong>IFSC Code:</strong> FDRL0001345</p>
            <p><strong>Branch:</strong> KALPETTA</p>
        </div>
    `;
}

function printInvoice() {
    window.print();
}

function downloadInvoicePDF() {
    const element = document.getElementById('printContent');
    const opt = {
        margin: 10,
        filename: 'invoice.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
}

function closePrintModal() {
    document.getElementById('printModal').style.display = 'none';
}

function clearInvoiceForm() {
    document.getElementById('invoiceNumber').value = generateInvoiceNumber();
    document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('customerName').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('billingAddress').value = '';
    document.getElementById('shippingAddress').value = '';
    document.getElementById('deliveryCharge').value = '';
    document.getElementById('otherCharges').value = '';
    document.getElementById('discountAmount').value = '';
    document.getElementById('advancePaid').value = '';
    document.getElementById('applyGST').checked = false;
    
    const tbody = document.getElementById('lineItemsBody');
    tbody.innerHTML = `
        <tr class="line-item-row" data-index="0">
            <td>1</td>
            <td><input type="text" class="item-name" placeholder="Select product"></td>
            <td><input type="text" class="item-sku" placeholder="SKU"></td>
            <td><input type="number" class="item-qty" placeholder="0" min="0"></td>
            <td><input type="number" class="item-price" placeholder="0" min="0" step="0.01"></td>
            <td><input type="number" class="item-total" placeholder="0" readonly></td>
            <td><button type="button" onclick="removeLineItem(this)" class="btn-remove">✕</button></td>
        </tr>
    `;
    calculateInvoiceTotal();
}

function deleteInvoice(docId) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        db.collection('invoices').doc(docId).delete()
            .then(() => {
                alert('Invoice deleted');
                loadInvoices();
            });
    }
}

// ============================================
// INVENTORY OPERATIONS
// ============================================

function addProduct() {
    const name = document.getElementById('productName').value;
    const sku = document.getElementById('productSKU').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseFloat(document.getElementById('productStock').value) || 0;
    const category = document.getElementById('productCategory').value;
    const unit = document.getElementById('productUnit').value;
    const description = document.getElementById('productDescription').value;

    if (!name || !sku || !price) {
        alert('Please fill in required fields');
        return;
    }

    const product = {
        name,
        sku,
        price,
        stock,
        category,
        unit,
        description,
        createdAt: new Date(),
        userId: currentUser.uid
    };

    db.collection('products').add(product)
        .then(() => {
            alert('Product added successfully!');
            clearProductForm();
            loadProducts();
        })
        .catch(error => alert('Error: ' + error.message));
}

function loadProducts() {
    if (!currentUser) return;

    db.collection('products')
        .where('userId', '==', currentUser.uid)
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('productsList');
            tbody.innerHTML = '';
            products = [];

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products yet</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const prod = doc.data();
                products.push({ id: doc.id, ...prod });
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${prod.name}</td>
                    <td>${prod.sku}</td>
                    <td>${prod.category}</td>
                    <td>₹${prod.price.toFixed(2)}</td>
                    <td>${prod.stock}</td>
                    <td>${prod.unit}</td>
                    <td>
                        <button onclick="editProduct('${doc.id}')" class="btn-secondary">Edit</button>
                        <button onclick="deleteProduct('${doc.id}')" class="btn-danger">Delete</button>
                    </td>
                `;
            });
        });
}

function clearProductForm() {
    document.getElementById('productName').value = '';
    document.getElementById('productSKU').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productDescription').value = '';
}

function deleteProduct(docId) {
    if (confirm('Are you sure?')) {
        db.collection('products').doc(docId).delete()
            .then(() => {
                alert('Product deleted');
                loadProducts();
            });
    }
}

function searchProducts() {
    const query = document.getElementById('productSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#productsList tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

// ============================================
// PURCHASE BILL OPERATIONS
// ============================================

function createPurchaseBill() {
    const billNumber = document.getElementById('purchaseBillNumber').value || 'PB-' + new Date().getTime();
    const billDate = document.getElementById('purchaseBillDate').value;
    const supplierName = document.getElementById('supplierName').value;
    const category = document.getElementById('purchaseCategory').value;

    if (!billNumber || !billDate || !supplierName) {
        alert('Please fill in required fields');
        return;
    }

    const bill = {
        billNumber,
        billDate,
        supplierName,
        supplierEmail: document.getElementById('supplierEmail').value,
        category,
        createdAt: new Date(),
        userId: currentUser.uid
    };

    db.collection('purchaseBills').add(bill)
        .then(() => {
            alert('Purchase bill created!');
            clearPurchaseBillForm();
            loadPurchaseBills();
        })
        .catch(error => alert('Error: ' + error.message));
}

function loadPurchaseBills() {
    if (!currentUser) return;

    db.collection('purchaseBills')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('purchaseBillsList');
            tbody.innerHTML = '';

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No purchase bills</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const bill = doc.data();
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${bill.billNumber}</td>
                    <td>${new Date(bill.billDate).toLocaleDateString()}</td>
                    <td>${bill.supplierName}</td>
                    <td>${bill.category}</td>
                    <td>₹0</td>
                    <td><button onclick="deletePurchaseBill('${doc.id}')" class="btn-danger">Delete</button></td>
                `;
            });
        });
}

function clearPurchaseBillForm() {
    document.getElementById('purchaseBillNumber').value = '';
    document.getElementById('purchaseBillDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('supplierName').value = '';
    document.getElementById('supplierEmail').value = '';
}

function deletePurchaseBill(docId) {
    if (confirm('Delete this bill?')) {
        db.collection('purchaseBills').doc(docId).delete()
            .then(() => {
                alert('Bill deleted');
                loadPurchaseBills();
            });
    }
}

function addPurchaseLineItem() {
    const tbody = document.getElementById('purchaseLineItemsBody');
    const rowCount = tbody.querySelectorAll('tr').length + 1;
    const newRow = document.createElement('tr');
    newRow.className = 'line-item-row';
    newRow.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="item-name" placeholder="Product name"></td>
        <td><input type="text" class="item-sku" placeholder="SKU"></td>
        <td><input type="number" class="item-qty" placeholder="0" min="0" onchange="calculatePurchaseTotal()"></td>
        <td><input type="number" class="item-price" placeholder="0" min="0" step="0.01" onchange="calculatePurchaseTotal()"></td>
        <td><input type="number" class="item-total" placeholder="0" readonly></td>
        <td><button type="button" onclick="removePurchaseLineItem(this)" class="btn-remove">✕</button></td>
    `;
    tbody.appendChild(newRow);
}

function removePurchaseLineItem(btn) {
    btn.closest('tr').remove();
    calculatePurchaseTotal();
}

function calculatePurchaseTotal() {
    let subtotal = 0;
    document.querySelectorAll('#purchaseLineItemsBody .line-item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = qty * price;
        row.querySelector('.item-total').value = total.toFixed(2);
        subtotal += total;
    });
    document.getElementById('purchaseSubtotal').value = subtotal.toFixed(2);
    document.getElementById('purchaseTotalAmount').value = subtotal.toFixed(2);
}

function clearPurchaseBillForm() {
    document.getElementById('purchaseBillNumber').value = '';
    document.getElementById('purchaseBillDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('supplierName').value = '';
}

// ============================================
// EXPENSE OPERATIONS
// ============================================

function createExpense() {
    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const description = document.getElementById('expenseDescription').value;

    if (!date || !amount) {
        alert('Please fill in required fields');
        return;
    }

    const expense = {
        date,
        category,
        amount,
        description,
        createdAt: new Date(),
        userId: currentUser.uid
    };

    db.collection('expenses').add(expense)
        .then(() => {
            alert('Expense recorded!');
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('expenseAmount').value = '';
            document.getElementById('expenseDescription').value = '';
            loadExpenses();
        })
        .catch(error => alert('Error: ' + error.message));
}

function loadExpenses() {
    if (!currentUser) return;

    db.collection('expenses')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('expensesList');
            tbody.innerHTML = '';

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No expenses</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const exp = doc.data();
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(exp.date).toLocaleDateString()}</td>
                    <td>${exp.category}</td>
                    <td>${exp.description}</td>
                    <td>₹${exp.amount.toFixed(2)}</td>
                    <td><button onclick="deleteExpense('${doc.id}')" class="btn-danger">Delete</button></td>
                `;
            });
        });
}

function deleteExpense(docId) {
    if (confirm('Delete?')) {
        db.collection('expenses').doc(docId).delete()
            .then(() => loadExpenses());
    }
}

// ============================================
// CASH & BANK OPERATIONS
// ============================================

function addBankAccount() {
    const bankName = document.getElementById('bankName').value;
    const accountName = document.getElementById('accountName').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const ifsc = document.getElementById('ifscCode').value;
    const branch = document.getElementById('bankBranch').value;
    const opening = parseFloat(document.getElementById('openingBalance').value) || 0;

    if (!bankName || !accountName || !accountNumber || !ifsc) {
        alert('Please fill in required fields');
        return;
    }

    const account = {
        bankName,
        accountName,
        accountNumber,
        ifsc,
        branch,
        openingBalance: opening,
        currentBalance: opening,
        createdAt: new Date(),
        userId: currentUser.uid
    };

    db.collection('bankAccounts').add(account)
        .then(() => {
            alert('Bank account added!');
            clearBankForm();
            loadBankAccounts();
        })
        .catch(error => alert('Error: ' + error.message));
}

function loadBankAccounts() {
    if (!currentUser) return;

    db.collection('bankAccounts')
        .where('userId', '==', currentUser.uid)
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('bankAccountsList');
            tbody.innerHTML = '';
            bankAccounts = [];

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No accounts</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const account = doc.data();
                bankAccounts.push({ id: doc.id, ...account });
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${account.bankName}</td>
                    <td>${account.accountName}</td>
                    <td>${account.accountNumber}</td>
                    <td>${account.ifsc}</td>
                    <td>₹${account.currentBalance.toFixed(2)}</td>
                    <td><button onclick="deleteAccount('${doc.id}')" class="btn-danger">Delete</button></td>
                `;
            });

            // Update cheque bank dropdown
            const select = document.getElementById('chequeBank');
            select.innerHTML = '<option value="">Select Bank</option>';
            bankAccounts.forEach(acc => {
                const opt = document.createElement('option');
                opt.value = acc.id;
                opt.textContent = acc.bankName + ' - ' + acc.accountNumber;
                select.appendChild(opt);
            });
        });
}

function clearBankForm() {
    document.getElementById('bankName').value = '';
    document.getElementById('accountName').value = '';
    document.getElementById('accountNumber').value = '';
    document.getElementById('ifscCode').value = '';
    document.getElementById('bankBranch').value = '';
    document.getElementById('openingBalance').value = '';
}

function deleteAccount(docId) {
    if (confirm('Delete?')) {
        db.collection('bankAccounts').doc(docId).delete()
            .then(() => loadBankAccounts());
    }
}

function recordCashTransaction() {
    const date = document.getElementById('cashDate').value;
    const type = document.getElementById('cashType').value;
    const amount = parseFloat(document.getElementById('cashAmount').value);
    const description = document.getElementById('cashDescription').value;

    if (!date || !amount) {
        alert('Please fill in required fields');
        return;
    }

    const transaction = {
        date,
        type,
        amount,
        description,
        createdAt: new Date(),
        userId: currentUser.uid
    };

    db.collection('cashTransactions').add(transaction)
        .then(() => {
            document.getElementById('cashDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('cashAmount').value = '';
            document.getElementById('cashDescription').value = '';
            loadCashTransactions();
        });
}

function loadCashTransactions() {
    if (!currentUser) return;

    db.collection('cashTransactions')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('cashTransactionsList');
            tbody.innerHTML = '';
            let balance = 0;

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No transactions</td></tr>';
                document.getElementById('currentCashBalance').textContent = '₹0';
                return;
            }

            snapshot.forEach(doc => {
                const trans = doc.data();
                balance += (trans.type === 'in' ? trans.amount : -trans.amount);
                const row = tbody.insertRow(0);
                row.innerHTML = `
                    <td>${new Date(trans.date).toLocaleDateString()}</td>
                    <td>${trans.type === 'in' ? 'Cash In' : 'Cash Out'}</td>
                    <td>₹${trans.amount.toFixed(2)}</td>
                    <td>${trans.description}</td>
                    <td>₹${balance.toFixed(2)}</td>
                    <td><button onclick="deleteCashTransaction('${doc.id}')" class="btn-danger">Delete</button></td>
                `;
            });

            document.getElementById('currentCashBalance').textContent = '₹' + balance.toFixed(2);
        });
}

function deleteCashTransaction(docId) {
    if (confirm('Delete?')) {
        db.collection('cashTransactions').doc(docId).delete()
            .then(() => loadCashTransactions());
    }
}

// ============================================
// REPORTS OPERATIONS
// ============================================

function generateOverviewReport() {
    if (!currentUser) return;

    const period = document.getElementById('overviewPeriod').value;
    let fromDate = new Date();
    let toDate = new Date();

    switch(period) {
        case 'today':
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            fromDate.setDate(fromDate.getDate() - 7);
            break;
        case 'month':
            fromDate.setMonth(fromDate.getMonth() - 1);
            break;
        case 'year':
            fromDate.setFullYear(fromDate.getFullYear() - 1);
            break;
    }

    // Get all sales
    let totalSales = 0;
    let totalPurchases = 0;
    let totalExpenses = 0;

    db.collection('invoices')
        .where('userId', '==', currentUser.uid)
        .where('createdAt', '>=', fromDate)
        .where('createdAt', '<=', toDate)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                totalSales += doc.data().totalAmount;
            });

            document.getElementById('totalSalesCard').textContent = '₹' + totalSales.toFixed(2);

            // Load purchases
            return db.collection('purchaseBills').where('userId', '==', currentUser.uid).get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                totalPurchases += 100; // Placeholder
            });
            document.getElementById('totalPurchasesCard').textContent = '₹' + totalPurchases.toFixed(2);

            return db.collection('expenses').where('userId', '==', currentUser.uid).get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                totalExpenses += doc.data().amount;
            });
            document.getElementById('totalExpensesCard').textContent = '₹' + totalExpenses.toFixed(2);

            // Calculate profit
            const grossProfit = totalSales - totalPurchases - totalExpenses;
            document.getElementById('grossProfitCard').textContent = '₹' + grossProfit.toFixed(2);
        });
}

function generateSalesReport() {
    if (!currentUser) return;

    db.collection('invoices')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('salesReportBody');
            tbody.innerHTML = '';
            let totalSales = 0;
            let totalPaid = 0;

            snapshot.forEach(doc => {
                const inv = doc.data();
                totalSales += inv.totalAmount;
                totalPaid += inv.advancePaid;
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td>${inv.invoiceNumber}</td>
                    <td>${inv.customerName}</td>
                    <td>₹${inv.totalAmount.toFixed(2)}</td>
                    <td>₹${inv.advancePaid.toFixed(2)}</td>
                    <td>₹${inv.balanceDue.toFixed(2)}</td>
                `;
            });

            document.getElementById('reportTotalSales').textContent = '₹' + totalSales.toFixed(2);
            document.getElementById('reportTotalPaid').textContent = '₹' + totalPaid.toFixed(2);
            document.getElementById('reportOutstanding').textContent = '₹' + (totalSales - totalPaid).toFixed(2);
        });
}

function generatePurchaseReport() {
    if (!currentUser) return;

    db.collection('purchaseBills')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('purchaseReportBody');
            tbody.innerHTML = '';
            let total = 0;

            snapshot.forEach(doc => {
                const bill = doc.data();
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(bill.billDate).toLocaleDateString()}</td>
                    <td>${bill.billNumber}</td>
                    <td>${bill.supplierName}</td>
                    <td>${bill.category}</td>
                    <td>₹0</td>
                `;
            });

            document.getElementById('reportTotalPurchases').textContent = '₹' + total.toFixed(2);
        });
}

function generateStockReport() {
    const tbody = document.getElementById('stockReportBody');
    tbody.innerHTML = '';
    let totalValue = 0;
    let totalItems = 0;

    products.forEach(prod => {
        const value = prod.price * prod.stock;
        totalValue += value;
        totalItems += prod.stock;
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${prod.name}</td>
            <td>${prod.sku}</td>
            <td>${prod.category}</td>
            <td>₹${prod.price.toFixed(2)}</td>
            <td>${prod.stock}</td>
            <td>${prod.unit}</td>
            <td>₹${value.toFixed(2)}</td>
        `;
    });

    document.getElementById('totalInventoryValue').textContent = '₹' + totalValue.toFixed(2);
    document.getElementById('totalItems').textContent = totalItems;
}

function generateExpenseReport() {
    if (!currentUser) return;

    db.collection('expenses')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('expenseReportBody');
            tbody.innerHTML = '';
            let total = 0;

            snapshot.forEach(doc => {
                const exp = doc.data();
                total += exp.amount;
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(exp.date).toLocaleDateString()}</td>
                    <td>${exp.category}</td>
                    <td>${exp.description}</td>
                    <td>₹${exp.amount.toFixed(2)}</td>
                `;
            });

            document.getElementById('reportTotalExpenses').textContent = '₹' + total.toFixed(2);
        });
}

function generateCashFlowReport() {
    if (!currentUser) return;

    db.collection('cashTransactions')
        .where('userId', '==', currentUser.uid)
        .orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('cashflowReportBody');
            tbody.innerHTML = '';
            let inflow = 0;
            let outflow = 0;
            let balance = 0;

            snapshot.forEach(doc => {
                const trans = doc.data();
                if (trans.type === 'in') {
                    inflow += trans.amount;
                    balance += trans.amount;
                } else {
                    outflow += trans.amount;
                    balance -= trans.amount;
                }
                const row = tbody.insertRow(0);
                row.innerHTML = `
                    <td>${new Date(trans.date).toLocaleDateString()}</td>
                    <td>${trans.description}</td>
                    <td>${trans.type === 'in' ? '₹' + trans.amount.toFixed(2) : '-'}</td>
                    <td>${trans.type === 'out' ? '₹' + trans.amount.toFixed(2) : '-'}</td>
                    <td>₹${balance.toFixed(2)}</td>
                `;
            });

            document.getElementById('cashInflow').textContent = '₹' + inflow.toFixed(2);
            document.getElementById('cashOutflow').textContent = '₹' + outflow.toFixed(2);
            document.getElementById('closingCashBalance').textContent = '₹' + balance.toFixed(2);
        });
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function exportSalesReport() {
    const ws = XLSX.utils.table_to_sheet(document.getElementById('salesReportBody').closest('table'));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, 'sales-report.xlsx');
}

function printSalesReport() {
    window.print();
}

// ============================================
// STUB FUNCTIONS (Quotation, Proforma, etc.)
// ============================================

function createQuotation() {
    alert('Quotation feature - Coming soon with full details');
}

function clearQuotationForm() {}

function createProforma() {
    alert('Proforma Invoice feature - Coming soon');
}

function clearProformaForm() {}

function createSaleOrder() {
    alert('Sale Order feature - Coming soon');
}

function clearOrderForm() {}

function createDeliveryChallan() {
    alert('Delivery Challan feature - Coming soon');
}

function clearChallanForm() {}

function createCreditNote() {
    alert('Credit Note feature - Coming soon');
}

function clearCreditForm() {}

function createPaymentOut() {
    alert('Payment Out feature - Coming soon');
}

function recordCheque() {
    alert('Cheque feature - Coming soon');
}

function createPurchaseOrder() {
    alert('Purchase Order feature - Coming soon');
}

function createPurchaseReturn() {
    alert('Purchase Return feature - Coming soon');
}

function addLoanAccount() {
    alert('Loan Account feature - Coming soon');
}

function searchInvoices() {
    const query = document.getElementById('invoiceSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#invoicesList tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function exportOverviewReport() {
    alert('Export functionality - Coming soon');
}

function printOverviewReport() {
    window.print();
}

function exportPurchaseReport() {
    alert('Export functionality - Coming soon');
}

function exportStockReport() {
    alert('Export functionality - Coming soon');
}

function exportExpenseReport() {
    alert('Export functionality - Coming soon');
}

function exportCashFlowReport() {
    alert('Export functionality - Coming soon');
}

// ============================================
// INITIALIZATION
// ============================================

function loadAllData() {
    loadInvoices();
    loadProducts();
    loadPurchaseBills();
    loadExpenses();
    loadBankAccounts();
    loadCashTransactions();
    generateOverviewReport();
}

// Check if user is already logged in
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        showDashboard();
        loadAllData();
    }
});

// Set default invoice number
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('invoiceNumber').value = generateInvoiceNumber();
    setDefaultDates();
});
