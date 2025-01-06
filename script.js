const store = {
  user: null,
  cart: [],
  selectedProduct: null,
  transactions: []
};

const SessionManager = {
  setUser(user) {
    sessionStorage.setItem('user', JSON.stringify(user));
    store.user = user;
  },
  
  getUser() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  clearUser() {
    sessionStorage.removeItem('user');
    store.user = null;
  },
  
  setSelectedProduct(product) {
    sessionStorage.setItem('selectedProduct', JSON.stringify(product));
    store.selectedProduct = product;
  },
  
  getSelectedProduct() {
    const product = sessionStorage.getItem('selectedProduct');
    return product ? JSON.parse(product) : null;
  },

  addTransaction(transaction) {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    sessionStorage.setItem('transactions', JSON.stringify(transactions));
    sessionStorage.setItem('lastTransaction', JSON.stringify(transaction));
  },
  
  getTransactions() {
    return JSON.parse(sessionStorage.getItem('transactions') || '[]');
  },

  getLastTransaction() {
    const transaction = sessionStorage.getItem('lastTransaction');
    return transaction ? JSON.parse(transaction) : null;
  }
};

const FormValidator = {
  validateTransaction(formData) {
    const errors = {};
    
    if (!formData.productName?.trim()) {
      errors.productName = 'Nama produk harus diisi';
    }
    
    if (!formData.quantity || formData.quantity < 1) {
      errors.quantity = 'Jumlah harus lebih dari 0';
    }
    
    if (!formData.address?.trim()) {
      errors.address = 'Alamat harus diisi';
    }
    
    if (!formData.payment?.trim()) {
      errors.payment = 'Pilih metode pembayaran';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  displayErrors(errors) {
    Object.keys(errors).forEach(field => {
      const errorElement = document.getElementById(`${field}Error`);
      if (errorElement) {
        errorElement.textContent = errors[field];
      }
    });
  },

  clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.textContent = '';
    });
  }
};

function checkAuth() {
  const protectedPages = ['profile.html', 'transaction.html', 'transactionlist.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage) && !SessionManager.getUser()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

const EventHandlers = {
  handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      alert('Email dan password harus diisi');
      return;
    }
    
    const user = {
      email,
      name: email.split('@')[0],
      isLoggedIn: true
    };
    
    SessionManager.setUser(user);
    window.location.href = 'loginsuccess.html';
  },

  handleTransactionSubmit(e) {
    e.preventDefault();
    FormValidator.clearErrors();
    
    const formData = {
      productName: document.getElementById('productName').value,
      quantity: document.getElementById('quantity').value,
      address: document.getElementById('address').value,
      payment: document.getElementById('payment').value
    };
    
    const { isValid, errors } = FormValidator.validateTransaction(formData);
    
    if (!isValid) {
      FormValidator.displayErrors(errors);
      return;
    }
    
    SessionManager.addTransaction(formData);
    window.location.href = 'transactionsuccess.html';
  },

  handleProductClick(e, productCard) {
    if (!SessionManager.getUser()) {
      e.preventDefault();
      window.location.href = 'login.html';
      return;
    }
    
    if (productCard) {
      const product = {
        name: productCard.querySelector('h3').textContent,
        price: productCard.querySelector('p').textContent
      };
      SessionManager.setSelectedProduct(product);
    }
  }
};

const PageInit = {
  initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);

    function toggleMenu() {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      overlay.classList.toggle('active');
      document.body.style.overflow = document.body.style.overflow === 'hidden' ? '' : 'hidden';
    }

    if (hamburger) {
      hamburger.addEventListener('click', toggleMenu);
      overlay.addEventListener('click', toggleMenu);
    }

    const user = SessionManager.getUser();
    const loginLink = document.querySelector('a[href="login.html"]');
    if (user && loginLink) {
      loginLink.textContent = 'Logout';
      loginLink.href = '#';
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        SessionManager.clearUser();
        window.location.href = 'index.html';
      });
    }
  },

  login() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', EventHandlers.handleLogin);
    }
  },
  
  profile() {
    if (!checkAuth()) return;
    
    const user = SessionManager.getUser();
    if (user) {
      document.querySelector('.profile-name').textContent = user.name;
      document.querySelector('p[class="profile-status"]').textContent = `Member sejak ${new Date().getFullYear()}`;
    }
  },
  
  transaction() {
    if (!checkAuth()) return;
    
    const form = document.getElementById('transactionForm');
    if (!form) return;
    
    const selectedProduct = SessionManager.getSelectedProduct();
    if (selectedProduct) {
      document.getElementById('productName').value = selectedProduct.name;
    }
    
    form.addEventListener('submit', EventHandlers.handleTransactionSubmit);
  },
  
  products() {
    const buyButtons = document.querySelectorAll('.btn-primary');
    buyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productCard = button.closest('.product-card');
        EventHandlers.handleProductClick(e, productCard);
      });
    });
  },

  transactionList() {
    if (!checkAuth()) return;
    
    const tableBody = document.getElementById('transactionTableBody');
    if (!tableBody) return;

    const transactions = SessionManager.getTransactions();
    transactions.forEach(transaction => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${transaction.productName}</td>
        <td>${transaction.quantity}</td>
        <td>${transaction.address}</td>
        <td>${transaction.payment}</td>
      `;
      tableBody.appendChild(row);
    });
  },

  transactionSuccess() {
    const detailsDiv = document.getElementById('transactionDetails');
    if (!detailsDiv) return;

    const details = SessionManager.getLastTransaction();
    if (details) {
      detailsDiv.innerHTML = `
        <p><strong>Produk:</strong> ${details.productName}</p>
        <p><strong>Jumlah:</strong> ${details.quantity}</p>
        <p><strong>Alamat:</strong> ${details.address}</p>
        <p><strong>Metode Pembayaran:</strong> ${details.payment}</p>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PageInit.initNavigation();
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  switch (currentPage) {
    case 'login.html':
      PageInit.login();
      break;
    case 'profile.html':
      PageInit.profile();
      break;
    case 'transaction.html':
      PageInit.transaction();
      break;
    case 'index.html':
      PageInit.products();
      break;
    case 'transactionlist.html':
      PageInit.transactionList();
      break;
    case 'transactionsuccess.html':
      PageInit.transactionSuccess();
      break;
  }
});