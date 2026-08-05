// Prevent duplicate injection
if (document.getElementById("yt-focus-timer")) {
    throw new Error("Timer already exists");
}

const timer = document.createElement("div");
timer.id = "yt-focus-timer";

timer.style.position = "fixed";
timer.style.top = "20px";
timer.style.right = "20px";
timer.style.background = "#111827";
timer.style.color = "white";
timer.style.padding = "15px";
timer.style.borderRadius = "14px";
timer.style.fontFamily = "Arial";
timer.style.zIndex = "999999";
timer.style.boxShadow = "0 8px 30px rgba(0,0,0,.35)";
timer.style.minWidth = "180px";
timer.style.textAlign = "center";

timer.innerHTML = `
<div style="font-size:16px;margin-bottom:8px;">
🎯 YouTube Time
</div>

<div id="countdown"
style="
font-size:34px;
font-weight:bold;
margin-bottom:12px;">
--:--
</div>

<button id="resetTimer"
style="
padding:7px 12px;
margin-right:8px;
border:none;
border-radius:8px;
cursor:pointer;">
🔄 Reset
</button>

<button id="pauseTimer"
style="
padding:7px 12px;
border:none;
border-radius:8px;
cursor:pointer;">
⏸ Pause
</button>
`;

document.documentElement.appendChild(timer);

let paused = false;

// ---------------- Timer ----------------

const timerInterval = setInterval(async () => {

    try {

        const data = await chrome.storage.local.get([
            "watchEndsAt",
            "pausedRemaining"
        ]);

        const display = document.getElementById("countdown");

        if (!display) {
            clearInterval(timerInterval);
            return;
        }

        // Paused
        if (data.pausedRemaining && !data.watchEndsAt) {

            let left = data.pausedRemaining;

            let m = Math.floor(left / 60000);
            let s = Math.floor((left % 60000) / 1000);

            display.innerHTML =
                `${m}:${String(s).padStart(2,"0")}`;

            paused = true;
            document.getElementById("pauseTimer").innerHTML = "▶ Resume";
            return;
        }

        // Running
        if (data.watchEndsAt) {

            let left = Math.max(
                0,
                data.watchEndsAt - Date.now()
            );

            let m = Math.floor(left / 60000);
            let s = Math.floor((left % 60000) / 1000);

            display.innerHTML =
                `${m}:${String(s).padStart(2,"0")}`;

            paused = false;
            document.getElementById("pauseTimer").innerHTML = "⏸ Pause";
            return;
        }

        display.innerHTML = "--:--";

    } catch (e) {

        clearInterval(timerInterval);

    }

}, 1000);

// ---------------- Reset ----------------

document
.getElementById("resetTimer")
.onclick = () => {

    chrome.runtime.sendMessage({
        action: "resetTimer"
    });

};

// ---------------- Pause / Resume ----------------

document
.getElementById("pauseTimer")
.onclick = () => {

    if (!paused) {

        chrome.runtime.sendMessage({
            action: "pauseTimer"
        });

    } else {

        chrome.runtime.sendMessage({
            action: "resumeTimer"
        });

    }

};