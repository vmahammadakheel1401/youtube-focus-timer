const watchInput = document.getElementById("watchTime");
const studyInput = document.getElementById("studyTime");
const endTimeInput = document.getElementById("endTime");

const durationBox = document.getElementById("durationBox");
const endTimeBox = document.getElementById("endTimeBox");

const saveBtn = document.getElementById("saveBtn");
const status = document.getElementById("status");

// ---------------- Load ----------------

chrome.storage.local.get(
[
"watchDuration",
"blockDuration",
"closeMode",
"timerMode",
"endTime"
],
(data)=>{

watchInput.value=data.watchDuration||15;

studyInput.value=data.blockDuration||30;

endTimeInput.value=data.endTime||"21:00";

const timerMode=data.timerMode||"duration";

document.querySelector(
`input[name="timerMode"][value="${timerMode}"]`
).checked=true;

toggleMode(timerMode);

const closeMode=data.closeMode||"continue";

document.querySelector(
`input[name="closeMode"][value="${closeMode}"]`
).checked=true;

}
);

// ---------------- Toggle ----------------

function toggleMode(mode){

if(mode==="duration"){

durationBox.style.display="block";

endTimeBox.style.display="none";

}else{

durationBox.style.display="none";

endTimeBox.style.display="block";

}

}

document
.querySelectorAll('input[name="timerMode"]')
.forEach(radio=>{

radio.addEventListener("change",()=>{

toggleMode(radio.value);

});

});

// ---------------- Save ----------------

saveBtn.addEventListener("click",()=>{

const watch=parseInt(watchInput.value);

const study=parseInt(studyInput.value);

const timerMode=document.querySelector(
'input[name="timerMode"]:checked'
).value;

const closeMode=document.querySelector(
'input[name="closeMode"]:checked'
).value;

chrome.storage.local.set({

watchDuration:watch,

blockDuration:study,

timerMode:timerMode,

endTime:endTimeInput.value,

closeMode:closeMode

},()=>{

status.textContent="Saved!";

setTimeout(()=>{

status.textContent="";

},1500);

});

});