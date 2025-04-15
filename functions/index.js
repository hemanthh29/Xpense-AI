const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onCall} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// ✅ 1. Scheduled Function: Update Recurring Transactions
exports.updateRecurringTransactions = onSchedule(
    {
      schedule: "every day 00:00",
      timeZone: "Asia/Kolkata",
    },
    async () => {
      const now = new Date();
      const bufferTime = new Date(now);
      bufferTime.setHours(bufferTime.getHours() + 6); // ⏰ 6-hour buffer

      console.log(`🔄 Checking recurring transactions due before: 
        ${bufferTime.toISOString()}`);

      const snapshot = await db
          .collection("transactions")
          .where("isRecurring", "==", true)
          .where("nextRecurringDate", "<=", Timestamp.fromDate(bufferTime))
          .get();

      if (snapshot.empty) {
        console.log("✅ No recurring transactions due within buffer.");
        return;
      }

      const batch = db.batch();

      snapshot.forEach((docSnap) => {
        const tx = docSnap.data();
        const docRef = docSnap.ref;

        const currentDate = tx.nextRecurringDate.toDate();
        const nextDate = new Date(currentDate);

        // 📆 Calculate next recurring date
        switch (tx.recurringInterval) {
          case "1":
            nextDate.setDate(nextDate.getDate() + 1);
            break; // Daily
          case "2":
            nextDate.setDate(nextDate.getDate() + 7);
            break; // Weekly
          case "3":
            nextDate.setMonth(nextDate.getMonth() + 1);
            break; // Monthly
          case "4":
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break; // Yearly
          default:
            console.warn(`⚠️ Invalid interval on transaction ${docRef.id}`);
            return;
        }

        // 🕓 Create historical transaction
        const historyTx = {
          ...tx,
          userId: tx.userId,
          date: tx.nextRecurringDate,
          lastProcessed: tx.nextRecurringDate,
          nextRecurringDate: null,
          isRecurring: false,
          history: true,
        };

        batch.set(db.collection("transactions").doc(), historyTx);

        // 🔁 Update recurring transaction
        batch.update(docRef, {
          lastProcessed: Timestamp.fromDate(currentDate),
          nextRecurringDate: Timestamp.fromDate(nextDate),
        });

        // 💰 Update account balance
        const balanceChange =
        tx.type && tx.type.toLowerCase() === "income" ? tx.amount : -tx.amount;

        const accountRef = db.collection("accounts").doc(tx.accountId);
        batch.update(accountRef, {
          initialBalance: FieldValue.increment(balanceChange),
        });
      });

      await batch.commit();
    },
);

// ✅ 2. Callable Function: Secure Delete Transaction + History + Balance Update
exports.deleteTransaction = onCall(async (req) => {
  const uid = req.auth && req.auth.uid;
  if (!uid) throw new Error("Unauthorized");

  const {docId} = req.data;
  if (!docId) throw new Error("docId is required");

  const txRef = db.collection("transactions").doc(docId);
  const txSnap = await txRef.get();

  if (!txSnap.exists) throw new Error("Transaction not found");
  const tx = txSnap.data();
  if (tx.userId !== uid) throw new Error("Permission denied");

  const batch = db.batch();
  batch.delete(txRef);

  // 🔁 Delete history docs if it's recurring
  let totalHistoryBalanceChange = 0;
  if (tx.isRecurring && tx.transactionId) {
    const historySnap = await db
        .collection("transactions")
        .where("transactionId", "==", tx.transactionId)
        .where("history", "==", true)
        .get();

    historySnap.forEach((doc) => {
      const historyData = doc.data();
      if (historyData.userId === uid) {
        batch.delete(doc.ref);

        // 🔁 Accumulate history balance change
        const change = historyData.type &&
         historyData.type.toLowerCase() === "income" ?
          -historyData.amount :
          historyData.amount;

        totalHistoryBalanceChange += change;
      }
    });
  }

  // 💰 Update account balance
  const accountRef = db.collection("accounts").doc(tx.accountId);
  const accountSnap = await accountRef.get();
  if (accountSnap.exists) {
    const account = accountSnap.data();
    const balanceChange =
      (tx.type && tx.type.toLowerCase() === "income") ? -tx.amount : tx.amount;
    const totalBalanceChange = balanceChange + totalHistoryBalanceChange;
    batch.update(accountRef, {
      initialBalance: account.initialBalance + totalBalanceChange,
    });
  }

  await batch.commit();
  return {success: true};
});
