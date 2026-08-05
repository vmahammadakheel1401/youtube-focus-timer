async function update(){

    const data=await chrome.storage.local.get("blockEndsAt");

    const left=Math.max(0,data.blockEndsAt-Date.now());

    const m=Math.floor(left/60000);

    const s=Math.floor((left%60000)/1000);

    document.getElementById("timer").textContent=
    `${m}:${String(s).padStart(2,"0")}`;

    if(left<=0){

        location.href="https://youtube.com";

    }

}

update();

setInterval(update,1000);