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

let tooltip;
let mouseX;
let mouseY;

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
        let blankStyles = {
            gridArea: `2 / ${i + 2} / ${24 * 60} / ${i + 2}`,
            borderLeft: "1px solid rgba(0, 0, 0, 0.05)",
            width: "100%",
            height: "100%",
        }
        Object.entries(blankStyles).forEach(([key, value]) => blank.style[key] = value);
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
        time.style.gridArea = `${i + 1} / 1 / ${i + 2} / 1`;
        times.push(time);
        
        time.textContent = neatTime(i);

        div.appendChild(time);

        let hr = document.createElement("div");
        hr.style.gridArea = `${i + 2} / 1 / ${i + 2} / 9`;
        hr.style.width = "100%";
        hr.style.height = "100%";
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

    (data || []).forEach((event, idx) => {
        let eventDiv = document.createElement("div");
        let styles = {
            gridArea: `${event.start + 2} / ${event.day + 2} / ${event.end + 2} / ${event.day + 2}`,
            backgroundColor: event.color || randCol(),
            boxShadow: `0 0 ${heightWidthRatio < ASPECT_RATIO ? "0.5dvw" : "0.5dvh"} rgba(0, 0, 0, 0.4)`,
            width: "65%",
            height: "100%",
            borderRadius: heightWidthRatio < ASPECT_RATIO ? "0.5dvw" : "0.5dvh",
        }
        Object.entries(styles).forEach(([key, value]) => eventDiv.style[key] = value);

        let datasets = {
            name: event.name,
            eid: idx,
            start: event.start,
            end: event.end,
            day: event.day,
            duration: event.end - event.start,
        }
        Object.entries(datasets).forEach(([key, value]) => eventDiv.dataset[key] = value);

        eventDiv.addEventListener("mousemove", e => moveTooltip(event, idx));

        div.appendChild(eventDiv);
    })

    Array.from(div.querySelectorAll(`div[data-eid]`)).forEach((eventDiv, idx) => {
        if (!eventDiv) return;

        let day = eventDiv.dataset.day;
        let start = eventDiv.dataset.start;
        let end = eventDiv.dataset.end;
        let eid = eventDiv.dataset.eid;
        let duration = eventDiv.dataset.duration;

        let sameTimeEvents = Array.from(div.querySelectorAll(`div[data-day="${day}"]`))
            .filter(e => Number(e.dataset.start) <= Number(end) && Number(e.dataset.end) >= Number(start) && Number(e.dataset.eid) > Number(eid));

        let percWidth = Number(eventDiv.style.width.replace("%", ""));
        let newWidth = percWidth / (sameTimeEvents.length + 1);
        eventDiv.style.width = `${newWidth - 1}%`;
        eventDiv.style.marginRight = `${percWidth - newWidth + 1}%`;

        sameTimeEvents.forEach(e => {
            e.style.width = `${percWidth - newWidth - 1}%`;
            e.style.marginLeft = `${newWidth + 1}%`;
        });        

        console.log(`Overlap events: ` + sameTimeEvents);
    })

    div.addEventListener("mousemove", (e) => {
        mouseX = e.pageX;
        mouseY = e.pageY;
        let target = e.target;
        if (target.dataset.eid) return;
        if (tooltip) tooltip.remove();
        tooltip = undefined;
    });

    return true;
}

function moveTooltip(event, eID) {
    if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.id = "tooltip";
        document.body.appendChild(tooltip);
    }

    let tooltipStyles = {
        position: "fixed",
        left: `${mouseX}px`,
        top: `${mouseY}px`,
        backgroundColor: document.querySelector(`div#${DIV_ID} div[data-eid="${eID}"]`).style.backgroundColor,
        borderRadius: "0.5dvh",
        padding: "0.5dvh",
        zIndex: 9999,
        boxShadow: `0 0 1dvh rgb(10, 10, 10)`,
        border: "1px solid rgb(0, 0, 0)",
        minWidth: "10dvh",
        minHeight: "10dvh",
        pointerEvents: "none",
        userSelect: "none"
    }
    Object.entries(tooltipStyles).forEach(([key, value]) => tooltip.style[key] = value);

    tooltip.innerHTML = "";

    createElement("h2", {tc: event.name, append: tooltip});
    createElement("p", {tc: event.desc, append: tooltip});
    createElement("p", {tc: `${neatTime(event.start)} - ${neatTime(event.end)}`, append: tooltip});

    let width = tooltip.getBoundingClientRect().width;
    let height = tooltip.getBoundingClientRect().height;
    if (mouseX + width > window.innerWidth) tooltip.style.left = `${mouseX - width}px`;
    if (mouseY + height > window.innerHeight) tooltip.style.top = `${mouseY - height}px`;
}

function pad(number, digits) {return String(number).padStart(digits, "0");}
function randCol() {return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`; }
function neatTime(time) {return `${pad(Math.floor(time / 60), 2)}:${pad(time % 60, 2)}`}

function createElement(element, options = {}) {
    const el = document.createElement(element);

    if (options.textContent || options.tc) el.textContent = options.textContent || options.tc;
    if (options.innerHTML) el.innerHTML = options.innerHTML;
    if (options.classname) el.classList.add(options.classname);
    if (options.classes?.length > 0) {
        const validClasses = options.classes.filter(cls => typeof cls === 'string' && cls.trim());
        el.classList.add(...validClasses);  // Safe against elements [web:25]
    }
    if (options.id) el.id = options.id;
    if (options.name) el.name = options.name;
    if (options.styles) Object.assign(el.style, options.styles);
    if (options.append) options.append.appendChild(el);

    return el;
}

document.addEventListener("DOMContentLoaded", async () => {
    let data = await fetch(`/api/getUser/${window.location.pathname.split("/").pop()}`).then(res => res.json() || []);
    if (!createTimetable(data)) 
        console.error("An error occurred the timetable creator had to exit early.");
    else console.log("Timetable created successfully!");
})