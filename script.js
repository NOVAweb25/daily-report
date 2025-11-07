// ✅ تحميل مكتبة Excel
// تأكدي إنها مضافة في <head>:
/// <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

function toggleLang() {
  alert("ميزة تغيير اللغة قيد التطوير 🌐");
}

const dateEl = document.getElementById("date");
if (dateEl) {
  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  dateEl.textContent = `تاريخ اليوم: ${today}`;
}

// 🔹 أدوات المظهر
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function createRow(section) {
  const row = document.createElement("div");
  row.className = "card";
  const fields = {
    tasks: [
      { label: "الوقت", type: "time" },
      { label: "المشروع / الموقع", type: "textarea" },
      { label: "المهمة المنجزة", type: "textarea" },
      { label: "كم أنجزت", type: "textarea" },
    ],
    expenses: [
      { label: "المبلغ المدفوع", type: "textarea" },
      {
        label: "الموقع",
        type: "select",
        options: [
          "البدراني",
          "القبلتين حضرم",
          "القبلتين وقف البري",
          "الوكالة الذهبية",
          "قربان",
          "مصروفات عامة",
          "الفندق السحمان",
          "ينبع",
        ],
      },
      { label: "تفاصيل المدفوعات", type: "textarea" },
      { label: "لمن تم التسديد", type: "textarea" },
    ],
    feedback: [
      { label: "الصعوبات", type: "textarea" },
      { label: "الاحتياجات", type: "textarea" },
      { label: "الاقتراحات", type: "textarea" },
    ],
  };

  fields[section].forEach((f) => {
    const field = document.createElement("div");
    field.className = "field";
    const label = document.createElement("label");
    label.textContent = f.label;
    let input;
    if (f.type === "textarea") {
      input = document.createElement("textarea");
      input.oninput = () => autoResize(input);
    } else if (f.type === "select") {
      input = document.createElement("select");
      f.options.forEach((o) => {
        const op = document.createElement("option");
        op.value = o;
        op.textContent = o;
        input.appendChild(op);
      });
    } else {
      input = document.createElement("input");
      input.type = f.type;
    }
    field.append(label, input);
    row.append(field);
  });

  const del = document.createElement("button");
  del.className = "del";
  del.textContent = "حذف";
  del.onclick = () => row.remove();
  row.append(del);
  return row;
}

function addRow(section) {
  document.getElementById(`${section}-body`).appendChild(createRow(section));
}

// 🔹 إنشاء التقرير الكامل في Excel
function exportFullReport(empName, empPhone, sectionsData) {
  const wb = XLSX.utils.book_new();

  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
  const ws_data = [];

  ws_data.push([`الموظف: ${empName}`]);
  ws_data.push([`تاريخ اليوم: ${today}`]);
  ws_data.push([""]);

  // إضافة كل جدول بحسب القسم
  if (sectionsData.tasks) {
    ws_data.push(["📋 جدول المهام"]);
    ws_data.push(Object.keys(sectionsData.tasks));
    ws_data.push(Object.values(sectionsData.tasks));
    ws_data.push([""]);
  }

  if (sectionsData.expenses) {
    ws_data.push(["💰 جدول المصروفات"]);
    ws_data.push(Object.keys(sectionsData.expenses));
    ws_data.push(Object.values(sectionsData.expenses));
    ws_data.push([""]);
  }

  if (sectionsData.feedback) {
    ws_data.push(["💭 جدول الصعوبات والاقتراحات"]);
    ws_data.push(Object.keys(sectionsData.feedback));
    ws_data.push(Object.values(sectionsData.feedback));
  }

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, today);

  XLSX.writeFile(wb, `تقرير_${empName || "موظف"}.xlsx`);
}

// 🔹 جمع البيانات من كل قسم في الصفحة الحالية
function collectData(section) {
  const inputs = document.querySelectorAll(
    `#${section}-body input, #${section}-body textarea, #${section}-body select`
  );

  const data = {};
  inputs.forEach((i) => {
    const key = i.previousSibling.textContent || "بيان";
    data[key] = i.value || "";
  });
  return data;
}

// 🔹 تهيئة كل صفحة (المهام / المصروفات / الصعوبات)
function initPage(section) {
  addRow(section);
  const sendBtn = document.querySelector(`#send-${section}`);
  const statusEl = document.getElementById("status");

  sendBtn.addEventListener("click", () => {
    const empName = document.getElementById("empName")
      ? document.getElementById("empName").value.trim()
      : "موظف";
    const empPhone = document.getElementById("empPhone")
      ? document.getElementById("empPhone").value.trim()
      : "";

    // جمع بيانات الأقسام الثلاثة إن وُجدت
    const allSections = {};
    ["tasks", "expenses", "feedback"].forEach((sec) => {
      const el = document.getElementById(`${sec}-body`);
      if (el) allSections[sec] = collectData(sec);
    });

    statusEl.textContent = "📤 جاري إنشاء التقرير...";

    try {
      exportFullReport(empName, empPhone, allSections);
      statusEl.textContent = "✅ تم حفظ التقرير بنجاح.";
      statusEl.className = "status success";
      alert("✅ تم حفظ تقرير Excel يحتوي على كل الجداول.");
    } catch (e) {
      console.error(e);
      statusEl.textContent = "❌ حدث خطأ أثناء إنشاء الملف.";
      statusEl.className = "status error";
    }
  });
}
