// ===== التاريخ =====
const dateEl = document.getElementById("date");
const today = new Date();
const todayStr = today.toLocaleDateString("ar-SA", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
dateEl.textContent = `تاريخ اليوم: ${todayStr}`;

// ===== تمدد النص تلقائي =====
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// ===== إنشاء صفوف عمودية =====
function createRow(section) {
  const row = document.createElement("div");
  row.className = "tbody-row";

  const fields = {
    tasks: [
      { label: "الوقت", type: "time", required: true },
      { label: "المشروع / الموقع", type: "textarea", required: true },
      { label: "المهمة المنجزة", type: "textarea", required: true },
      { label: "كم أنجزت", type: "textarea", required: true },
    ],
    expenses: [
      { label: "المبلغ المدفوع", type: "textarea", required: true },
      { label: "تفاصيل المدفوعات", type: "textarea", required: true },
      { label: "تم السداد؟", type: "textarea", required: true },
      { label: "ملاحظات", type: "textarea", required: false },
    ],
    feedback: [
      { label: "الصعوبات", type: "textarea", required: true },
      { label: "الاحتياجات", type: "textarea", required: true },
      { label: "الاقتراحات", type: "textarea", required: false },
    ],
  };

  fields[section].forEach(f => {
    const cell = document.createElement("div");
    cell.className = "cell";
    const label = document.createElement("label");
    label.textContent = f.label;
    let input;

    if (f.type === "time") {
      input = document.createElement("input");
      input.type = "time";
    } else {
      input = document.createElement("textarea");
      input.oninput = () => autoResize(input);
    }

    if (f.required) input.required = true;
    cell.append(label, input);
    row.appendChild(cell);
  });

  // زر حذف الصف (يمنع حذف الصف الوحيد)
  const delBtn = document.createElement("button");
  delBtn.className = "del";
  delBtn.textContent = "×";
  delBtn.onclick = () => {
    const body = row.parentElement;
    if (body.children.length > 1) row.remove();
    else alert("⚠️ لا يمكن حذف آخر صف في هذا القسم.");
  };
  row.appendChild(delBtn);

  return row;
}

function addRow(section) {
  const map = {
    tasks: "tasks-body",
    expenses: "expenses-body",
    feedback: "feedback-body",
  };
  const body = document.getElementById(map[section]);
  body.appendChild(createRow(section));
}

// صف واحد افتراضي لكل قسم
addRow("tasks");
addRow("expenses");
addRow("feedback");

// ===== قراءة البيانات =====
function readTable(bodyId) {
  const rows = document.querySelectorAll(`#${bodyId} .tbody-row`);
  return Array.from(rows).map(row => {
    const inputs = row.querySelectorAll("input,textarea");
    return Array.from(inputs).map(i => i.value.trim());
  });
}

function buildReportText() {
  const empName  = document.getElementById("empName").value.trim();
  const empPhone = document.getElementById("empPhone").value.trim();

  const tasks    = readTable("tasks-body");
  const expenses = readTable("expenses-body");
  const feedback = readTable("feedback-body");

  const tasksTxt = tasks.map((r,i)=>`[${i+1}] الوقت: ${r[0]} | المشروع: ${r[1]} | المهمة: ${r[2]} | الإنجاز: ${r[3]}`).join("\n");
  const expTxt   = expenses.map((r,i)=>`[${i+1}] المبلغ: ${r[0]} | التفاصيل: ${r[1]} | تم السداد؟ ${r[2]} | ملاحظات: ${r[3]}`).join("\n");
  const fbTxt    = feedback.map((r,i)=>`[${i+1}] الصعوبات: ${r[0]} | الاحتياجات: ${r[1]} | الاقتراحات: ${r[2]}`).join("\n");

  const fullText = `تقرير الإنجاز اليومي
التاريخ: ${todayStr}
الموظف: ${empName}
الجوال: ${empPhone}

القسم الأول: إنجاز المهام
${tasksTxt || "- لا يوجد"}

القسم الثاني: المصروفات
${expTxt || "- لا يوجد"}

القسم الثالث: الصعوبات / الاحتياجات / الاقتراحات
${fbTxt || "- لا يوجد"}`;

  return { empName, empPhone, fullText };
}

// ===== إرسال البيانات إلى Google Sheets =====

// 🧩 حطي هنا رابط الـ Web App اللي نسختيه من Google Apps Script
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzRSXYMYjrDSeRLOKR9ZCJ-JxMUVueFhbCrOeoWHn2BRuCQ9lEyn_IrLkcso6uaqPP8/exec"; // ← استبدليه برابطك الفعلي

const statusEl = document.getElementById("status");
const sendBtn = document.getElementById("send-btn");

function setStatus(msg, cls = "") {
  statusEl.className = `status ${cls}`;
  statusEl.textContent = msg;
}

sendBtn.addEventListener("click", async () => {
  const { empName, empPhone, fullText } = buildReportText();

  // تحقق من الحقول المطلوبة
  const requiredFields = document.querySelectorAll("input[required], textarea[required]");
  for (let field of requiredFields) {
    if (!field.value.trim()) {
      field.focus();
      setStatus("⚠️ الرجاء تعبئة جميع الحقول المطلوبة.", "error");
      return;
    }
  }

  if (!empName) {
    setStatus("⚠️ الرجاء كتابة اسم الموظف.", "error");
    return;
  }

  // جمع البيانات المفصلة لكل قسم
  const tasksText = document.querySelector("#tasks-body").innerText.trim();
  const expensesText = document.querySelector("#expenses-body").innerText.trim();
  const feedbackText = document.querySelector("#feedback-body").innerText.trim();

  const payload = {
    employee_name: empName,
    employee_phone: empPhone,
    tasks: tasksText,
    expenses: expensesText,
    feedback: feedbackText,
  };

  sendBtn.disabled = true;
  setStatus("📤 جاري الإرسال...");

  try {
    const response = await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      setStatus("✅ تم إرسال التقرير بنجاح إلى Google Sheets.", "success");

      // تفريغ الحقول بعد الإرسال
      document.querySelectorAll("input, textarea").forEach((el) => (el.value = ""));
    } else {
      setStatus("❌ حدث خطأ أثناء الإرسال. تأكد من الرابط أو الشيت.", "error");
    }
  } catch (error) {
    console.error(error);
    setStatus("❌ تعذر الاتصال بـ Google Sheets.", "error");
  } finally {
    sendBtn.disabled = false;
  }
});
