import { app, auth } from './FireBase-Config.js';
import { defaultCategories } from './Category.js';
import {
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    writeBatch,
    deleteDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-functions.js';

const functions = getFunctions(app);
const db = getFirestore(app);

// Add Transaction button
document.getElementById("addTransactionBtn")?.addEventListener("click", () => {
    const accountId = new URLSearchParams(window.location.search).get("id");
    if (accountId) {
        window.location.href = `Transaction.html?accountId=${accountId}`;
    } else {
        alert("⚠️ Account ID not found. Cannot proceed to transaction page.");
    }
});

// Auth state
onAuthStateChanged(auth, async (user) => {
    console.log('User Authentication State Changed:', user);
    if (!user) return;

    const navImg = document.getElementById("navProfileImage");
    const navIcon = document.getElementById("navProfileIcon");
    const dropdownImg = document.getElementById("dropdownProfileImage");
    const dropdownIcon = document.getElementById("dropdownProfileIcon");

    if (user.photoURL) {
        navImg.src = user.photoURL;
        dropdownImg.src = user.photoURL;
        navImg.style.display = dropdownImg.style.display = "block";
        navIcon.style.display = dropdownIcon.style.display = "none";
    } else {
        navImg.style.display = dropdownImg.style.display = "none";
        navIcon.style.display = dropdownIcon.style.display = "inline";
    }

    document.getElementById("navUserName").textContent = user.displayName || "No Name";
    document.getElementById("navUserEmail").textContent = user.email;

    const accountId = new URLSearchParams(window.location.search).get("id");
    if (!accountId) return;

    const loader = document.getElementById("accountDetailsLoader");
    const accountContent = document.querySelector(".fluid-container");
    const tbody = document.querySelector("tbody");

    loader.style.display = "block";
    accountContent.style.display = "none";

    try {
        const accountRef = doc(db, "accounts", accountId);
        const accountSnap = await getDoc(accountRef);
        console.log('Fetched Account:', accountSnap.data()); // Add this line to log the fetched account data
        if (!accountSnap.exists()) return;

        const account = accountSnap.data();
        if (account.userId !== user.uid) return;

        document.querySelector(".Account-Name").textContent = account.accountName;
        document.querySelector(".Account-Type").textContent = account.accountType;
        document.querySelector(".Account-Balance").textContent = `₹${account.initialBalance.toFixed(2)}`;

        const categoryMap = {};
        defaultCategories.forEach(cat => categoryMap[cat.id] = cat);

        const txQuery = query(
            collection(db, "transactions"),
            where("accountId", "==", accountId),
            where("userId", "==", user.uid)
        );
        const txSnap = await getDocs(txQuery);
        console.log('Transactions Count:', txSnap.size); // Add this line to see how many transactions were returned

        const count = txSnap.size;
        document.querySelector(".No-Of-Transactions").textContent =
            count === 0 ? "No Transactions" : `${count} Transaction${count > 1 ? 's' : ''}`;

        tbody.innerHTML = "";

        if (txSnap.empty) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">No transactions found.</td></tr>`;
            return;
        }

        txSnap.forEach((docSnap) => {
            const tx = docSnap.data();
            console.log('Processing Transaction:', tx); // Add this line to log each transaction
            const docId = docSnap.id;
            if (tx.history === true) return;
            const isIncome = tx.type?.toLowerCase() === "income";
            const amountClass = isIncome ? "text-success" : "text-danger";
            const amountPrefix = isIncome ? "+" : "-";
            const amountValue = `${amountPrefix}₹${parseFloat(tx.amount).toFixed(2)}`;
            const category = categoryMap[tx.category];
            const categoryBadge = category
                ? `<span class="badge" style="background-color: ${category.color}; color: white;">${category.name}</span>`
                : `<span class="badge bg-secondary">Unknown</span>`;

            const dateFormatted = tx.date?.seconds
                ? new Date(tx.date.seconds * 1000).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric"
                }) : "N/A";

            let recurringBadge = `<span class="badge bg-light text-dark border fw-medium">One-time</span>`;
            if (tx.isRecurring && tx.nextRecurringDate?.seconds) {
                const nextDate = new Date(tx.nextRecurringDate.seconds * 1000);
                const formattedNextDate = nextDate.toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric"
                });
                recurringBadge = `
                    <span class="badge bg-light text-purple border border-purple fw-medium cursor-pointer"
                          data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true"
                          title="Next Date,<br>${formattedNextDate}">
                        Monthly
                    </span>`;
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><input class="form-check-input" type="checkbox" /></td>
                <td>${dateFormatted}</td>
                <td>${tx.description || "-"}</td>
                <td>${categoryBadge}</td>
                <td class="${amountClass} fw-semibold">${amountValue}</td>
                <td>${recurringBadge}</td>
                <td class="text-end">
                    <div class="dropleft">
                        <button class="btn btn-sm btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            ${tx.isRecurring ? `<li><a class="dropdown-item history-toggle" href="#" data-doc-id="${docId}">History</a></li>` : ""}
                            <li><a class="dropdown-item" href="#">Edit</a></li>
                            <li><a class="dropdown-item text-danger delete-transaction" href="#" data-doc-id="${docId}">Delete</a></li>
                        </ul>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
            // ✅ Attach delete functionality
            document.querySelectorAll('.delete-transaction').forEach(item => {
                item.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const docId = item.dataset.docId;
                    const confirmDelete = confirm("Are you sure you want to delete this transaction?");
                    if (!confirmDelete) return;
            
                    try {
                        const deleteTransaction = httpsCallable(functions, 'deleteTransaction');
                        const result = await deleteTransaction({ docId });
                    
                        if (result.data && result.data.success) {
                            alert("✅ Transaction deleted successfully.");
                            location.reload();
                        } else {
                            throw new Error("Function did not return success.");
                        }
                    } catch (err) {
                        console.error("❌ Error calling deleteTransaction function:", err.message);
                        alert("Error deleting transaction. Please try again.");
                    }                    
                });
            });                        
        });

        // Tooltip re-init
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

        // History toggle logic
        document.querySelectorAll('.history-toggle').forEach(item => {
            item.addEventListener("click", async (e) => {
                e.preventDefault();
                const docId = item.dataset.docId;
                console.log('History Toggle for Transaction ID:', docId); // Add this line to track the history toggle event
                const parentRow = item.closest("tr");

                const existingRow = parentRow.nextElementSibling;
                if (existingRow && existingRow.classList.contains("history-row")) {
                    existingRow.remove();
                    item.style.display = "block"; // re-enable history button
                    return;
                }

                const loadingRow = document.createElement("tr");
                loadingRow.classList.add("history-row");
                loadingRow.innerHTML = `
                    <td colspan="7" class="text-center">
                        <div class="spinner-grow text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </td>`;
                parentRow.insertAdjacentElement("afterend", loadingRow);
                item.style.display = "none";

                try {
                    const txRef = doc(db, "transactions", docId);
                    const txSnap = await getDoc(txRef);
                    const parentTx = txSnap.data();

                    const historyQuery = query(
                        collection(db, "transactions"),
                        where("isRecurring", "==", false),
                        where("accountId", "==", parentTx.accountId),
                        where("userId", "==", parentTx.userId),
                        where("description", "==", parentTx.description),
                        where("amount", "==", parentTx.amount)
                    );
                    const historySnap = await getDocs(historyQuery);

                    if (historySnap.empty) {
                        loadingRow.innerHTML = `
                            <td colspan="7">
                                <div class="p-3 bg-light border rounded text-center">
                                    <p class="mb-2 text-muted">No past history available.</p>
                                    <button class="btn btn-sm btn-outline-secondary hide-history-btn">Hide</button>
                                </div>
                            </td>`;

                        // Add event listener to hide the row
                        loadingRow.querySelector(".hide-history-btn").addEventListener("click", () => {
                            loadingRow.remove();
                            item.style.display = "block";
                        });
                        return;
                    }

                    const historyRows = Array.from(historySnap.docs).map(doc => {
                        const data = doc.data();
                        const processedDate = new Date(data.lastProcessed.seconds * 1000).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric"
                        });
                        const isIncome = data.type?.toLowerCase() === "income";
                        const amountClass = isIncome ? "text-success" : "text-danger";
                        const amountPrefix = isIncome ? "+" : "-";
                        const amountValue = `${amountPrefix}₹${parseFloat(data.amount).toFixed(2)}`;
                        const category = defaultCategories.find(cat => cat.id === data.category);
                        const categoryBadge = category
                            ? `<span class="badge" style="background-color: ${category.color}; color: white;">${category.name}</span>`
                            : `<span class="badge bg-secondary">Unknown</span>`;
                        return `
                            <tr>
                                <td>${processedDate}</td>
                                <td>${data.description || "-"}</td>
                                <td>${categoryBadge}</td>
                                <td class="${amountClass}">${amountValue}</td>
                                <td>${data.status || "-"}</td>
                            </tr>`;
                    }).join("");

                    loadingRow.innerHTML = `
                        <td colspan="7">
                            <div class="p-2 bg-light border rounded">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="mb-0 text-dark">Past Recurring History</h6>
                                    <button class="btn btn-sm btn-outline-secondary hide-history-btn">Hide History</button>
                                </div>
                                <table class="table table-sm Custom-Table mb-0">
                                    <thead>
                                        <tr>
                                            <th>Last Processed At</th>
                                            <th>Description</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>${historyRows}</tbody>
                                </table>
                            </div>
                        </td>`;

                    loadingRow.querySelector(".hide-history-btn").addEventListener("click", () => {
                        loadingRow.remove();
                        item.style.display = "block";
                    });

                } catch (err) {
                    console.error("❌ Error fetching history:", err);
                    loadingRow.innerHTML = `<td colspan="7" class="text-danger text-center">Error loading history.</td>`;
                    item.style.display = "block";
                }
            });
        });

    } catch (err) {
        console.error("❌ Error loading data:", err);
    } finally {
        loader.style.display = "none";
        accountContent.style.display = "block";
    }
});
