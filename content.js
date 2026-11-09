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
<div id="timerHeader" style="font-size:16px;margin-bottom:8px;cursor:grab;touch-action:none;">
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
border:none;
border-radius:8px;
cursor:pointer;">
🔄 Reset
</button>
`;

document.documentElement.appendChild(timer);

const header = document.getElementById("timerHeader");
let dragOffsetX = 0;
let dragOffsetY = 0;

function clampPosition(left, top) {
    return {
        left: Math.max(0, Math.min(left, window.innerWidth - timer.offsetWidth)),
        top: Math.max(0, Math.min(top, window.innerHeight - timer.offsetHeight))
    };
}

chrome.storage.local.get("timerPosition").then(({ timerPosition }) => {
    if (!timerPosition || !timer.isConnected) {
        return;
    }

    const position = clampPosition(timerPosition.left, timerPosition.top);
    timer.style.left = `${position.left}px`;
    timer.style.top = `${position.top}px`;
    timer.style.right = "auto";
});

header.addEventListener("pointerdown", (event) => {
    const rect = timer.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    header.style.cursor = "grabbing";
    header.setPointerCapture(event.pointerId);
});

header.addEventListener("pointermove", (event) => {
    if (!header.hasPointerCapture(event.pointerId)) {
        return;
    }

    const position = clampPosition(
        event.clientX - dragOffsetX,
        event.clientY - dragOffsetY
    );
    timer.style.left = `${position.left}px`;
    timer.style.top = `${position.top}px`;
    timer.style.right = "auto";
});

header.addEventListener("pointerup", async (event) => {
    if (!header.hasPointerCapture(event.pointerId)) {
        return;
    }

    header.releasePointerCapture(event.pointerId);
    header.style.cursor = "grab";
    const rect = timer.getBoundingClientRect();
    await chrome.storage.local.set({
        timerPosition: { left: rect.left, top: rect.top }
    });
});

window.addEventListener("resize", () => {
    const rect = timer.getBoundingClientRect();
    const position = clampPosition(rect.left, rect.top);
    timer.style.left = `${position.left}px`;
    timer.style.top = `${position.top}px`;
    timer.style.right = "auto";
});

const timerInterval = setInterval(async () => {
    const data = await chrome.storage.local.get("watchEndsAt");
    const display = document.getElementById("countdown");

    if (!display) {
        clearInterval(timerInterval);
        return;
    }

    if (data.watchEndsAt) {
        const left = Math.max(0, data.watchEndsAt - Date.now());
        const minutes = Math.floor(left / 60000);
        const seconds = Math.floor((left % 60000) / 1000);
        display.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
        return;
    }

    display.textContent = "--:--";
}, 1000);

document.getElementById("resetTimer").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "resetTimer" });
});
