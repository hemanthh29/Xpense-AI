import { app, auth } from './FireBase-Config.js';
import {
    getAuth,
    onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

import {
    getFirestore,
    collection,
    doc,
    setDoc,
    serverTimestamp,
    getDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

import { showAlert } from './Script.js';
import { defaultCategories } from './Category.js';

const isEditMode = urlParams.get("edit") === "true";
const transactionId = urlParams.get("transactionId");

onAuthStateChanged(auth, (user) => {
    if (user) {
        const navImg = document.getElementById("navProfileImage");
        const navIcon = document.getElementById("navProfileIcon");
        const dropdownImg = document.getElementById("dropdownProfileImage");
        const dropdownIcon = document.getElementById("dropdownProfileIcon");

        if (user.photoURL) {
            navImg.src = user.photoURL;
            navImg.style.display = "block";
            navIcon.style.display = "none";

            dropdownImg.src = user.photoURL;
            dropdownImg.style.display = "block";
            dropdownIcon.style.display = "none";
        } else {
            navImg.style.display = "none";
            navIcon.style.display = "inline";
            dropdownImg.style.display = "none";
            dropdownIcon.style.display = "inline";
        }

        document.getElementById("navUserName").textContent = user.displayName || "No Name";
        document.getElementById("navUserEmail").textContent = user.email;
    }
});

const urlParams = new URLSearchParams(window.location.search);
const accountId = urlParams.get("accountId");
const accountDropdown = document.getElementById("Account");
const db = getFirestore(app);

if (accountId && accountDropdown) {
    const accountRef = doc(db, "accounts", accountId);
    getDoc(accountRef).then((docSnap) => {
        if (docSnap.exists()) {
            const account = docSnap.data();
            const option = document.createElement("option");
            option.value = accountId;
            option.selected = true;
            option.textContent = `${account.accountName} (₹${account.initialBalance.toFixed(2)})`;
            accountDropdown.appendChild(option);
        } else {
            console.error("❌ Account not found");
        }
    }).catch((err) => {
        console.error("❌ Error fetching account:", err);
    });
}

const expenseTypeSelect = document.getElementById("Expense-Type");
const categorySelect = document.getElementById("Category");

expenseTypeSelect.addEventListener("change", () => {
    const selectedValue = expenseTypeSelect.value;
    categorySelect.innerHTML = `<option value="" disabled selected>Select Category</option>`;
    let filteredCategories = [];

    if (selectedValue === "1") {
        filteredCategories = defaultCategories.filter(cat => cat.type === "INCOME");
    } else if (selectedValue === "2") {
        filteredCategories = defaultCategories.filter(cat => cat.type === "EXPENSE");
    }

    filteredCategories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById("transactionDate");
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const minDate = "2000-01-01";
    dateInput.max = localToday;
    dateInput.min = minDate;

    dateInput.addEventListener("change", function () {
        const selectedDate = new Date(dateInput.value);
        if (selectedDate < new Date(minDate) || selectedDate > new Date(today)) {
            showAlert("danger", "Please select a date between Jan 1, 2000 and today.");
            dateInput.value = "";
        }
    });

    const switchInput = document.getElementById("flexSwitchCheckDefault");
    const intervalContainer = document.getElementById("Recurring-Interval-Container");

    switchInput.addEventListener("change", () => {
        intervalContainer.style.display = switchInput.checked ? "block" : "none";
    });
});

(() => {
    'use strict';
    const form = document.getElementById('transactionForm');
    const recurringSwitch = document.getElementById('flexSwitchCheckDefault');
    const recurringContainer = document.getElementById('Recurring-Interval-Container');
    const recurringSelect = document.getElementById('Recurring-Interval');

    form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    });

    recurringSwitch.addEventListener('change', () => {
        if (recurringSwitch.checked) {
            recurringContainer.style.display = 'block';
            recurringSelect.setAttribute('required', '');
        } else {
            recurringContainer.style.display = 'none';
            recurringSelect.removeAttribute('required');
            recurringSelect.value = '';
        }
    });
})();

document.getElementById("transactionForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.target;
    const addBtn = document.getElementById("Add-Transaction-Button");
    const spinner = addBtn.querySelector(".spinner-grow");
    const btnText = addBtn.querySelector(".btn-text");

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    // 🌀 Show spinner and disable button
    addBtn.disabled = true;
    spinner.classList.remove("d-none");
    btnText.textContent = "Adding...";

    const type = document.getElementById("Expense-Type").value === "1" ? "Income" : "Expense";
    const amount = parseFloat(document.getElementById("Transaction-Amount").value);
    const accountId = document.getElementById("Account").value;
    const category = document.getElementById("Category").value;
    const dateInput = document.getElementById("transactionDate").value;
    const date = new Date(dateInput);
    const description = document.getElementById("Description").value || "";
    const isRecurring = document.getElementById("flexSwitchCheckDefault").checked;
    const recurringIntervalSelect = document.getElementById("Recurring-Interval");
    const recurringInterval = isRecurring ? recurringIntervalSelect.value : null;
    const userId = auth.currentUser.uid;

    let nextRecurringDate = null;
    if (isRecurring) {
        nextRecurringDate = new Date(date);
        switch (recurringInterval) {
            case "1": nextRecurringDate.setDate(nextRecurringDate.getDate() + 1); break;
            case "2": nextRecurringDate.setDate(nextRecurringDate.getDate() + 7); break;
            case "3": nextRecurringDate.setMonth(nextRecurringDate.getMonth() + 1); break;
            case "4": nextRecurringDate.setFullYear(nextRecurringDate.getFullYear() + 1); break;
        }
    }

    try {
        const txRef = doc(collection(db, "transactions"));
        const transactionId = txRef.id;

        const transactionData = {
            type,
            userId,
            amount,
            accountId,
            description,
            date,
            category,
            receiptUrl: "",
            isRecurring,
            recurringInterval: recurringInterval || "",
            nextRecurringDate: isRecurring ? nextRecurringDate : null,
            lastProcessed: isRecurring ? date : null,
            status: "completed",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            transactionId
        };

        await setDoc(txRef, transactionData);

        const accountRef = doc(db, "accounts", accountId);
        const accountSnap = await getDoc(accountRef);

        if (accountSnap.exists()) {
            const currentBalance = accountSnap.data().initialBalance || 0;
            const newBalance = type === "Income" ? currentBalance + amount : currentBalance - amount;
            await updateDoc(accountRef, { initialBalance: newBalance });
        }

        showAlert("success", "✅ Transaction added successfully!");
        setTimeout(() => {
            window.location.href = `Accounts.html?id=${accountId}`;
        }, 1000);

    } catch (err) {
        console.error("Error adding transaction: ", err);
        alert("Failed to add transaction. Try again.");
    } finally {
        // 🔄 Reset button and spinner (in case error occurs)
        addBtn.disabled = false;
        spinner.classList.add("d-none");
        btnText.textContent = "Add Transaction";
    }
});

document.getElementById("cancelBtn").addEventListener("click", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get("accountId");

    if (accountId) {
        window.location.href = `Accounts.html?id=${accountId}`;
    } else {
        showAlert("danger", "❌ Account ID not found.");
    }
});
