console.log("=== Service Worker Loaded ===");

// ======================
// HELPERS
// ======================

function now() {
    return Date.now();
}

async function getData() {
    return await chrome.storage.local.get([
        "watchEndsAt",
        "blockEndsAt",
        "watchDuration",
        "blockDuration",
        "timerMode",
        "endTime"
    ]);
}

async function saveData(data) {
    return await chrome.storage.local.set(data);
}

// ======================
// BLOCK CHECK
// ======================

async function isBlocked() {

    const data = await getData();

    if (!data.blockEndsAt)
        return false;

    return now() < data.blockEndsAt;
}

// ======================
// START TIMER
// ======================

async function startWatchTimer() {

    const settings = await getData();

    const watchDuration = (settings.watchDuration || 15) * 60 * 1000;

    if (settings.watchEndsAt && settings.watchEndsAt > now())
        return;

    if (settings.watchEndsAt) {
        await finishWatchTimer();
        return;
    }

    let end;

    if (settings.timerMode === "endtime") {
        const parts = (settings.endTime || "21:00").split(":");
        end = new Date();
        end.setHours(parseInt(parts[0]));
        end.setMinutes(parseInt(parts[1]));
        end.setSeconds(0);
        end.setMilliseconds(0);

        if (end.getTime() <= now()) {
            end.setDate(end.getDate() + 1);
        }

        end = end.getTime();
    } else {
        end = now() + watchDuration;
    }

    await saveData({
        watchEndsAt: end
    });

    chrome.alarms.create("watchFinished", {
        when: end
    });

    console.log("Timer Started");
}

async function finishWatchTimer() {
    chrome.alarms.clear("watchFinished");

    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
        if (tab.url && tab.url.includes("youtube.com")) {
            chrome.tabs.remove(tab.id);
        }
    }

    const settings = await getData();
    const blockMs = (settings.blockDuration || 30) * 60 * 1000;

    await saveData({
        watchEndsAt: null,
        blockEndsAt: now() + blockMs
    });

    chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Time's Up!",
        message: "Study Time Started."
    });

    console.log("Study Block Started");
}

// ======================
// WHEN TAB CHANGES
// ======================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    if (changeInfo.status !== "complete")
        return;

    if (!tab.url)
        return;

    if (!tab.url.includes("youtube.com"))
        return;

    if (await isBlocked()) {

        chrome.tabs.update(tabId, {
            url: chrome.runtime.getURL("blocked.html")
        });

        return;
    }

    await startWatchTimer();

});

// ======================
// TIMER FINISHED
// ======================

chrome.alarms.onAlarm.addListener(async (alarm) => {

    if (alarm.name !== "watchFinished")
        return;

    await finishWatchTimer();

});
chrome.runtime.onMessage.addListener(async (msg) => {

   if(msg.action==="resetTimer"){

    chrome.alarms.clear("watchFinished");

    const settings = await getData();

    let end;

    if(settings.timerMode === "endtime"){

        const parts = (settings.endTime || "21:00").split(":");

        end = new Date();

        end.setHours(parseInt(parts[0]));
        end.setMinutes(parseInt(parts[1]));
        end.setSeconds(0);
        end.setMilliseconds(0);

        if(end.getTime() <= Date.now()){
            end.setDate(end.getDate() + 1);
        }

        end = end.getTime();

    }else{

        end =
        Date.now() +
        (settings.watchDuration || 15) * 60 * 1000;

    }

    await chrome.storage.local.set({
        watchEndsAt: end
    });

    chrome.alarms.create("watchFinished",{
        when:end
    });

    console.log("Timer Reset");

}

});