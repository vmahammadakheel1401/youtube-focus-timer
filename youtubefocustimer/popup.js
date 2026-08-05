const watchInput = document.getElementById("watchTime");
const studyInput = document.getElementById("studyTime");
const saveBtn = document.getElementById("saveBtn");
const status = document.getElementById("status");

// Load saved values
chrome.storage.local.get(
    ["watchDuration", "blockDuration", "closeMode"],
    (data) => {

        watchInput.value = data.watchDuration || 15;
        studyInput.value = data.blockDuration || 30;

        const mode = data.closeMode || "continue";

        const radio = document.querySelector(
            `input[name="closeMode"][value="${mode}"]`
        );

        if (radio) {
            radio.checked = true;
        }

    }
);

// Save values
saveBtn.addEventListener("click", () => {

    const watch = parseInt(watchInput.value);
    const study = parseInt(studyInput.value);

    const closeMode = document.querySelector(
        'input[name="closeMode"]:checked'
    ).value;

    chrome.storage.local.set({

        watchDuration: watch,
        blockDuration: study,
        closeMode: closeMode

    }, () => {

        status.textContent = "Saved!";

        setTimeout(() => {

            status.textContent = "";

        }, 1500);

    });

});