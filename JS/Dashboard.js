import { app, auth } from './FireBase-Config.js';
import {
  getAuth,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
  doc
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

import { showAlert } from './Script.js';

const db = getFirestore(app);
const form = document.getElementById('accountForm');
const createBtn = document.getElementById("createAccountBtn");
const container = document.getElementById("accountRowContainer");

//Show loading spinner
function showLoading(button) {
  if (!button) return;
  button.dataset.originalText = button.innerHTML;
  button.innerHTML = `<span class="spinner-grow spinner-grow-sm"></span> Processing...`;
  button.disabled = true;
}

//Restore button after loading
function hideLoading(button) {
  if (!button) return;
  button.innerHTML = button.dataset.originalText || "Submit";
  button.disabled = false;
}

//Global card loading spinner
function showCardLoading() {
  container.innerHTML = `<div class="text-center w-100 my-4">
      <span class="spinner-grow spinner-grow-sm text-primary" role="status" aria-hidden="true"></span>
    </div>`;
}

//Load accounts dynamically
async function loadAccounts(user) {
  showCardLoading();

  const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
  const querySnapshot = await getDocs(q);

  container.innerHTML = "";

  //Add button
  const addButton = document.createElement("div");
  addButton.className = "col-12 col-md-6 col-lg-4 col-xl-3 mt-3 Button-Container";
  addButton.innerHTML = `
      <button class="Card-Button p-5 shadow h-100" type="button" data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasBottom" aria-controls="offcanvasBottom">
        <div class="col-12"><i class="fa-solid fa-plus fa-2x"></i></div>
        <div class="col-12 mt-2">Add New Account</div>
      </button>
    `;
  container.appendChild(addButton);

  querySnapshot.forEach(docSnap => {
    const account = docSnap.data();
    const accountId = docSnap.id;
    const switchId = `switch-${accountId}`;

    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4 col-xl-3 mt-3";
    card.addEventListener("click", () => {
      window.location.href = `Accounts.html?id=${accountId}`;
    });
    card.innerHTML = `
          <div class="Account-Card shadow p-3" style="cursor: pointer;">
            <div class="d-flex flex-row justify-content-between">
              <p class="Account-Card-Heading">${account.accountName}</p>
              <div class="form-check form-switch">
                <input class="form-check-input default-switch" id="${switchId}" type="checkbox"
                ${account.isDefault ? "checked" : ""} data-id="${accountId}" onclick="event.stopPropagation()">
              </div>
            </div>
            <p class="Account-Balance">₹${account.initialBalance.toFixed(2)}</p>
            <p class="Account-Card-Info">${account.accountType}</p>
            <div class="d-flex flex-row justify-content-between">
              <div class="d-flex flex-row">
                <i class="fa-solid fa-arrow-trend-up mt-1 text-success"></i><p class="ms-2">Income</p>
              </div>
              <div class="d-flex flex-row">
                <i class="fa-solid fa-arrow-trend-down mt-1 text-danger"></i><p class="ms-2">Expense</p>
              </div>
            </div>
          </div>
        `;
    container.appendChild(card);

    //Add default switch logic
    setTimeout(() => {
      const toggleSwitch = document.getElementById(switchId);
      toggleSwitch?.addEventListener("change", async function () {
        // ✅ Prevent turning off the default switch manually
        if (!this.checked) {
          this.checked = true; // Revert it back
          showAlert("error", "⚠️ You cannot turn off the default account. Select another account to change.");
          return;
        }

        const switchEl = this;
        const originalChecked = switchEl.checked;

        // Show spinner and disable switch
        switchEl.disabled = true;
        const originalClasses = switchEl.className;
        switchEl.className += " spinner-border spinner-border-sm";

        try {
          const batch = writeBatch(db);
          const qAll = query(collection(db, "accounts"), where("userId", "==", user.uid));
          const allAccounts = await getDocs(qAll);

          allAccounts.forEach(docSnap => {
            const ref = doc(db, "accounts", docSnap.id);
            const isCurrent = docSnap.id === switchEl.dataset.id;
            batch.update(ref, { isDefault: isCurrent });
          });

          await batch.commit();

          // Update UI switches
          document.querySelectorAll(".default-switch").forEach(sw => {
            sw.checked = (sw.dataset.id === switchEl.dataset.id);
          });

          showAlert("success", "✅ Default account updated!");
        } catch (err) {
          console.error("Error updating default account:", err);
          showAlert("error", "❌ Failed to update default account.");
          switchEl.checked = !originalChecked; // Revert UI if failed
        } finally {
          // Restore switch UI
          switchEl.disabled = false;
          switchEl.className = originalClasses;
        }
      });

    }, 0);
  });
}

//Submit Form Handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  showLoading(createBtn);

  const accountName = document.getElementById("formGroupExampleInput").value.trim();
  const accountType = document.getElementById("exampleSelect").value;
  const initialBalance = parseFloat(document.getElementById("formGroupExampleInput3").value);
  let isDefault = document.getElementById("flexSwitchCheckDefault").checked;

  const user = auth.currentUser;
  if (!user) {
    showAlert("error", "⚠️ Please sign in first.");
    hideLoading(createBtn);
    return;
  }
  const qCheck = query(collection(db, "accounts"), where("userId", "==", user.uid));
  const existingAccounts = await getDocs(qCheck);
  if (existingAccounts.empty) {
    isDefault = true;
  }


  try {
    //If marked as default, unset other defaults first
    if (isDefault) {
      const q = query(collection(db, "accounts"), where("userId", "==", user.uid), where("isDefault", "==", true));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.forEach(docSnap => {
        const ref = doc(db, "accounts", docSnap.id);
        batch.update(ref, { isDefault: false });
      });

      await batch.commit(); //Unset all previous defaults
    }

    //Add new account
    await addDoc(collection(db, "accounts"), {
      userId: user.uid,
      accountName,
      accountType,
      initialBalance,
      isDefault,
      createdAt: serverTimestamp()
    });

    showAlert("success", "Account created successfully!");
    form.reset();
    form.classList.remove("was-validated");

    const offcanvasEl = document.getElementById('offcanvasBottom');
    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
    if (bsOffcanvas) bsOffcanvas.hide();

    await loadAccounts(user); //Refresh after create

  } catch (error) {
    console.error("Error adding account:", error);
    showAlert("error", "Something went wrong while creating the account.");
  }
  finally {
    hideLoading(createBtn);
  }
});

//Initial Load
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadAccounts(user);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Elements
    const navImg = document.getElementById("navProfileImage");
    const navIcon = document.getElementById("navProfileIcon");

    const dropdownImg = document.getElementById("dropdownProfileImage");
    const dropdownIcon = document.getElementById("dropdownProfileIcon");

    //Set profile image if exists
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

    //Set name and email
    document.getElementById("navUserName").textContent = user.displayName || "No Name";
    document.getElementById("navUserEmail").textContent = user.email;
  }
});

