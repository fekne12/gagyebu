// --- Firebase Global Instances (Canvas 환경에서 제공) ---
// These variables are provided by the Canvas environment.
// Do NOT modify these lines.
let db = null;
let auth = null;
let userId = null;
let firebaseInitialized = false;

// Firebase SDK imports (moved from HTML to JS for better module management)
// NOTE: Corrected import paths by removing extra square brackets and parentheses.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection, query, where, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase 초기화 및 인증 설정
// 이곳에 사용자님의 실제 Firebase 프로젝트 설정을 입력합니다.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwIkTnHg8_lDw_AYVVH859jD_8d658xAk",
  authDomain: "gagyebu-36b54.firebaseapp.com",
  projectId: "gagyebu-36b54",
  storageBucket: "gagyebu-36b54.firebasestorage.app",
  messagingSenderId: "496739106007",
  appId: "1:496739106007:web:b70467fc791ccf61f50492",
  measurementId: "G-X251LV704N"
};

// GitHub Pages에서는 Canvas의 특별한 초기 인증 토큰이 필요 없습니다.
const appId = firebaseConfig.appId; // 위에서 설정한 appId를 사용합니다.
const initialAuthToken = null; // 이 값은 사용하지 않습니다.

if (Object.keys(firebaseConfig).length > 0 && firebaseConfig.apiKey && firebaseConfig.projectId) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            console.log("Firebase: User is signed in with UID:", userId);
            firebaseInitialized = true;
            initApp(); // Initialize the main app after user is authenticated
            showMainApp();
        } else {
            console.log("Firebase: No user is signed in. Attempting anonymous/custom token sign-in.");
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                    console.log("Firebase: Signed in with custom token.");
                } else {
                    await signInAnonymously(auth);
                    console.log("Firebase: Signed in anonymously.");
                }
            } catch (error) {
                console.error("Firebase: Anonymous/Custom token sign-in failed", error);
                // If even anonymous sign-in fails, show auth section and let user log in/register
                firebaseInitialized = true; // Still consider Firebase ready, but no user
                showAuthSection();
            }
        }
    });
} else {
    console.warn("Firebase: Firebase config is not fully provided. Running in limited mode (no database persistence).");
    // Fallback for local development or if Firebase config is missing
    firebaseInitialized = true;
    userId = crypto.randomUUID(); // Generate a random ID for local-only use
    initApp(); // Initialize app without Firebase persistence
    showMainApp(); // Show app directly if no Firebase config
}


// --- Configuration (설정) ---
// Initial account groups. These will be added to Firestore for new users.
const initialAccountGroups = [
    {
        groupName: "은행 계좌",
        type: "자산",
        accounts: [
            { name: "우리은행 통장", initialBalance: 500000 },
            { name: "카카오뱅크 통장", initialBalance: 200000 },
        ]
    },
    {
        groupName: "현금",
        type: "자산",
        accounts: [
            { name: "현금", initialBalance: 100000 },
        ]
    },
    {
        groupName: "투자 계좌",
        type: "자산",
        accounts: [
            { name: "주식 투자", initialBalance: 0 },
            { name: "부동산", initialBalance: 0 },
        ]
    },
    {
        groupName: "신용카드",
        type: "부채",
        accounts: [
            { name: "신한카드 (결제 예정)", initialBalance: 0 },
        ]
    },
    {
        groupName: "대출",
        type: "부채",
        accounts: [
            { name: "주택담보대출", initialBalance: -100000000 },
            { name: "자동차 할부금", initialBalance: -5000000 },
        ]
    },
    {
        groupName: "수익",
        type: "수익",
        accounts: [
            { name: "월급", initialBalance: 0 },
            { name: "부수입", initialBalance: 0 },
            { name: "투자수익", initialBalance: 0 },
        ]
    },
    {
        groupName: "비용",
        type: "비용",
        accounts: [
            { name: "식비", initialBalance: 0 },
            { name: "교통비", initialBalance: 0 },
            { name: "통신비", initialBalance: 0 },
            { name: "주거비", initialBalance: 0 },
            { name: "문화생활비", initialBalance: 0 },
            { name: "교육비", initialBalance: 0 },
            { name: "의료비", initialBalance: 0 },
            { name: "경조사비", initialBalance: 0 },
            { name: "의류/미용비", initialBalance: 0 },
            { name: "기타", initialBalance: 0 },
        ]
    },
];


// --- DOM Elements (HTML 요소 가져오기) ---
const authSection = document.getElementById('auth-section');
const mainAppSection = document.getElementById('main-app-section');
const authMessageDisplay = document.getElementById('auth-message-display');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const resetPasswordBtn = document.getElementById('reset-password-btn');
const logoutBtn = document.getElementById('logout-btn');

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const messageDisplay = document.getElementById('message-display');

// Transaction Form elements
const transactionForm = document.getElementById('transaction-form');
const dateInput = document.getElementById('date');
const typeSelect = document.getElementById('type');
const fromAccountSelect = document.getElementById('from-account');
const toAccountSelect = document.getElementById('to-account');
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');
const transactionsListTitle = document.getElementById('transactions-list-title');
const transactionsTableBody = document.getElementById('transactions-table-body');

// Overall Balance Display elements (now on Assets/Liabilities tab)
const totalAssetSpan = document.querySelector('.total-asset-display');
const totalLiabilitySpan = document.querySelector('.total-liability-display');
const netAssetSpan = document.querySelector('.net-asset-display');
const accountsTableBody = document.getElementById('accounts-table-body'); // For Assets/Liabilities table

// New Account Management elements
const addAccountForm = document.getElementById('add-account-form');
const newAccountNameInput = document.getElementById('new-account-name');
const newAccountGroupSelect = document.getElementById('new-account-group');
const newAccountInitialBalanceInput = document.getElementById('new-account-initial-balance');

// AI Analysis elements (removed from HTML, no longer needed)
// No need to define these DOM elements as they are removed from HTML.

// Transaction filter elements
const filterButtons = document.querySelectorAll('.filter-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const startDateFilterInput = document.getElementById('start-date-filter');
const endDateFilterInput = document.getElementById('end-date-filter');
const applyDateFilterBtn = document.getElementById('apply-date-filter-btn');
const tagFilterInput = document.getElementById('tag-filter-input');

// Dashboard elements (now text summaries)
const dashboardTotalIncomeSpan = document.getElementById('dashboard-total-income');
const dashboardTotalExpenseSpan = document.getElementById('dashboard-total-expense');
const dashboardNetProfitSpan = document.getElementById('dashboard-net-profit');
const categorySpendingSummaryDiv = document.getElementById('category-spending-summary');
const tagSpendingSummaryDiv = document.getElementById('tag-spending-summary');

// Budget elements
const budgetForm = document.getElementById('budget-form');
const budgetMonthInput = document.getElementById('budget-month');
const expectedIncomeInput = document.getElementById('expected-income');
const fixedExpensesInput = document.getElementById('fixed-expenses');
const disposableIncomeInput = document.getElementById('disposable-income');
const budgetSummaryDiv = document.getElementById('budget-summary');
const currentBudgetMonthSpan = document.getElementById('current-budget-month');
const displayExpectedIncomeSpan = document.getElementById('display-expected-income');
const displayFixedExpensesSpan = document.getElementById('display-fixed-expenses');
const displayDisposableIncomeSpan = document.getElementById('display-disposable-income');

// Cash Flow elements
const cashFlowStartDateInput = document.getElementById('cash-flow-start-date');
const cashFlowEndDateInput = document.getElementById('cash-flow-end-date');
const generateCashFlowBtn = document.getElementById('generate-cash-flow-btn');
const cashFlowPeriodSpan = document.getElementById('cash-flow-period');
const cashInflowSpan = document.getElementById('cash-inflow');
const cashOutflowSpan = document.getElementById('cash-outflow');
const netCashFlowSpan = document.getElementById('net-cash-flow');

// Recurring Transactions elements
const pendingRecurringTransactionsList = document.getElementById('pending-recurring-transactions-list');
const addRecurringTransactionForm = document.getElementById('add-recurring-transaction-form');
const recurringNameInput = document.getElementById('recurring-name');
const recurringTypeSelect = document.getElementById('recurring-type');
const recurringFromAccountSelect = document.getElementById('recurring-from-account');
const recurringToAccountSelect = document.getElementById('recurring-to-account');
const recurringAmountInput = document.getElementById('recurring-amount');
const recurringDescriptionInput = document.getElementById('recurring-description');
const recurringStartDateInput = document.getElementById('recurring-start-date');
const recurringDayOfMonthInput = document.getElementById('recurring-day-of-month');
const registeredRecurringTransactionsTableBody = document.getElementById('registered-recurring-transactions-table-body');

// Reports elements
const reportStartDateInput = document.getElementById('report-start-date');
const reportEndDateInput = document.getElementById('report-end-date');
const generateReportBtn = document.getElementById('generate-report-btn');
const tagReportTbody = document.getElementById('tag-report-tbody');
const monthlyExpenseIncomeChartCanvas = document.getElementById('monthlyExpenseIncomeChart');


// Daily Memo elements
const dailyMemoTextarea = document.getElementById('daily-memo');
const saveMemoBtn = document.getElementById('save-memo-btn');


// --- Global Variables (전역 변수) ---
let transactions = []; // Stores all transaction objects (now from Firestore)
let accountBalances = {}; // Stores current balance for each individual account
let currentCalendarDate = new Date(); // Current date for calendar view (used for dashboard month, not calendar display)
let selectedDate = null; // Stores the date selected from the calendar for filtering (still useful for transaction date filter)
let selectedTypeFilter = 'all'; // Stores the selected transaction type filter ('all', '수입', '지출', '이체')
let selectedTagFilter = ''; // Stores the selected tag filter
let dateRangeStartDate = null; // Stores start date for range filter
let dateRangeEndDate = null; // Stores end date for range filter

let monthlyBudget = {}; // Stores budget data for each month (now from Firestore)
let dailyMemos = {}; // Stores daily memos by date string (YYYY-MM-DD) (now from Firestore)
let recurringTransactions = []; // Stores recurring transaction definitions (from Firestore)

// Chart instances (only for Reports tab now)
let monthlyExpenseIncomeChartInstance = null; // Remains in reports


// Dynamic account data from Firestore
let allAccounts = []; // Flattened list of all accounts (fetched from Firestore)
let currentAccountGroups = []; // Grouped accounts (fetched from Firestore)


// --- Helper Functions (도우미 함수) ---

/**
 * Displays a user-friendly message on the UI.
 * @param {string} message - The message to display.
 * @param {'info'|'success'|'warning'|'error'} type - Type of message for styling.
 * @param {HTMLElement} displayElement - The DOM element to display the message in.
 */
function showUserMessage(message, type = 'info', displayElement = messageDisplay) {
    displayElement.textContent = message;
    displayElement.classList.remove('hidden', 'bg-blue-100', 'text-blue-800', 'bg-green-100', 'text-green-800', 'bg-yellow-100', 'text-yellow-800', 'bg-red-100', 'text-red-800');
    
    switch (type) {
        case 'info':
            displayElement.classList.add('bg-blue-100', 'text-blue-800');
            break;
        case 'success':
            displayElement.classList.add('bg-green-100', 'text-green-800');
            break;
        case 'warning':
            displayElement.classList.add('bg-yellow-100', 'text-yellow-800');
            break;
        case 'error':
            displayElement.classList.add('bg-red-100', 'text-red-800');
            break;
    }
    displayElement.classList.remove('hidden');

    setTimeout(() => {
        displayElement.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
}

/**
 * Destroys a Chart.js instance if it exists.
 * @param {Chart} chartInstance - The Chart.js instance to destroy.
 */
function destroyChart(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
    }
}

/**
 * Formats a number as currency string.
 * @param {number} amount - The number to format.
 * @returns {string} Formatted currency string.
 */
function formatCurrency(amount) {
    return amount.toLocaleString() + '원';
}

/**
 * Shows the authentication section and hides the main app.
 */
function showAuthSection() {
    authSection.classList.remove('hidden');
    mainAppSection.classList.add('hidden');
}

/**
 * Shows the main app section and hides the authentication section.
 */
function showMainApp() {
    authSection.classList.add('hidden');
    mainAppSection.classList.remove('hidden');
}


// --- Firebase Firestore Operations (데이터베이스 연동) ---

/**
 * Gets the Firestore collection reference for user-specific accounts.
 * @returns {firebase.firestore.CollectionReference|null}
 */
function getAccountsCollectionRef() {
    if (!db || !userId) {
        console.warn("Firestore or User ID not available for accounts.");
        return null;
    }
    // 이 부분에서 `appId`는 `firebaseConfig.appId`를 사용합니다.
    // Canvas 환경의 `__app_id`는 GitHub Pages에서는 사용되지 않습니다.
    return collection(db, `artifacts/${appId}/users/${userId}/accounts`);
}

/**
 * Gets the Firestore collection reference for user-specific transactions.
 * @returns {firebase.firestore.CollectionReference|null}
 */
function getTransactionsCollectionRef() {
    if (!db || !userId) {
        console.warn("Firestore or User ID not available for transactions.");
        return null;
    }
    // 이 부분에서 `appId`는 `firebaseConfig.appId`를 사용합니다.
    return collection(db, `artifacts/${appId}/users/${userId}/transactions`);
}

/**
 * Gets the Firestore collection reference for user-specific budgets.
 * @returns {firebase.firestore.CollectionReference|null}
 */
function getBudgetsCollectionRef() {
    if (!db || !userId) {
        console.warn("Firestore or User ID not available for budgets.");
        return null;
    }
    // 이 부분에서 `appId`는 `firebaseConfig.appId`를 사용합니다.
    return collection(db, `artifacts/${appId}/users/${userId}/budgets`);
}

/**
 * Gets the Firestore collection reference for user-specific daily memos.
 * @returns {firebase.firestore.CollectionReference|null}
 */
function getDailyMemosCollectionRef() {
    if (!db || !userId) {
        console.warn("Firestore or User ID not available for daily memos.");
        return null;
    }
    // 이 부분에서 `appId`는 `firebaseConfig.appId`를 사용합니다.
    return collection(db, `artifacts/${appId}/users/${userId}/dailyMemos`);
}

/**
 * Gets the Firestore collection reference for user-specific recurring transactions.
 * @returns {firebase.firestore.CollectionReference|null}
 */
function getRecurringTransactionsCollectionRef() {
    if (!db || !userId) {
        console.warn("Firestore or User ID not available for recurring transactions.");
        return null;
    }
    // 이 부분에서 `appId`는 `firebaseConfig.appId`를 사용합니다.
    return collection(db, `artifacts/${appId}/users/${userId}/recurringTransactions`);
}


/**
 * Sets up real-time listeners for all user data (accounts, transactions, budgets, memos, recurring transactions).
 */
async function setupFirestoreListeners() {
    console.log("Firestore: Setting up all data listeners.");
    if (!db || !userId) {
        console.warn("Firestore or User ID not available. Cannot set up listeners.");
        showUserMessage('데이터베이스를 불러올 수 없습니다. 로그인 상태를 확인해주세요.', 'error');
        return;
    }

    // --- Accounts Listener ---
    const accountsColRef = getAccountsCollectionRef();
    if (accountsColRef) {
        onSnapshot(accountsColRef, async (snapshot) => {
            console.log("Firestore: Accounts snapshot received.");
            const fetchedAccounts = [];
            snapshot.forEach(d => {
                const data = d.data();
                fetchedAccounts.push({
                    id: d.id, // Firestore document ID
                    name: data.name,
                    groupName: data.groupName,
                    groupType: data.groupType,
                    initialBalance: data.initialBalance || 0
                });
            });

            // If no accounts exist for a new user, add initial ones
            if (fetchedAccounts.length === 0) {
                console.log("Firestore: No accounts found for user, adding initial accounts.");
                showUserMessage('새로운 사용자입니다! 기본 계정을 설정 중입니다.', 'info');
                for (const group of initialAccountGroups) {
                    for (const account of group.accounts) {
                        await addAccountToFirestore({
                            name: account.name,
                            groupName: group.groupName,
                            groupType: group.type,
                            initialBalance: account.initialBalance
                        });
                    }
                }
                showUserMessage('기본 계정 설정이 완료되었습니다. 이제 거래를 추가할 수 있습니다!', 'success');
            } else {
                // Reconstruct accountGroups from fetchedAccounts
                const newAccountGroups = {};
                fetchedAccounts.forEach(acc => {
                    if (!newAccountGroups[acc.groupName]) {
                        newAccountGroups[acc.groupName] = {
                            groupName: acc.groupName,
                            type: acc.groupType,
                            accounts: []
                        };
                    }
                    newAccountGroups[acc.groupName].accounts.push(acc);
                });
                currentAccountGroups = Object.values(newAccountGroups);
                allAccounts = fetchedAccounts;

                console.log("Firestore: Accounts updated:", allAccounts);
                populateAccountDropdowns(); // Update dropdowns in transaction and recurring tabs
                populateRecurringAccountDropdowns(); // Update recurring transaction dropdowns
                calculateBalances();
                renderAccountsTable(); // Render accounts in table format
                // Re-render transactions if on that tab to update account names if needed
                if (window.location.hash.replace('#', '') === 'transactions') {
                    renderTransactions();
                }
            }
        }, (error) => {
            console.error("Firestore: Error listening to accounts:", error);
            showUserMessage(`계정 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
        });
    }

    // --- Transactions Listener ---
    const transactionsColRef = getTransactionsCollectionRef();
    if (transactionsColRef) {
        onSnapshot(transactionsColRef, (snapshot) => {
            console.log("Firestore: Transactions snapshot received.");
            transactions = [];
            snapshot.forEach(d => {
                transactions.push({ id: d.id, ...d.data() });
            });
            // Sort transactions by date (descending) and then timestamp (descending)
            transactions.sort((a, b) => {
                const dateComparison = new Date(b.date) - new Date(a.date);
                if (dateComparison === 0) {
                    // If dates are the same, sort by timestamp (most recent first)
                    return (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0);
                }
                return dateComparison;
            });

            console.log("Firestore: Transactions updated:", transactions);
            renderTransactions();
            calculateBalances();
            renderDashboard();
            renderBudgetSummary();
        }, (error) => {
            console.error("Firestore: Error listening to transactions:", error);
            showUserMessage(`거래 내역을 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
        });
    }

    // --- Budgets Listener ---
    const budgetsColRef = getBudgetsCollectionRef();
    if (budgetsColRef) {
        onSnapshot(budgetsColRef, (snapshot) => {
            console.log("Firestore: Budgets snapshot received.");
            monthlyBudget = {};
            snapshot.forEach(d => {
                monthlyBudget[d.id] = d.data(); // Document ID is the month key (YYYY-MM)
            });
            console.log("Firestore: Budgets updated:", monthlyBudget);
            renderBudgetSummary();
        }, (error) => {
            console.error("Firestore: Error listening to budgets:", error);
            showUserMessage(`예산 데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
        });
    }

    // --- Daily Memos Listener ---
    const dailyMemosColRef = getDailyMemosCollectionRef();
    if (dailyMemosColRef) {
        onSnapshot(dailyMemosColRef, (snapshot) => {
            console.log("Firestore: Daily Memos snapshot received.");
            dailyMemos = {};
            snapshot.forEach(d => {
                dailyMemos[d.id] = d.data().content; // Document ID is the date key (YYYY-MM-DD)
            });
            console.log("Firestore: Daily Memos updated:", dailyMemos);
            renderDailyMemo();
        }, (error) => {
            console.error("Firestore: Error listening to daily memos:", error);
            showUserMessage(`일일 메모를 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
        });
    }

    // --- Recurring Transactions Listener ---
    const recurringTransactionsColRef = getRecurringTransactionsCollectionRef();
    if (recurringTransactionsColRef) {
        onSnapshot(recurringTransactionsColRef, (snapshot) => {
            console.log("Firestore: Recurring Transactions snapshot received.");
            recurringTransactions = [];
            snapshot.forEach(d => {
                recurringTransactions.push({ id: d.id, ...d.data() });
            });
            console.log("Firestore: Recurring Transactions updated:", recurringTransactions);
            renderRegisteredRecurringTransactionsTable();
            checkAndRenderPendingRecurringTransactions();
        }, (error) => {
            console.error("Firestore: Error listening to recurring transactions:", error);
            showUserMessage(`고정 거래 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
        });
    }
}

/**
 * Adds a new account to Firestore.
 * @param {object} accountData - The account object to add.
 */
async function addAccountToFirestore(accountData) {
    console.log("Firestore: Adding new account:", accountData);
    const accountsColRef = getAccountsCollectionRef();
    if (!accountsColRef) {
        showUserMessage('데이터베이스를 사용할 수 없습니다. 계정을 추가할 수 없습니다.', 'error');
        return;
    }
    try {
        // Check for duplicate account name within the same group
        const q = query(accountsColRef, where("name", "==", accountData.name), where("groupName", "==", accountData.groupName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            showUserMessage('동일한 이름의 계정이 같은 그룹에 이미 존재합니다.', 'warning');
            return;
        }

        await addDoc(accountsColRef, accountData);
        showUserMessage('계정이 성공적으로 추가되었습니다!', 'success');
        console.log("Firestore: Account added successfully.");
    } catch (error) {
        console.error("Firestore: Error adding account:", error);
        showUserMessage(`계정 추가 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Deletes an account from Firestore.
 * @param {string} accountId - The ID of the account document to delete.
 */
async function deleteAccountFromFirestore(accountId) {
    console.log("Firestore: Deleting account with ID:", accountId);
    const accountsColRef = getAccountsCollectionRef();
    if (!accountsColRef) {
        showUserMessage('데이터베이스를 사용할 수 없습니다. 계정을 삭제할 수 없습니다.', 'error');
        return;
    }
    try {
        // Optional: Check if any transactions are linked to this account before deleting
        // This would require querying the transactions collection, which can be slow for many transactions.
        // For simplicity, we'll allow deletion, but warn the user.
        if (!confirm('정말로 이 계정을 삭제하시겠습니까? 이 계정과 관련된 모든 거래 내역도 영향을 받을 수 있습니다.')) {
            return;
        }

        await deleteDoc(doc(accountsColRef, accountId));
        showUserMessage('계정이 성공적으로 삭제되었습니다!', 'success');
        console.log("Firestore: Account deleted successfully.");
    } catch (error) {
        console.error("Firestore: Error deleting account:", error);
        showUserMessage(`계정 삭제 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Adds a new transaction to Firestore.
 * @param {object} transactionData - The transaction object to add.
 */
async function addTransactionToFirestore(transactionData) {
    console.log("Firestore: Adding new transaction:", transactionData);
    const transactionsColRef = getTransactionsCollectionRef();
    if (!transactionsColRef) {
        showUserMessage('데이터베이스를 사용할 수 없습니다. 거래를 추가할 수 없습니다.', 'error');
        return;
    }
    try {
        await addDoc(transactionsColRef, transactionData);
        showUserMessage('거래가 성공적으로 추가되었습니다!', 'success');
        console.log("Firestore: Transaction added successfully.");
    } catch (error) {
        console.error("Firestore: Error adding transaction:", error);
        showUserMessage(`거래 추가 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Deletes a transaction from Firestore.
 * @param {string} transactionId - The ID of the transaction document to delete.
 */
async function deleteTransactionFromFirestore(transactionId) {
    console.log("Firestore: Deleting transaction with ID:", transactionId);
    const transactionsColRef = getTransactionsColRef();
    if (!transactionsColRef) {
        showUserMessage('데이터베이스를 사용할 수 없습니다. 거래를 삭제할 수 없습니다.', 'error');
        return;
    }
    try {
        if (!confirm('정말로 이 거래를 삭제하시겠습니까?')) {
            return;
        }
        await deleteDoc(doc(transactionsColRef, transactionId));
        showUserMessage('거래가 삭제되었습니다.', 'info');
        console.log("Firestore: Transaction deleted successfully.");
    } catch (error) {
        console.error("Firestore: Error deleting transaction:", error);
        showUserMessage(`거래 삭제 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Saves budget data to Firestore.
 * @param {string} monthKey - YYYY-MM string.
 * @param {object} budgetData - Budget object for the month.
 */
async function saveBudgetToFirestore(monthKey, budgetData) {
    console.log("Firestore: Saving budget for month:", monthKey, budgetData);
    const budgetsColRef = getBudgetsCollectionRef();
    if (!budgetsColRef) {
        showUserMessage('데이터베이스를 사용할 수 없습니다. 예산을 저장할 수 없습니다.', 'error');
        return;
    }
    try {
        await setDoc(doc(budgetsColRef, monthKey), budgetData);
        showUserMessage('예산이 성공적으로 저장되었습니다!', 'success');
        console.log("Firestore: Budget saved successfully.");
    } catch (error) {
        console.error("Firestore: Error saving budget:", error);
        showUserMessage(`예산 저장 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Saves a daily memo to Firestore.
 * @param {string} dateKey - YYYY-MM-DD string.
 * @param {string} memoContent - The content of the memo.
 */
async function saveDailyMemoToFirestore(dateKey, memoContent) {
    console.log("Firestore: Saving daily memo for date:", dateKey);
    const dailyMemosColRef = getDailyMemosCollectionRef();
    if (!dailyMemosColRef) {
        showUserMessage('데이터베이스를 사용할 수 없습니다. 메모를 저장할 수 없습니다.', 'error');
        return;
    }
    try {
        await setDoc(doc(dailyMemosColRef, dateKey), { content: memoContent });
        showUserMessage('오늘의 메모가 저장되었습니다!', 'success');
        console.log("Firestore: Daily memo saved successfully.");
    } catch (error) {
        console.error("Firestore: Error saving daily memo:", error);
        showUserMessage(`메모 저장 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Adds a new recurring transaction to Firestore.
 * @param {object} recurringData - The recurring transaction object to add.
 */
async function addRecurringTransactionToFirestore(recurringData) {
    console.log("Firestore: Adding new recurring transaction:", recurringData);
    const recurringColRef = getRecurringTransactionsCollectionRef();
    if (!recurringColRef) {
        showUserMessage('데이터베이스를 사용할 수 없습니다. 고정 거래를 추가할 수 없습니다.', 'error');
        return;
    }
    try {
        await addDoc(recurringColRef, recurringData);
        showUserMessage('고정 거래가 성공적으로 추가되었습니다!', 'success');
        console.log("Firestore: Recurring transaction added successfully.");
    } catch (error) {
        console.error("Firestore: Error adding recurring transaction:", error);
        showUserMessage(`고정 거래 추가 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Deletes a recurring transaction from Firestore.
 * @param {string} recurringId - The ID of the recurring transaction document to delete.
 */
async function deleteRecurringTransactionFromFirestore(recurringId) {
    console.log("Firestore: Deleting recurring transaction with ID:", recurringId);
    const recurringColRef = getRecurringTransactionsCollectionRef();
    if (!recurringColRef) {
        showUserMessage('데이터베이스를 사용할 수 없습니다. 고정 거래를 삭제할 수 없습니다.', 'error');
        return;
    }
    try {
        if (!confirm('정말로 이 고정 거래를 삭제하시겠습니까?')) {
            return;
        }
        await deleteDoc(doc(recurringColRef, recurringId));
        showUserMessage('고정 거래가 삭제되었습니다.', 'info');
        console.log("Firestore: Recurring transaction deleted successfully.");
    } catch (error) {
        console.error("Firestore: Error deleting recurring transaction:", error);
        showUserMessage(`고정 거래 삭제 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Updates the lastAppliedMonth for a recurring transaction in Firestore.
 * @param {string} recurringId - The ID of the recurring transaction.
 * @param {string} monthKey - The month (YYYY-MM) it was applied for.
 */
async function updateRecurringTransactionLastAppliedMonth(recurringId, monthKey) {
    console.log(`Firestore: Updating last applied month for ${recurringId} to ${monthKey}`);
    const recurringColRef = getRecurringTransactionsCollectionRef();
    if (!recurringColRef) {
        console.error('데이터베이스를 사용할 수 없습니다. 고정 거래 적용 상태를 업데이트할 수 없습니다.');
        return;
    }
    try {
        await setDoc(doc(recurringColRef, recurringId), { lastAppliedMonth: monthKey }, { merge: true });
        console.log("Firestore: Recurring transaction lastAppliedMonth updated.");
    } catch (error) {
        console.error("Firestore: Error updating recurring transaction lastAppliedMonth:", error);
    }
}


// --- Main Functions (주요 기능 함수) ---

/**
 * Initializes the application: sets up Firestore listeners and initial UI.
 * This is called AFTER Firebase authentication state is determined.
 */
function initApp() {
    console.log("initApp: 앱 초기화 시작 (Firebase 인증 후)");
    try {
        // Setup Firestore listeners for all data types
        setupFirestoreListeners();

        // Set up client-side routing
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Call once on initial load
        console.log("initApp: 앱 초기화 완료.");
    } catch (error) {
        console.error("initApp: 초기화 중 오류 발생", error);
        showUserMessage(`앱 초기화 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Handles tab switching and content rendering based on URL hash.
 */
function handleHashChange() {
    console.log("handleHashChange: URL 해시 변경 감지");
    try {
        const hash = window.location.hash.replace('#', '');
        let activeTabId = hash || 'dashboard';

        const validTabIds = ['dashboard', 'transactions', 'assets-liabilities', 'budget', 'cash-flow', 'recurring-transactions', 'reports'];
        if (!validTabIds.includes(activeTabId)) {
            activeTabId = 'dashboard';
            window.location.hash = '#dashboard';
            console.warn(`handleHashChange: Invalid hash '${hash}' detected. Redirecting to 'dashboard'.`);
        }

        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`tab-content-${activeTabId}`).classList.remove('hidden');

        tabButtons.forEach(button => {
            if (button.dataset.tab === activeTabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Destroy all chart instances before potentially re-rendering in Reports tab
        destroyChart(monthlyExpenseIncomeChartInstance);


        // Re-render specific components when their tab is shown
        calculateBalances(); // Always recalculate balances as they are global
        renderAccountsTable(); // Always render accounts table as it's global (for asset/liabilities tab)

        switch (activeTabId) {
            case 'dashboard':
                console.log("handleHashChange: Dashboard tab activated.");
                renderDashboard();
                renderDailyMemo();
                break;
            case 'transactions':
                console.log("handleHashChange: Transactions tab activated.");
                populateAccountDropdowns(); // Re-populate dropdowns in case accounts changed
                updateFilterButtonStyles(); // Ensure filter buttons are styled correctly
                renderTransactions(); // Render transactions for the current month/filters
                break;
            case 'assets-liabilities':
                console.log("handleHashChange: Assets/Liabilities tab activated.");
                // renderAccountsTable() is called globally
                break;
            case 'budget':
                console.log("handleHashChange: Budget tab activated.");
                renderBudgetSummary();
                break;
            case 'cash-flow':
                console.log("handleHashChange: Cash Flow tab activated.");
                // No specific initial render needed, user clicks button to generate
                break;
            case 'recurring-transactions':
                console.log("handleHashChange: Recurring Transactions tab activated.");
                populateRecurringAccountDropdowns();
                renderRegisteredRecurringTransactionsTable();
                checkAndRenderPendingRecurringTransactions();
                break;
            case 'reports':
                console.log("handleHashChange: Reports tab activated.");
                // Initial state for reports, user needs to generate
                tagReportTbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500">보고서 기간을 선택하고 \'보고서 생성\' 버튼을 눌러주세요.</td></tr>';
                break;
        }
        console.log(`handleHashChange: Tab '${activeTabId}' activated.`);
    } catch (error) {
        console.error("handleHashChange: 탭 전환 중 오류 발생", error);
        showUserMessage(`탭 전환 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}


/**
 * Populates the 'from-account' and 'to-account' dropdowns in the transaction form.
 */
function populateAccountDropdowns() {
    console.log("populateAccountDropdowns: 거래 폼 계정 드롭다운 채우기 시작");
    try {
        fromAccountSelect.innerHTML = '<option value="">선택하세요</option>';
        toAccountSelect.innerHTML = '<option value="">선택하세요</option>';

        const transactionAccounts = allAccounts.filter(acc =>
            acc.groupType === "자산" || acc.groupType === "부채" || acc.groupType === "수익" || acc.groupType === "비용"
        );

        transactionAccounts.forEach(account => {
            const option1 = document.createElement('option');
            option1.value = account.name;
            option1.textContent = `${account.name} (${account.groupType})`;
            fromAccountSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = account.name;
            option2.textContent = `${account.name} (${account.groupType})`;
            toAccountSelect.appendChild(option2);
        });
        console.log("populateAccountDropdowns: 거래 폼 계정 드롭다운 채우기 완료.");
    } catch (error) {
        console.error("populateAccountDropdowns: 드롭다운 채우기 중 오류 발생", error);
        showUserMessage(`계정 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Populates the 'from-account' and 'to-account' dropdowns in the recurring transaction form.
 */
function populateRecurringAccountDropdowns() {
    console.log("populateRecurringAccountDropdowns: 고정 거래 폼 계정 드롭다운 채우기 시작");
    try {
        recurringFromAccountSelect.innerHTML = '<option value="">선택하세요</option>';
        recurringToAccountSelect.innerHTML = '<option value="">선택하세요</option>';

        const transactionAccounts = allAccounts.filter(acc =>
            acc.groupType === "자산" || acc.groupType === "부채" || acc.groupType === "수익" || acc.groupType === "비용"
        );

        transactionAccounts.forEach(account => {
            const option1 = document.createElement('option');
            option1.value = account.name;
            option1.textContent = `${account.name} (${account.groupType})`;
            recurringFromAccountSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = account.name;
            option2.textContent = `${account.name} (${account.groupType})`;
            recurringToAccountSelect.appendChild(option2);
        });
        console.log("populateRecurringAccountDropdowns: 고정 거래 폼 계정 드롭다운 채우기 완료.");
    } catch (error) {
        console.error("populateRecurringAccountDropdowns: 고정 거래 드롭다운 채우기 중 오류 발생", error);
        showUserMessage(`계정 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}


/**
 * Handles the form submission to add a new transaction.
 * Now saves to Firestore.
 * @param {Event} event - The form submission event.
 */
async function addTransaction(event) {
    event.preventDefault();
    console.log("addTransaction: 새 거래 추가 시도");

    try {
        const date = dateInput.value;
        const type = typeSelect.value;
        const fromAccount = fromAccountSelect.value;
        const toAccount = toAccountSelect.value;
        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value;

        if (!date || !type || !fromAccount || !toAccount || isNaN(amount) || amount <= 0 || !description) {
            showUserMessage('모든 필드를 올바르게 입력해주세요. 금액은 0보다 커야 합니다.', 'warning');
            return;
        }

        const tags = (description.match(/#\w+/g) || []).map(tag => tag.substring(1));

        const newTransaction = {
            date,
            type,
            fromAccount,
            toAccount,
            amount,
            description,
            tags,
            timestamp: new Date() // Add a timestamp for ordering
        };

        await addTransactionToFirestore(newTransaction); // Save to Firestore

        transactionForm.reset();
        dateInput.value = '';
    } catch (error) {
        console.error("addTransaction: 거래 추가 중 오류 발생", error);
        showUserMessage(`거래 추가 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Renders transactions in a table format based on current filters.
 */
function renderTransactions() {
    console.log("renderTransactions: 거래 내역 렌더링 시작");
    try {
        transactionsTableBody.innerHTML = ''; // Clear existing table rows

        let filteredTransactions = [...transactions];

        // Apply date range filter first if set
        if (dateRangeStartDate && dateRangeEndDate) {
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= dateRangeStartDate && transactionDate <= dateRangeEndDate;
            });
            transactionsListTitle.textContent = `${startDateFilterInput.value} ~ ${endDateFilterInput.value} 거래 내역`;
        } else {
            // If no date range, filter by current calendar month (default view)
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
            });
            transactionsListTitle.textContent = `${year}년 ${month + 1}월 거래 내역`;
        }

        // Apply selected date filter (overrides month/range if present)
        if (selectedDate) {
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.toDateString() === selectedDate.toDateString();
            });
            transactionsListTitle.textContent = `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 거래 내역`;
        }

        // Apply transaction type filter
        if (selectedTypeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === selectedTypeFilter);
            transactionsListTitle.textContent += ` (${selectedTypeFilter}만)`;
        }

        // Apply tag filter
        if (selectedTagFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.tags && t.tags.includes(selectedTagFilter));
            transactionsListTitle.textContent += ` (#${selectedTagFilter})`;
        }

        if (filteredTransactions.length === 0) {
            transactionsTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-gray-500 py-4">아직 거래 내역이 없습니다.</td></tr>';
            return;
        }

        // Sort transactions by date in descending order (latest first) and then by timestamp
        filteredTransactions.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() === dateB.getTime()) {
                // If dates are the same, sort by timestamp (most recent first)
                return (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0);
            }
            return dateB - dateA; // Sort by date descending
        });

        filteredTransactions.forEach(transaction => {
            const row = transactionsTableBody.insertRow();
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.type}</td>
                <td>${transaction.fromAccount}</td>
                <td>${transaction.toAccount}</td>
                <td class="text-right ${transaction.type === '수입' ? 'text-green-600' : (transaction.type === '지출' ? 'text-red-600' : 'text-gray-700')}">${formatCurrency(transaction.amount)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.tags && transaction.tags.length > 0 ? transaction.tags.map(tag => `#${tag}`).join(' ') : ''}</td>
                <td><button data-id="${transaction.id}" class="delete-btn text-red-500 hover:text-red-700 text-sm">삭제</button></td>
            `;
        });

        document.querySelectorAll('#transactions-table-body .delete-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const transactionId = event.target.dataset.id;
                await deleteTransactionFromFirestore(transactionId);
            });
        });
        console.log("renderTransactions: 거래 내역 렌더링 완료.");
    } catch (error) {
        console.error("renderTransactions: 거래 내역 렌더링 중 오류 발생", error);
        showUserMessage(`거래 내역을 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}


/**
 * Calculates and updates the current balances for all individual accounts.
 */
function calculateBalances() {
    console.log("calculateBalances: 잔액 계산 시작");
    try {
        accountBalances = {};
        allAccounts.forEach(account => {
            accountBalances[account.name] = account.initialBalance;
        });

        transactions.forEach(transaction => {
            const fromAccountObj = allAccounts.find(acc => acc.name === transaction.fromAccount);
            const toAccountObj = allAccounts.find(acc => acc.name === transaction.toAccount);

            if (fromAccountObj && accountBalances[transaction.fromAccount] !== undefined) {
                accountBalances[transaction.fromAccount] -= transaction.amount;
            } else {
                console.warn(`calculateBalances: 'fromAccount' ${transaction.fromAccount} not found or invalid. Transaction ID: ${transaction.id}`);
            }

            if (toAccountObj && accountBalances[transaction.toAccount] !== undefined) {
                accountBalances[transaction.toAccount] += transaction.amount;
            } else {
                console.warn(`calculateBalances: 'toAccount' ${transaction.toAccount} not found or invalid. Transaction ID: ${transaction.id}`);
            }
        });

        let totalAssets = 0;
        let totalLiabilities = 0;

        allAccounts.forEach(account => {
            const currentBalance = accountBalances[account.name] || 0;

            if (account.groupType === "자산") {
                totalAssets += currentBalance;
            } else if (account.groupType === "부채") {
                totalLiabilities += currentBalance;
            }
        });

        const netAssets = totalAssets + totalLiabilities;

        // Update UI for overall balances (now on Assets/Liabilities tab)
        totalAssetSpan.textContent = formatCurrency(totalAssets);
        totalLiabilitySpan.textContent = formatCurrency(Math.abs(totalLiabilities));
        netAssetSpan.textContent = formatCurrency(netAssets);
        console.log("calculateBalances: 잔액 계산 완료.");
    } catch (error) {
        console.error("calculateBalances: 잔액 계산 중 오류 발생", error);
        showUserMessage(`잔액 계산 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Renders account balances in a table format.
 */
function renderAccountsTable() {
    console.log("renderAccountsTable: 계정 목록 테이블 렌더링 시작");
    try {
        accountsTableBody.innerHTML = ''; // Clear existing content

        if (allAccounts.length === 0) {
            accountsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 py-4">계정 정보를 불러오는 중이거나, 계정이 없습니다. "새로운 계정 추가" 섹션에서 계정을 추가해주세요.</td></tr>';
            return;
        }

        // Sort accounts by group name and then account name
        const sortedAccounts = [...allAccounts].sort((a, b) => {
            const groupCompare = a.groupName.localeCompare(b.groupName);
            if (groupCompare === 0) {
                return a.name.localeCompare(b.name);
            }
            return groupCompare;
        });

        sortedAccounts.forEach(account => {
            const row = accountsTableBody.insertRow();
            const balance = accountBalances[account.name] !== undefined ? accountBalances[account.name] : account.initialBalance;
            row.innerHTML = `
                <td>${account.name}</td>
                <td>${account.groupName}</td>
                <td>${account.groupType}</td>
                <td class="text-right">${formatCurrency(account.initialBalance)}</td>
                <td class="text-right ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}">${formatCurrency(balance)}</td>
                <td><button data-id="${account.id}" class="delete-account-btn text-red-500 hover:text-red-700 text-sm">삭제</button></td>
            `;
        });

        document.querySelectorAll('#accounts-table-body .delete-account-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const accountIdToDelete = event.target.dataset.id;
                await deleteAccountFromFirestore(accountIdToDelete);
            });
        });

        console.log("renderAccountsTable: 계정 목록 테이블 렌더링 완료.");
    } catch (error) {
        console.error("renderAccountsTable: 계정 목록 테이블 렌더링 중 오류 발생", error);
        showUserMessage(`계정 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}


/**
 * Updates the styling of filter buttons based on selectedTypeFilter.
 */
function updateFilterButtonStyles() {
    console.log("updateFilterButtonStyles: 필터 버튼 스타일 업데이트");
    try {
        filterButtons.forEach(button => {
            if (button.dataset.filterType === selectedTypeFilter) {
                button.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
                button.classList.add('bg-blue-600', 'text-white');
            } else {
                button.classList.remove('bg-blue-600', 'text-white');
                button.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
            }
        });
    } catch (error) {
        console.error("updateFilterButtonStyles: 필터 버튼 스타일 업데이트 중 오류 발생", error);
    }
}

/**
 * Clears all transaction filters (date, type, tag, date range).
 */
function clearAllFilters() {
    console.log("clearAllFilters: 모든 필터 초기화");
    try {
        selectedDate = null;
        selectedTypeFilter = 'all';
        selectedTagFilter = '';
        dateRangeStartDate = null;
        dateRangeEndDate = null;
        startDateFilterInput.value = '';
        endDateFilterInput.value = '';
        tagFilterInput.value = '';
        updateFilterButtonStyles();
        renderTransactions();
        showUserMessage('모든 필터가 초기화되었습니다.', 'info');
    } catch (error) {
        console.error("clearAllFilters: 필터 초기화 중 오류 발생", error);
        showUserMessage(`필터 초기화 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}


/**
 * Renders the dashboard summary (now text-based).
 */
function renderDashboard() {
    console.log("renderDashboard: 대시보드 렌더링 시작");
    try {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth(); // 0-indexed

        const transactionsInMonth = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
        });

        let totalIncome = 0;
        let totalExpense = 0;
        const categorySpending = {}; // For expense categories
        const tagSpending = {}; // For tags

        transactionsInMonth.forEach(t => {
            if (t.type === '수입') {
                totalIncome += t.amount;
            } else if (t.type === '지출') {
                totalExpense += t.amount;
                // Aggregate spending by expense category (toAccount for expenses)
                const toAccount = allAccounts.find(acc => acc.name === t.toAccount);
                if (toAccount && toAccount.groupType === '비용') {
                    categorySpending[t.toAccount] = (categorySpending[t.toAccount] || 0) + t.amount;
                }
                // Aggregate spending by tags
                if (t.tags && t.tags.length > 0) {
                    t.tags.forEach(tag => {
                        tagSpending[tag] = (tagSpending[tag] || 0) + t.amount;
                    });
                }
            }
        });

        const netProfit = totalIncome - totalExpense;

        dashboardTotalIncomeSpan.textContent = formatCurrency(totalIncome);
        dashboardTotalExpenseSpan.textContent = formatCurrency(totalExpense);
        dashboardNetProfitSpan.textContent = formatCurrency(netProfit);

        // Render Category Spending Summary (text)
        let categorySummaryHtml = '';
        const sortedCategories = Object.keys(categorySpending).sort((a, b) => categorySpending[b] - categorySpending[a]); // Sort descending by amount
        if (sortedCategories.length > 0) {
            categorySummaryHtml = sortedCategories.map(cat =>
                `<p class="flex justify-between items-center"><span>${cat}:</span> <span class="font-semibold text-red-600">${formatCurrency(categorySpending[cat])}</span></p>`
            ).join('');
        } else {
            categorySummaryHtml = '<p class="text-gray-500">지출 카테고리 데이터 없음</p>';
        }
        categorySpendingSummaryDiv.innerHTML = categorySummaryHtml;

        // Render Tag Spending Summary (text)
        let tagSummaryHtml = '';
        const sortedTags = Object.keys(tagSpending).sort((a, b) => tagSpending[b] - tagSpending[a]); // Sort descending by amount
        if (sortedTags.length > 0) {
            tagSummaryHtml = sortedTags.map(tag =>
                `<p class="flex justify-between items-center"><span>#${tag}:</span> <span class="font-semibold text-red-600">${formatCurrency(tagSpending[tag])}</span></p>`
            ).join('');
        } else {
            tagSummaryHtml = '<p class="text-gray-500">태그 지출 데이터 없음</p>';
        }
        tagSpendingSummaryDiv.innerHTML = tagSummaryHtml;

        console.log("renderDashboard: 대시보드 렌더링 완료.");
    } catch (error) {
        console.error("renderDashboard: 대시보드 렌더링 중 오류 발생", error);
        showUserMessage(`대시보드를 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}


/**
 * Handles budget form submission and calculates disposable income.
 * Now saves to Firestore.
 * @param {Event} event - The form submission event.
 */
async function handleBudgetSubmit(event) {
    event.preventDefault();
    console.log("handleBudgetSubmit: 예산 제출 시도");
    try {
        const budgetMonth = budgetMonthInput.value;
        const expectedIncome = parseFloat(expectedIncomeInput.value) || 0;
        const fixedExpenses = parseFloat(fixedExpensesInput.value) || 0;

        if (!budgetMonth) {
            showUserMessage('예산 월을 선택해주세요.', 'warning');
            return;
        }

        const budgetData = {
            expectedIncome,
            fixedExpenses,
            disposableIncome: expectedIncome - fixedExpenses
        };

        await saveBudgetToFirestore(budgetMonth, budgetData); // Save to Firestore
        renderBudgetSummary();
    } catch (error) {
        console.error("handleBudgetSubmit: 예산 저장 중 오류 발생", error);
        showUserMessage(`예산 저장 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Renders the budget summary for the currently selected calendar month.
 * Data is now from Firestore.
 */
function renderBudgetSummary() {
    console.log("renderBudgetSummary: 예산 요약 렌더링 시작");
    try {
        const currentMonthKey = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}`;
        const budget = monthlyBudget[currentMonthKey] || { expectedIncome: 0, fixedExpenses: 0, disposableIncome: 0 };

        currentBudgetMonthSpan.textContent = `${currentCalendarDate.getFullYear()}년 ${currentCalendarDate.getMonth() + 1}월`;
        displayExpectedIncomeSpan.textContent = formatCurrency(budget.expectedIncome);
        displayFixedExpensesSpan.textContent = formatCurrency(budget.fixedExpenses);
        displayDisposableIncomeSpan.textContent = formatCurrency(budget.disposableIncome);

        budgetMonthInput.value = currentMonthKey;
        expectedIncomeInput.value = budget.expectedIncome;
        fixedExpensesInput.value = budget.fixedExpenses;
        disposableIncomeInput.value = formatCurrency(budget.disposableIncome);
        console.log("renderBudgetSummary: 예산 요약 렌더링 완료.");
    } catch (error) {
        console.error("renderBudgetSummary: 예산 요약 렌더링 중 오류 발생", error);
        showUserMessage(`예산 요약을 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}


/**
 * Generates and displays a simplified cash flow statement for a given period.
 */
function generateCashFlowStatement() {
    console.log("generateCashFlowStatement: 현금 흐름표 생성 시작");
    try {
        const startDate = cashFlowStartDateInput.value ? new Date(cashFlowStartDateInput.value) : null;
        const endDate = cashFlowEndDateInput.value ? new Date(cashFlowEndDateInput.value) : null;

        if (!startDate || !endDate || startDate > endDate) {
            showUserMessage('유효한 시작 및 종료 날짜를 선택해주세요.', 'warning');
            cashFlowPeriodSpan.textContent = '기간 선택 필요';
            cashInflowSpan.textContent = '0원';
            cashOutflowSpan.textContent = '0원';
            netCashFlowSpan.textContent = '0원';
            return;
        }

        let totalCashIn = 0;
        let totalCashOut = 0;

        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        filteredTransactions.forEach(t => {
            const toAccountType = allAccounts.find(acc => acc.name === t.toAccount)?.groupType;
            const fromAccountType = allAccounts.find(acc => acc.name === t.fromAccount)?.groupType;

            if (t.type === '수입' && toAccountType === '자산') {
                totalCashIn += t.amount;
            } else if (t.type === '이체' && toAccountType === '자산' && fromAccountType === '자산') {
                totalCashIn += t.amount;
            }

            if (t.type === '지출' && fromAccountType === '자산') {
                totalCashOut += t.amount;
            } else if (t.type === '이체' && fromAccountType === '자산' && toAccountType === '자산') {
                totalCashOut += t.amount;
            }
        });

        const netCashFlow = totalCashIn - totalCashOut;

        cashFlowPeriodSpan.textContent = `${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()}`;
        cashInflowSpan.textContent = formatCurrency(totalCashIn);
        cashOutflowSpan.textContent = formatCurrency(totalCashOut);
        netCashFlowSpan.textContent = formatCurrency(netCashFlow);
        netCashFlowSpan.className = `font-extrabold ${netCashFlow >= 0 ? 'text-blue-700' : 'text-red-700'}`;
        showUserMessage('현금 흐름표가 생성되었습니다.', 'info');
        console.log("generateCashFlowStatement: 현금 흐름표 생성 완료.");
    } catch (error) {
        console.error("generateCashFlowStatement: 현금 흐름표 생성 중 오류 발생", error);
        showUserMessage(`현금 흐름표 생성 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Renders various reports based on the selected date range.
 */
function generateReports() {
    console.log("generateReports: 보고서 생성 시작");
    try {
        const startDate = reportStartDateInput.value ? new Date(reportStartDateInput.value) : null;
        const endDate = reportEndDateInput.value ? new Date(reportEndDateInput.value) : null;

        if (!startDate || !endDate || startDate > endDate) {
            showUserMessage('보고서 기간을 올바르게 선택해주세요.', 'warning');
            tagReportTbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500">보고서 기간을 올바르게 선택해주세요.</td></tr>';
            destroyChart(monthlyExpenseIncomeChartInstance);
            return;
        }

        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        // 1. Tag-based Report
        const tagSummary = {};
        filteredTransactions.forEach(t => {
            if (t.tags && t.tags.length > 0) {
                t.tags.forEach(tag => {
                    if (!tagSummary[tag]) {
                        tagSummary[tag] = { 지출: 0, 수입: 0, 이체: 0 };
                    }
                    if (tagSummary[tag][t.type] !== undefined) {
                        tagSummary[tag][t.type] += t.amount;
                    }
                });
            }
        });

        tagReportTbody.innerHTML = '';
        const sortedTags = Object.keys(tagSummary).sort();
        if (sortedTags.length > 0) {
            sortedTags.forEach(tag => {
                const data = tagSummary[tag];
                const row = tagReportTbody.insertRow();
                row.innerHTML = `
                    <td>#${tag}</td>
                    <td class="text-right text-red-600">${formatCurrency(data['지출'])}</td>
                    <td class="text-right text-green-600">${formatCurrency(data['수입'])}</td>
                    <td class="text-right text-gray-700">${formatCurrency(data['이체'])}</td>
                `;
            });
        } else {
            tagReportTbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500">선택된 기간에 태그된 거래 내역이 없습니다.</td></tr>';
        }

        // 2. Monthly Expense/Income/Net Profit Chart for the report period
        const monthlyData = {};
        filteredTransactions.forEach(t => {
            const monthKey = t.date.substring(0, 7);
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expense: 0, net: 0 };
            }
            if (t.type === '수입') {
                monthlyData[monthKey].income += t.amount;
            } else if (t.type === '지출') {
                monthlyData[monthKey].expense += t.amount;
            }
        });

        const sortedMonthlyKeys = Object.keys(monthlyData).sort();
        const monthlyLabels = [];
        const monthlyIncomes = [];
        const monthlyExpenses = [];
        const monthlyNets = [];

        sortedMonthlyKeys.forEach(key => {
            monthlyData[key].net = monthlyData[key].income - monthlyData[key].expense;
            monthlyLabels.push(key);
            monthlyIncomes.push(monthlyData[key].income);
            monthlyExpenses.push(monthlyData[key].expense);
            monthlyNets.push(monthlyData[key].net);
        });

        renderMonthlyExpenseIncomeReportChart(monthlyLabels, monthlyIncomes, monthlyExpenses, monthlyNets);

        // 3. Period Comparison Report (Placeholder)
        // This would involve comparing two selected periods, which is a more complex feature.
        // For now, it remains a placeholder.

        showUserMessage('보고서가 성공적으로 생성되었습니다.', 'success');
        console.log("generateReports: 보고서 생성 완료.");
    } catch (error) {
        console.error("generateReports: 보고서 생성 중 오류 발생", error);
        showUserMessage(`보고서 생성 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Renders the Monthly Expense/Income/Net Profit Chart for the Reports tab.
 */
function renderMonthlyExpenseIncomeReportChart(labels, incomes, expenses, nets) {
    destroyChart(monthlyExpenseIncomeChartInstance);

    const ctx = document.getElementById('monthlyExpenseIncomeChart').getContext('2d');
    monthlyExpenseIncomeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '수입',
                    data: incomes,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: '지출',
                    data: expenses,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: '순이익',
                    data: nets,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: false,
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}


/**
 * Renders the daily memo for the current date.
 * Data is now from Firestore.
 */
function renderDailyMemo() {
    const todayKey = new Date().toISOString().split('T')[0];
    dailyMemoTextarea.value = dailyMemos[todayKey] || '';
}

/**
 * Renders the list of all registered recurring transactions in a table.
 */
function renderRegisteredRecurringTransactionsTable() {
    console.log("renderRegisteredRecurringTransactionsTable: 등록된 고정 거래 렌더링 시작");
    registeredRecurringTransactionsTableBody.innerHTML = '';

    if (recurringTransactions.length === 0) {
        registeredRecurringTransactionsTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-gray-500 py-4">등록된 고정 거래가 없습니다.</td></tr>';
        return;
    }

    recurringTransactions.forEach(rec => {
        const row = registeredRecurringTransactionsTableBody.insertRow();
        row.innerHTML = `
            <td>${rec.name}</td>
            <td>${rec.type}</td>
            <td>${rec.fromAccount}</td>
            <td>${rec.toAccount}</td>
            <td class="text-right">${formatCurrency(rec.amount)}</td>
            <td>${rec.description}</td>
            <td>${rec.startDate}</td>
            <td>매월 ${rec.dayOfMonth}일</td>
            <td><button data-id="${rec.id}" class="delete-recurring-btn text-red-500 hover:text-red-700 text-sm">삭제</button></td>
        `;
    });

    document.querySelectorAll('#registered-recurring-transactions-table-body .delete-recurring-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const recurringId = event.target.dataset.id;
            await deleteRecurringTransactionFromFirestore(recurringId);
        });
    });
    console.log("renderRegisteredRecurringTransactionsTable: 등록된 고정 거래 렌더링 완료.");
}

/**
 * Checks for and renders recurring transactions that are due for the current month
 * and haven't been applied yet. Provides a "동의" button to apply them.
 */
function checkAndRenderPendingRecurringTransactions() {
    console.log("checkAndRenderPendingRecurringTransactions: 이번 달 적용 가능한 고정 거래 확인 시작");
    pendingRecurringTransactionsList.innerHTML = '';

    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentDay = today.getDate();

    let hasPending = false;

    recurringTransactions.forEach(rec => {
        const recStartDate = new Date(rec.startDate);
        const recStartMonthKey = `${recStartDate.getFullYear()}-${String(recStartDate.getMonth() + 1).padStart(2, '0')}`;

        // Check if the recurring transaction's start date is in or before the current month
        // And if it hasn't been applied for the current month yet
        // And if the current day is on or after the specified dayOfMonth
        if (recStartMonthKey <= currentMonthKey && rec.lastAppliedMonth !== currentMonthKey && currentDay >= rec.dayOfMonth) {
            hasPending = true;
            const pendingDiv = document.createElement('div');
            pendingDiv.className = 'bg-white p-3 rounded-lg shadow-sm flex justify-between items-center';
            pendingDiv.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-800">${rec.name} (${rec.type})</p>
                    <p class="text-sm text-gray-600">${rec.fromAccount} → ${rec.toAccount}</p>
                    <p class="text-sm text-gray-500">${rec.description}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-lg ${rec.type === '수입' ? 'text-green-600' : (rec.type === '지출' ? 'text-red-600' : 'text-gray-700')}">${formatCurrency(rec.amount)}</p>
                    <button data-id="${rec.id}" class="apply-recurring-btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm mt-1">동의</button>
                </div>
            `;
            pendingRecurringTransactionsList.appendChild(pendingDiv);
        }
    });

    if (!hasPending) {
        pendingRecurringTransactionsList.innerHTML = '<p class="text-gray-500 text-center py-2">이번 달에 적용할 고정 거래가 없습니다.</p>';
    }

    document.querySelectorAll('.apply-recurring-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const recurringId = event.target.dataset.id;
            const recurringItem = recurringTransactions.find(r => r.id === recurringId);

            if (recurringItem) {
                // Create a new transaction based on recurring item
                const newTransaction = {
                    date: new Date().toISOString().split('T')[0], // Current date
                    type: recurringItem.type,
                    fromAccount: recurringItem.fromAccount,
                    toAccount: recurringItem.toAccount,
                    amount: recurringItem.amount,
                    description: `[고정] ${recurringItem.description}`, // Add prefix for clarity
                    tags: recurringItem.tags || [],
                    timestamp: new Date()
                };
                await addTransactionToFirestore(newTransaction);
                await updateRecurringTransactionLastAppliedMonth(recurringId, currentMonthKey);
                showUserMessage(`고정 거래 '${recurringItem.name}'가 적용되었습니다.`, 'success');
            }
        });
    });
}


// --- Event Listeners (이벤트 리스너) ---
// Authentication Form Events
loginBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showUserMessage('로그인 성공!', 'success', authMessageDisplay);
    } catch (error) {
        let errorMessage = '로그인 실패: ';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage += '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += '유효하지 않은 이메일 형식입니다.';
        } else {
            errorMessage += error.message;
        }
        showUserMessage(errorMessage, 'error', authMessageDisplay);
        console.error("Login error:", error);
    }
});

registerBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showUserMessage('회원가입 및 로그인 성공!', 'success', authMessageDisplay);
    } catch (error) {
        let errorMessage = '회원가입 실패: ';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage += '이미 사용 중인 이메일입니다.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage += '비밀번호는 6자 이상이어야 합니다.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += '유효하지 않은 이메일 형식입니다.';
        } else {
            errorMessage += error.message;
        }
        showUserMessage(errorMessage, 'error', authMessageDisplay);
        console.error("Register error:", error);
    }
});

resetPasswordBtn.addEventListener('click', async () => {
    const email = authEmailInput.value;
    if (!email) {
        showUserMessage('비밀번호를 재설정할 이메일을 입력해주세요.', 'warning', authMessageDisplay);
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        showUserMessage('비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.', 'info', authMessageDisplay);
    } catch (error) {
        let errorMessage = '비밀번호 재설정 실패: ';
        if (error.code === 'auth/user-not-found') {
            errorMessage += '등록되지 않은 이메일입니다.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += '유효하지 않은 이메일 형식입니다.';
        } else {
            errorMessage += error.message;
        }
        showUserMessage(errorMessage, 'error', authMessageDisplay);
        console.error("Password reset error:", error);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showUserMessage('로그아웃 되었습니다.', 'info');
        // Clear global data and show auth section
        transactions = [];
        accountBalances = {};
        monthlyBudget = {};
        dailyMemos = {};
        allAccounts = [];
        currentAccountGroups = [];
        recurringTransactions = [];
        showAuthSection();
        // Reset UI elements that depend on data
        populateAccountDropdowns();
        populateRecurringAccountDropdowns();
        renderAccountsTable();
        renderTransactions();
        renderDashboard();
        renderBudgetSummary();
        renderRegisteredRecurringTransactionsTable();
        checkAndRenderPendingRecurringTransactions();
    } catch (error) {
        console.error("Logout error:", error);
        showUserMessage(`로그아웃 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
});


// Tab switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        window.location.hash = `#${button.dataset.tab}`;
    });
});

// Transaction Form submission
transactionForm.addEventListener('submit', addTransaction);

// New Account Form submission
addAccountForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = newAccountNameInput.value.trim();
    const groupName = newAccountGroupSelect.value;
    const initialBalance = parseFloat(newAccountInitialBalanceInput.value) || 0;

    if (!name || !groupName) {
        showUserMessage('계정 이름과 그룹을 모두 입력해주세요.', 'warning');
        return;
    }

    let groupType = '';
    if (groupName.includes('자산')) groupType = '자산';
    else if (groupName.includes('부채')) groupType = '부채';
    else if (groupName === '수익') groupType = '수익';
    else if (groupName === '비용') groupType = '비용';

    if (!groupType) {
        showUserMessage('유효한 계정 그룹을 선택해주세요.', 'warning');
        return;
    }

    await addAccountToFirestore({
        name,
        groupName,
        groupType,
        initialBalance
    });

    addAccountForm.reset();
});


// Transaction type filter buttons
filterButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        selectedTypeFilter = event.currentTarget.dataset.filterType;
        selectedDate = null;
        selectedTagFilter = '';
        startDateFilterInput.value = '';
        endDateFilterInput.value = '';
        dateRangeStartDate = null;
        dateRangeEndDate = null;
        tagFilterInput.value = '';
        updateFilterButtonStyles();
        renderTransactions();
        showUserMessage(`${selectedTypeFilter === 'all' ? '전체' : selectedTypeFilter} 거래만 표시합니다.`, 'info');
    });
});

// Clear filters button
clearFiltersBtn.addEventListener('click', clearAllFilters);

// Date range filter
applyDateFilterBtn.addEventListener('click', () => {
    const start = startDateFilterInput.value;
    const end = endDateFilterInput.value;

    if (start && end) {
        dateRangeStartDate = new Date(start);
        dateRangeEndDate = new Date(end);
        dateRangeEndDate.setHours(23, 59, 59, 999); // Include the entire end day

        selectedDate = null;
        selectedTypeFilter = 'all';
        selectedTagFilter = '';
        updateFilterButtonStyles();
        tagFilterInput.value = '';
        renderTransactions();
        showUserMessage(`날짜 범위 (${start} ~ ${end})가 적용되었습니다.`, 'info');
    } else {
        showUserMessage('시작 날짜와 종료 날짜를 모두 입력해주세요.', 'warning');
    }
});

// Tag filter input
tagFilterInput.addEventListener('input', (event) => {
    selectedTagFilter = event.target.value.replace('#', '').trim();
    selectedDate = null;
    selectedTypeFilter = 'all';
    startDateFilterInput.value = '';
    endDateFilterInput.value = '';
    dateRangeStartDate = null;
    dateRangeEndDate = null;
    updateFilterButtonStyles();
    renderTransactions();
    if (selectedTagFilter) {
        showUserMessage(`#${selectedTagFilter} 태그로 필터링합니다.`, 'info');
    } else {
        showUserMessage('태그 필터가 해제되었습니다.', 'info');
    }
});


// Budget form submission
budgetForm.addEventListener('submit', handleBudgetSubmit);

// Cash Flow generation button
generateCashFlowBtn.addEventListener('click', generateCashFlowStatement);

// Reports generation button
generateReportBtn.addEventListener('click', generateReports);

// Daily Memo save button
saveMemoBtn.addEventListener('click', async () => {
    const todayKey = new Date().toISOString().split('T')[0];
    const memoContent = dailyMemoTextarea.value;
    await saveDailyMemoToFirestore(todayKey, memoContent);
});

// Recurring Transaction Form submission
addRecurringTransactionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = recurringNameInput.value.trim();
    const type = recurringTypeSelect.value;
    const fromAccount = recurringFromAccountSelect.value;
    const toAccount = recurringToAccountSelect.value;
    const amount = parseFloat(recurringAmountInput.value);
    const description = recurringDescriptionInput.value;
    const startDate = recurringStartDateInput.value;
    const dayOfMonth = parseInt(recurringDayOfMonthInput.value);

    if (!name || !type || !fromAccount || !toAccount || isNaN(amount) || amount <= 0 || !description || !startDate || isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
        showUserMessage('모든 고정 거래 필드를 올바르게 입력해주세요. 금액과 날짜는 유효해야 합니다.', 'warning');
        return;
    }

    const tags = (description.match(/#\w+/g) || []).map(tag => tag.substring(1));

    const newRecurringTransaction = {
        name,
        type,
        fromAccount,
        toAccount,
        amount,
        description,
        tags,
        startDate,
        dayOfMonth,
        lastAppliedMonth: '' // YYYY-MM format, to track when it was last applied
    };

    await addRecurringTransactionToFirestore(newRecurringTransaction);
    addRecurringTransactionForm.reset();
});

// Initial app load (handled by Firebase onAuthStateChanged listener)
// No need for DOMContentLoaded listener here, as Firebase auth state will drive initApp()
