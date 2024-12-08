let maxRingsReached = 20; // Track the maximum rings reached so far

// Language support
const translations = {
    en: {
        title: "Chain Ring Calculator",
        labelRings: "How many rings in the chain? (Leave empty to calculate):",
        labelCuts: "How many cuts are allowed? (Leave empty to calculate):",
        startButton: "Start Calculation",
        expandButton: "Expand Search",
        logsTitle: "Logs",
        resultsTitle: "Results",
        provideInput: "Please provide either the number of rings or the number of cuts.",
        testing: "Testing with {rings} rings and {cuts} cuts...",
        validSolution: "Valid solution found with {rings} rings: Removed Rings: {removed}",
        expanding: "Expanding search to {maxRings} rings...",
        optimalSolution: "Optimal Solution: Rings: {rings}, Removed: {removed}, Segments: {segments}",
        solution: "Solution {index}: Rings: {rings}, Removed: {removed}, Segments: {segments}",
        placeholderRings: "Number of Rings",
        placeholderCuts: "Number of Cuts",
    },
    he: {
        title: "מחשבון טבעות שרשרת",
        labelRings: "כמה טבעות יש בשרשרת? (השאר ריק לחישוב):",
        labelCuts: "כמה חיתוכים אפשריים? (השאר ריק לחישוב):",
        startButton: "התחל חישוב",
        expandButton: "הרחב חיפוש",
        logsTitle: "יומן",
        resultsTitle: "תוצאות",
        provideInput: "נא לספק מספר טבעות או מספר חיתוכים.",
        testing: "בודק {rings} טבעות ו-{cuts} חיתוכים...",
        validSolution: "נמצאה פתרון תקין עם {rings} טבעות: טבעות שהוסרו: {removed}",
        expanding: "מרחיב חיפוש ל-{maxRings} טבעות...",
        optimalSolution: "פתרון מיטבי: טבעות: {rings}, הוסרו: {removed}, קטעים: {segments}",
        solution: "פתרון {index}: טבעות: {rings}, הוסרו: {removed}, קטעים: {segments}",
        placeholderRings: "מספר טבעות",
        placeholderCuts: "מספר חיתוכים",
    },
};

// Default language
let currentLanguage = "en";

// Logging utility to add entries to the log container
const addLog = (message, containerId = "logs") => {
    const logContainer = document.getElementById(containerId);
    const logEntry = document.createElement("div");
    logEntry.classList.add("log-entry");
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight; // Scroll to the bottom
};

// Localized string formatter
const localize = (key, variables = {}) => {
    let str = translations[currentLanguage][key];
    for (const [k, value] of Object.entries(variables)) {
        str = str.replace(`{${k}}`, value);
    }
    return str;
};

// Main calculator logic
const calculateChains = (rings, cuts, maxRings) => {
    const results = [];
    const minRings = cuts ? cuts * 2 + 1 : 1;

    const simulateCut = (totalRings, cutIndices) => {
        let segments = [];
        let removed = [];
        let start = 1;

        cutIndices.forEach((cut) => {
            if (cut > start) segments.push([...Array(cut - start).keys()].map(i => i + start));
            removed.push([cut]);
            start = cut + 1;
        });

        if (start <= totalRings) segments.push([...Array(totalRings - start + 1).keys()].map(i => i + start));

        removed.forEach(ring => {
            const idx = segments.findIndex(seg => seg[0] > ring[0]);
            if (idx === -1) segments.push(ring);
            else segments.splice(idx, 0, ring);
        });

        return { segments, removed };
    };

    const canGiveRings = (segments, target, used) => {
        if (target === 0) return true;
        if (segments.length === 0) return false;

        for (let i = 0; i < segments.length; i++) {
            if (used.has(i)) continue;
            const len = segments[i].length;
            if (len > target) continue;
            used.add(i);
            if (canGiveRings(segments, target - len, used)) return true;
            used.delete(i);
        }
        return false;
    };

    for (let r = Math.max(minRings, rings || 0); r <= maxRings; r++) {
        const maxCuts = cuts || Math.floor(r / 2);
        for (let c = 1; c <= maxCuts; c++) {
            addLog(localize("testing", { rings: r, cuts: c }));

            for (let comb of combinations([...Array(r).keys()].map(i => i + 1), c)) {
                const { segments, removed } = simulateCut(r, comb);
                let valid = true;

                for (let day = 1; day <= r; day++) {
                    const used = new Set();
                    if (!canGiveRings(segments, day, used)) {
                        valid = false;
                        break;
                    }
                }

                if (valid) {
                    results.push({ rings: r, segments, removed });
                    addLog(localize("validSolution", { rings: r, removed: removed.flat() }));
                }
            }
        }
    }

    return results;
};

// Combinations utility
const combinations = (arr, k) => {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    const [head, ...tail] = arr;
    const withHead = combinations(tail, k - 1).map(c => [head, ...c]);
    const withoutHead = combinations(tail, k);
    return withHead.concat(withoutHead);
};

// Group results by ring count
const groupResultsByRingCount = (results) => {
    return results.reduce((acc, result) => {
        const { rings } = result;
        if (!acc[rings]) {
            acc[rings] = [];
        }
        acc[rings].push(result);
        return acc;
    }, {});
};

// Display results
const displayResults = (results, container, groupTitle) => {
    const groupedResults = groupResultsByRingCount(results);

    const groupHeader = document.createElement("h3");
    groupHeader.textContent = groupTitle;
    container.appendChild(groupHeader);

    Object.entries(groupedResults).forEach(([ringCount, ringResults]) => {
        const optimal = ringResults[0];
        let segments = optimal.segments;
        if (currentLanguage === "he") {
            // Reverse segments for proper Hebrew display
            segments = JSON.stringify(optimal.segments.map(arr => arr.reverse()));
        } else {
            segments = JSON.stringify(optimal.segments);
        }

        // Create a container for this group of results
        const resultGroup = document.createElement("div");
        resultGroup.classList.add("result-group");

        // Add the optimal solution entry
        const resultEntry = document.createElement("div");
        resultEntry.classList.add("log-entry");
        resultEntry.innerHTML = localize("optimalSolution", {
            rings: optimal.rings,
            removed: optimal.removed.flat(),
            segments,
        });
        resultGroup.appendChild(resultEntry);

        // Add "Show More" button for this specific group
        const showMoreBtn = document.createElement("button");
        showMoreBtn.textContent = localize("expandButton");
        showMoreBtn.addEventListener("click", () => {
            ringResults.slice(1).forEach((result, index) => {
                const entry = document.createElement("div");
                entry.classList.add("log-entry");
                entry.innerHTML = localize("solution", {
                    index: index + 2,
                    rings: result.rings,
                    removed: result.removed.flat(),
                    segments: JSON.stringify(
                        currentLanguage === "he" ? result.segments.map(arr => arr.reverse()) : result.segments
                    ),
                });
                resultGroup.appendChild(entry);
            });
            showMoreBtn.style.display = "none"; // Hide button after expansion
        });
        resultGroup.appendChild(showMoreBtn);

        // Append the entire group to the main container
        container.appendChild(resultGroup);
    });
};

// Language switcher
document.getElementById("language-select").addEventListener("change", (event) => {
    currentLanguage = event.target.value;
    updateLanguage();
});

// Update UI with the selected language
const updateLanguage = () => {
    const t = translations[currentLanguage];
    document.getElementById("title").textContent = t.title;
    document.getElementById("label-rings").textContent = t.labelRings;
    document.getElementById("label-cuts").textContent = t.labelCuts;
    document.getElementById("start-btn").textContent = t.startButton;
    document.getElementById("expand-btn").textContent = t.expandButton;
    document.getElementById("logs-title").textContent = t.logsTitle;
    document.getElementById("results-title").textContent = t.resultsTitle;
    document.getElementById("rings").placeholder = t.placeholderRings;
    document.getElementById("cuts").placeholder = t.placeholderCuts;
};

// Event listener for form submission
document.getElementById("start-btn").addEventListener("click", () => {
    const ringsInput = document.getElementById("rings").value;
    const cutsInput = document.getElementById("cuts").value;

    const rings = parseInt(ringsInput) || null;
    const cuts = parseInt(cutsInput) || null;

    if (!rings && !cuts) {
        addLog(localize("provideInput"));
        return;
    }

    maxRingsReached = rings || 20; // Reset the maximum rings reached

    addLog(localize("starting"));
    const results = calculateChains(rings, cuts, maxRingsReached);

    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = ""; // Clear previous results
    displayResults(results, resultsContainer, localize("resultsTitle"));
});

// Expand search functionality
document.getElementById("expand-btn").addEventListener("click", () => {
    const cutsInput = document.getElementById("cuts").value;
    const cuts = parseInt(cutsInput) || null;

    const newMaxRings = maxRingsReached + 10; // Increment search range
    addLog(localize("expanding", { maxRings: newMaxRings }));

    const results = calculateChains(maxRingsReached + 1, cuts, newMaxRings);

    const resultsContainer = document.getElementById("results");
    displayResults(results, resultsContainer, `${localize("resultsTitle")} (up to ${newMaxRings})`);
    maxRingsReached = newMaxRings; // Update maximum rings reached
});

// Initialize default language
updateLanguage();
