// ✅ عرض تاريخ اليوم تلقائي
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

// 🔹 إنشاء صف جديد حسب القسم
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

// 🔹 جمع جميع الصفوف داخل القسم الواحد
function collectRows(section) {
  const rows = document.querySelectorAll(`#${section}-body .card`);
  const dataRows = [];

  rows.forEach((row) => {
    const inputs = row.querySelectorAll("input, textarea, select");
    const rowData = {};
    inputs.forEach((input) => {
      const label = input.previousSibling.textContent || "بيان";
      rowData[label] = input.value || "";
    });
    dataRows.push(rowData);
  });

  return dataRows;
}

// 🔹 تحديث أو إنشاء ملف Excel واحد لليوم
function updateExcelFile(section, dataRows) {
  const today = new Date().toISOString().split("T")[0];
  const fileName = `تقرير_${today}.xlsx`;

  let wb;

  // ✅ استرجاع الملف من localStorage إن وجد
  const saved = localStorage.getItem(fileName);
  if (saved) {
    const bytes = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
    wb = XLSX.read(bytes, { type: "array" });
  } else {
    wb = XLSX.utils.book_new();
    const todayText = new Date().toLocaleDateString("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const firstSheet = XLSX.utils.aoa_to_sheet([
      [`📅 تقرير يوم ${todayText}`],
      [""],
    ]);
    XLSX.utils.book_append_sheet(wb, firstSheet, "اليوم");
  }

  // ✅ قراءة الورقة الحالية
  const ws = wb.Sheets["اليوم"];
  const ws_data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // ✅ عناوين الأقسام
  const titles = {
    tasks: "📋 جدول المهام",
    expenses: "💰 جدول المصروفات",
    feedback: "💭 جدول الصعوبات والاقتراحات",
  };

  // ✅ إذا القسم موجود مسبقًا، نحذف القديم (للتحديث)
  const sectionIndex = ws_data.findIndex((r) => r[0] === titles[section]);
  if (sectionIndex !== -1) {
    // نحذف السطور القديمة لهذا القسم
    let end = sectionIndex + 1;
    while (end < ws_data.length && ws_data[end][0] !== undefined && !ws_data[end][0].startsWith("📋") && !ws_data[end][0].startsWith("💰") && !ws_data[end][0].startsWith("💭")) {
      end++;
    }
    ws_data.splice(sectionIndex, end - sectionIndex);
  }

  // ✅ إضافة القسم الجديد مع الصفوف
  ws_data.push([""]);
  ws_data.push([titles[section]]);
  if (dataRows.length > 0) {
    const headers = Object.keys(dataRows[0]);
    ws_data.push(headers);
    dataRows.forEach((r) => ws_data.push(Object.values(r)));
  }

  // ✅ إنشاء الورقة المحدثة
  const newSheet = XLSX.utils.aoa_to_sheet(ws_data);
  wb.Sheets["اليوم"] = newSheet;

  // ✅ حفظ داخلي فقط (بدون تحميل كل مرة)
  const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  localStorage.setItem(fileName, wbout);

  return wb;
}

// 🔹 تهيئة الصفحة
function initPage(section) {
  addRow(section);
  const sendBtn = document.querySelector(`#send-${section}`);
  const statusEl = document.getElementById("status");

  sendBtn.addEventListener("click", () => {
    const dataRows = collectRows(section);
    statusEl.textContent = "📤 جاري حفظ التقرير...";
    try {
      const wb = updateExcelFile(section, dataRows);
      statusEl.textContent = "✅ تم حفظ التحديث في ملف اليوم.";
      statusEl.className = "status success";
      alert("✅ تم تحديث ملف تقرير اليوم بنجاح (لم يتم إنشاء نسخة جديدة).");

      // تحميل يدوي فقط لو المستخدم يختار
      const saveConfirm = confirm("هل ترغب في تنزيل نسخة من التقرير الآن؟");
      if (saveConfirm) {
        const today = new Date().toISOString().split("T")[0];
        XLSX.writeFile(wb, `تقرير_${today}.xlsx`);
      }
    } catch (e) {
      console.error(e);
      statusEl.textContent = "❌ حدث خطأ أثناء حفظ التقرير.";
      statusEl.className = "status error";
    }
  });
}
