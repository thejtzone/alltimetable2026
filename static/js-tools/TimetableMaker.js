const DIV_ID = "timetable";
const ASPECT_RATIO = 3 / 5;

function isStringified(data) {
    if (typeof str !== "string") return false;
    try {
        JSON.parse(str);
        return true;   // valid JSON text
    } catch {
        return false;  // not valid JSON text
    }
}

function createTimetable(data) {
    console.log(`Creating timetable using data: ${String(data)}`);

    const div = document.querySelector(`div#${DIV_ID}`);
    if (!div) return false;

    data = isStringified(data || "[]") ? JSON.parse(data || "[]") : (data || []);
    const earliest = data.length > 0 ? data.sort((a, b) => a.start - b.start)[0].start : "none";
    const latest = data.length > 0 ? data.sort((a, b) => b.end - a.end)[0].end : "none";

    div.innerHTML = "";

    const width = Math.min(div.clientWidth, window.innerWidth);
    const height = div.clientHeight;
    const heightWidthRatio = height / width;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    if (heightWidthRatio < ASPECT_RATIO) {
        div.style.height = `${(width * ASPECT_RATIO) / screenWidth * 100}dvw`;
        div.style.width = `${width / screenWidth * 100}dvw`;
    }
    else {
        div.style.width = `${(height / ASPECT_RATIO) / screenHeight * 100}dvh`;
        div.style.height = `${height / screenHeight * 100}dvh`;
    }

    let divStyles = {
        display: "grid",
        gridTemplateColumns: `min-content 0.5fr repeat(5, 1fr) 0.5fr`,
        gridTemplateRows: `min-content repeat(${24 * 60}, min-content)`,
        justifyItems: "center",
        alignItems: "center",
        gridColumnGap: heightWidthRatio < ASPECT_RATIO ? "0.5dvw" : "0.5dvh",
    }
    Object.entries(divStyles).forEach(([key, value]) => div.style[key] = value);

    const blanks = []
    for (let i = 0; i < 7; i++) {
        let blank = document.createElement("div");
        blank.style.gridArea = `2 / ${i + 2} / ${24 * 60} / ${i + 2}`;
        blank.style.borderLeft = "1px solid rgba(0, 0, 0, 0.05)";
        blank.style.width = "100%";
        blanks.push(blank);
        div.appendChild(blank);
    }

    const times = [];
    for (let i = 0; i < 24 * 60; i++) {
        if (i % 30 != 0) continue;

        // Filter out times before 8am unless there is an event earlier than 8am
        if (i < 8 * 60) {
            if (earliest == "none") continue;
            if (i < earliest) continue;
        }

        // Filter out times after 7pm unless there is an event later than 7pm
        if (i > 19 * 60) {
            if (latest == "none") continue;
            if (i > latest) continue;
        }

        let time = document.createElement("div");
        time.style.gridArea = `${i + 2} / 1 / ${i + 2} / 1`;
        times.push(time);
        
        time.textContent = `${pad(Math.floor(i / 60), 2)}:${pad(i % 60, 2)}`;

        div.appendChild(time);

        let hr = document.createElement("div");
        hr.style.gridArea = `${i + 2} / 1 / ${i + 2} / 9`;
        hr.style.width = "100%";
        hr.style.borderBottom = "1px solid rgba(0, 0, 0, 0.1)";
        div.appendChild(hr);
    }
    Array.from(div.children).at(-1).style.borderBottom = "";

    const headers = [];
    for (let i = 0; i < 8; i++) {
        let header = document.createElement("div");
        header.style.gridArea = `1 / ${i + 1} / 1 / ${i + 1}`;
        header.style.fontWeight = "bold";
        header.style.textAlign = "center";
        headers.push(header);

        header.textContent = ["Time", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i];
        header.style.borderBottom = "1px solid rgba(0, 0, 0, 0.4)";
        header.style.width = "100%";
        div.appendChild(header);
    }

    (data || []).forEach(event => {
        let eventDiv = document.createElement("div");
        let styles = {
            gridArea: `${event.start + 2} / ${event.day + 2} / ${event.end + 2} / ${event.day + 2}`,
            backgroundColor: event.color || randCol(),
            // border: "1px solid black",
            boxShadow: `0 0 ${heightWidthRatio < ASPECT_RATIO ? "0.5dvw" : "0.5dvh"} rgba(0, 0, 0, 0.4)`,
            width: "65%",
            borderRadius: heightWidthRatio < ASPECT_RATIO ? "0.5dvw" : "0.5dvh",
        }
        Object.entries(styles).forEach(([key, value]) => eventDiv.style[key] = value);

        div.appendChild(eventDiv);
    })

    return true;
}

function pad(number, digits) {return String(number).padStart(digits, "0");}
function randCol() {return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`; }

document.addEventListener("DOMContentLoaded", async () => {
    let data = await fetch(`/api/getUser/${window.location.pathname.split("/").pop()}`).then(res => res.json() || []);
    if (!createTimetable(data)) 
        console.error("An error occurred the timetable creator had to exit early.");
    else console.log("Timetable created successfully!");
})