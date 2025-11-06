function toggleLang(){alert("ميزة تغيير اللغة قيد التطوير 🌐");}

// التاريخ
const dateEl=document.getElementById("date");
if(dateEl){dateEl.textContent=`تاريخ اليوم: ${new Date().toLocaleDateString("ar-SA",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}`;}

function autoResize(el){el.style.height="auto";el.style.height=el.scrollHeight+"px";}

function createRow(section){
  const row=document.createElement("div");
  row.className="card";
  const fields={
    tasks:[
      {label:"الوقت",type:"time"},
      {label:"المشروع / الموقع",type:"textarea"},
      {label:"المهمة المنجزة",type:"textarea"},
      {label:"كم أنجزت",type:"textarea"},
    ],
    expenses:[
      {label:"المبلغ المدفوع",type:"textarea"},
      {label:"الموقع",type:"select",options:["البدراني","القبلتين حضرم","القبلتين وقف البري","الوكالة الذهبية","قربان","مصروفات عامة","الفندق السحمان","ينبع"]},
      {label:"تفاصيل المدفوعات",type:"textarea"},
      {label:"لمن تم التسديد",type:"textarea"},
      {label:"إرفاق ملف",type:"file",accept:".pdf,.png,.jpg,.jpeg"},
    ],
    feedback:[
      {label:"الصعوبات",type:"textarea"},
      {label:"الاحتياجات",type:"textarea"},
      {label:"الاقتراحات",type:"textarea"},
    ],
  };
  fields[section].forEach(f=>{
    const field=document.createElement("div");
    field.className="field";
    const label=document.createElement("label");
    label.textContent=f.label;
    let input;
    if(f.type==="textarea"){input=document.createElement("textarea");input.oninput=()=>autoResize(input);}
    else if(f.type==="select"){input=document.createElement("select");f.options.forEach(o=>{const op=document.createElement("option");op.value=o;op.textContent=o;input.appendChild(op);});}
    else{input=document.createElement("input");input.type=f.type;if(f.accept)input.accept=f.accept;}
    field.append(label,input);row.append(field);
  });
  const del=document.createElement("button");
  del.className="del";del.textContent="حذف";del.onclick=()=>row.remove();
  row.append(del);
  return row;
}

function addRow(section){
  document.getElementById(`${section}-body`).appendChild(createRow(section));
}

function initPage(section,url){
  addRow(section);
  const sendBtn=document.querySelector(`#send-${section}`);
  const statusEl=document.getElementById("status");
  sendBtn.addEventListener("click",async()=>{
    const inputs=document.querySelectorAll(`#${section}-body input, #${section}-body textarea, #${section}-body select`);
    const data={};
    inputs.forEach(i=>{data[i.previousSibling.textContent]=i.value||"";});
    sendBtn.disabled=true;statusEl.textContent="📤 جاري الإرسال...";
    try{
      const res = await fetch(url, {
    method: "POST",
    mode: "no-cors", // ← أضيفي هذا السطر هنا
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
      statusEl.textContent=res.ok?"✅ تم الإرسال بنجاح.":"❌ حدث خطأ أثناء الإرسال.";
      statusEl.className=res.ok?"status success":"status error";
    }catch(e){statusEl.textContent="❌ تعذر الاتصال بـ Google Sheets.";statusEl.className="status error";}
    sendBtn.disabled=false;
  });
}
