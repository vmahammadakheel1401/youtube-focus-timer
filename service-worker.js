console.log("=== Service Worker Loaded ===");

// ======================
// CONFIG
// ======================
let WATCH_DURATION;
let BLOCK_DURATION;

// ======================
// STORAGE KEYS
// ======================
const KEYS = {
    watchEndsAt: "watchEndsAt",
    blockEndsAt: "blockEndsAt",
    pausedRemaining: "pausedRemaining"
};

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
        "pausedRemaining",
        "watchDuration",
        "blockDuration",
        "closeMode",
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
// WATCH TIMER RUNNING?
// ======================

async function watchRunning() {

    const data = await getData();

    if (!data.watchEndsAt)
        return false;

    return now() < data.watchEndsAt;
}

// ======================
// START TIMER
// ======================

async function startWatchTimer() {

    const settings = await getData();

    WATCH_DURATION = (settings.watchDuration || 15) * 60 * 1000;
    BLOCK_DURATION = (settings.blockDuration || 30) * 60 * 1000;

    const running = await watchRunning();

    if (running)
        return;

    let end;

if (settings.timerMode === "endtime") {

    const nowDate = new Date();

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

    end = now() + WATCH_DURATION;

}

    await saveData({
        watchEndsAt: end
    });

    chrome.alarms.create("watchFinished", {
        when: end
    });

    console.log("Timer Started");
}

// ======================
// PAUSE TIMER
// ======================

async function pauseWatchTimer() {

    const data = await getData();

    if (!data.watchEndsAt)
        return;

    const remaining = data.watchEndsAt - now();

    if (remaining <= 0)
        return;

    await saveData({
        pausedRemaining: remaining,
        watchEndsAt: null
    });

    chrome.alarms.clear("watchFinished");

    console.log("Timer Paused");
}

// ======================
// RESUME TIMER
// ======================

async function resumeWatchTimer() {

    const data = await getData();

    if (!data.pausedRemaining)
        return false;

    const end = now() + data.pausedRemaining;

    await saveData({
        watchEndsAt: end,
        pausedRemaining: null
    });

    chrome.alarms.create("watchFinished", {
        when: end
    });

    console.log("Timer Resumed");

    return true;
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

    const settings = await getData();

    if (settings.closeMode === "pause") {

        const resumed = await resumeWatchTimer();

        if (!resumed)
            await startWatchTimer();

    } else {

        await startWatchTimer();

    }

});

// ======================
// WHEN LAST YOUTUBE TAB CLOSES
// ======================

chrome.tabs.onRemoved.addListener(async () => {

    const settings = await getData();

    if (settings.closeMode !== "pause")
        return;

    const tabs = await chrome.tabs.query({});

    const youtubeTabs = tabs.filter(tab =>
        tab.url &&
        tab.url.includes("youtube.com")
    );

    if (youtubeTabs.length === 0) {

        await pauseWatchTimer();

    }

});

// ======================
// TIMER FINISHED
// ======================

chrome.alarms.onAlarm.addListener(async (alarm) => {

    if (alarm.name !== "watchFinished")
        return;

    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {

        if (tab.url &&
            tab.url.includes("youtube.com")) {

            chrome.tabs.remove(tab.id);

        }

    }

    const settings = await getData();
    const blockMs = (settings.blockDuration || 30) * 60 * 1000;
    const blockEnds = now() + blockMs;

    await saveData({

        watchEndsAt: null,
        pausedRemaining: null,
        blockEndsAt: blockEnds

    });

    chrome.notifications.create({

        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Time's Up!",
        message: "Study Time Started."

    });

    console.log("Study Block Started");

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

    if(msg.action==="pauseTimer"){

    await pauseWatchTimer();

}
if(msg.action==="resumeTimer"){

    await resumeWatchTimer();

}

});