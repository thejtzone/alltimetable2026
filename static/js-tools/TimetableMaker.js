const DIV_ID = "timetable";
const ASPECT_RATIO = 3 / 5;

const isDarkMode = (x = getCookie("darkMode")) ? x === "true" : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (isDarkMode) document.querySelector("html").style.colorScheme = "dark";

function is24HourClock() {
  const dtf = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
  const parts = dtf.formatToParts(new Date());
  return !parts.some(p => p.type === 'dayPeriod');
}
const is12HourMode = (x = getCookie("12hr")) ? x === "true" : !is24HourClock();

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Sets a cookie with the given name, value, and expiration time.
 *
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {number} time - The expiration time of the cookie in seconds (negative for no expiration).
 */
function setCookie(name, value, time) {
    const d = new Date();
    d.setTime(d.getTime() + (time * 1000));
    const expires = `expires=${d.toUTCString()}`;
    time > 0 ? document.cookie = `${name}=${value};${expires};path=/`
        : document.cookie = `${name}=${value};path=/`;
}

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

    const divWidth = div.style.width || div.clientWidth;
    if (String(divWidth).endsWith("%")) {
        let perc = Number(divWidth.slice(0, -1));
        if (perc >= 100) perc = 98;
        div.style.width = `${perc}%`;
    } else if (String(divWidth).endsWith("dvw")) {
        let dvw = Number(divWidth.slice(0, -3));
        if (dvw >= 100) dvw = 98;
        div.style.width = `${dvw}dvw`;
    } else {
        let dw = Number(String(divWidth).replace("px", ""));
        let parentWidth = div.parentElement.clientWidth;
        let perc = dw / parentWidth * 100;
        if (perc >= 100) perc = 98;
        div.style.width = `${perc}%`;
    }

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
        div.style.maxHeight = `${(width * ASPECT_RATIO) / screenWidth * 100}dvw`;
        div.style.width = `${width / screenWidth * 100}dvw`;
    }
    else {
        div.style.width = `${(height / ASPECT_RATIO) / screenHeight * 100}dvh`;
        div.style.maxHeight = `${height / screenHeight * 100}dvh`;
    }

    let divStyles = {
        display: "grid",
        gridTemplateColumns: `min-content 0.5fr repeat(5, 1fr) 0.5fr`,
        // gridTemplateRows: `min-content repeat(${24 * 60 + 1}, minmax(0.05ch, min-content))`,
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
            borderLeft: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.05)",
            width: "100%",
            height: "100%",
        }
        Object.entries(blankStyles).forEach(([key, value]) => blank.style[key] = value);
        blank.dataset.type = "blank";
        blanks.push(blank);
        div.appendChild(blank);
    }

    const times = [];
    function blankTime(i) {
        let time = document.createElement("div");
        time.style.gridArea = `${i + 2} / 1 / ${i + 2} / 1`;
        time.dataset.type = "time-blank";
        times.push(time);
        div.appendChild(time);
    }

    for (let i = 0; i < 24 * 60; i++) {
        if (i % 30 != 0) { blankTime(i); continue; }

        // Filter out times before 8am unless there is an event earlier than 8am
        if (i < 8 * 60) {
            if (earliest == "none" || i < earliest - 30) 
                { blankTime(i); continue; }
        }

        // Filter out times after 7pm unless there is an event later than 7pm
        if (i > 19 * 60) {
            if (latest == "none" || i > latest + 30) 
                { blankTime(i); continue; }
        }

        let time = document.createElement("div");
        let timeStyles = {
            gridArea: `${i + 2} / 1 / ${i + 2} / 1`,
            textWrapMode: "nowrap",
            textAlign: "right",
            justifySelf: "right"
        }
        Object.entries(timeStyles).forEach(([key, value]) => time.style[key] = value);
        times.push(time);
        
        time.textContent = neatTime(i);
        time.dataset.shown = "true";
        time.dataset.type = "time-display";

        div.appendChild(time);

        let hr = document.createElement("div");
        hr.style.gridArea = `${i + 2} / 1 / ${i + 2} / 9`;
        hr.style.width = "100%";
        hr.style.height = "100%";
        hr.style.paddingBottom = "0.01ch";
        hr.dataset.shown = "true";
        hr.dataset.type = "time-hr";
        if (isDarkMode) hr.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
        else hr.style.borderBottom = "1px solid rgba(0, 0, 0, 0.1)";
        div.appendChild(hr);
    }
    // Array.from(div.querySelectorAll("div[data-shown]")).at(-1).style.borderBottom = "";
    let numEarliest = earliest != "none" ? earliest : 12 * 60;
    let numLatest = latest != "none" ? latest : 12 * 60;
    times.filter((t, i) => i >= Math.min(numEarliest, 8 * 60) - 60 && i <= Math.max(numLatest, 19 * 60) + 60)
        .forEach(t => t.style.minHeight = "0.035ch");

    const headers = [];
    for (let i = 0; i < 8; i++) {
        let header = document.createElement("div");
        header.style.gridArea = `1 / ${i + 1} / 1 / ${i + 1}`;
        header.style.fontWeight = "bold";
        header.style.textAlign = "center";
        headers.push(header);

        header.textContent = ["Time", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i];
        if (isDarkMode) header.style.borderBottom = "1px solid rgba(255, 255, 255, 0.4)";
        else header.style.borderBottom = "1px solid rgba(0, 0, 0, 0.4)";
        header.style.width = "100%";
        header.dataset.type = "header";
        div.appendChild(header);
    }

    function simulateText(text, styling = {}, fitWidth) {
        console.log(`Simulating to fit "${text}" into ${fitWidth}...`);

        const simulationDiv = document.createElement("div");
        simulationDiv.textContent = text;

        Object.entries(styling).forEach(([key, value]) => {
            simulationDiv.style[key] = value;
        });

        let simStyles = {
            position: "absolute",
            visibility: "hidden",
            whiteSpace: "nowrap",
            width: "min-content",
            minWidth: "min-content",
            maxWidth: "min-content"
        }
        Object.entries(simStyles).forEach(([key, value]) => simulationDiv.style[key] = value);

        document.body.appendChild(simulationDiv);

        // Early exit if it already fits
        let width = simulationDiv.offsetWidth;
        if (width <= fitWidth) {
            document.body.removeChild(simulationDiv);
            return text;
        }

        const originalText = text;
        let end = originalText.length;

        while (end > 0) {
            const candidate = originalText.slice(0, end) + "...";
            console.log(`Trying to fit "${candidate}" (from "${originalText}") into ${fitWidth}... (${end}/${originalText.length} characters)`);
            simulationDiv.textContent = candidate;
            width = simulationDiv.offsetWidth;
            console.log(`${width} / ${fitWidth}`);

            if (width <= fitWidth) {
                document.body.removeChild(simulationDiv);
                return candidate;
            }

            end--;
        }

        document.body.removeChild(simulationDiv);
        return "...";
    }



    function newEvent(event, idx) {
        let eventDiv = document.createElement("div");
        let styles = {
            gridArea: `${event.start + 2} / ${event.day + 2} / ${event.end + 2} / ${event.day + 2}`,
            backgroundColor: event.color || (isDarkMode ? randDarkCol() : randLightCol()),
            boxShadow: `0 0 ${heightWidthRatio < ASPECT_RATIO ? "0.5dvw" : "0.5dvh"} rgba(0, 0, 0, 0.4)`,
            width: "65%",
            marginLeft: "17.5%",
            height: "100%",
            borderRadius: heightWidthRatio < ASPECT_RATIO ? "0.5dvw" : "0.5dvh",
            justifySelf: "left",
            border: "1px solid black",
            opacity: isDarkMode ? 0.80 : 0.70
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
        eventDiv.addEventListener("click", e => {
            let code = event.uniqueCode;
            let url = event.url;
            if (!code && !url) {
                alert("This event does not have a unique code, and thus cannot be opened.");
                return;
            }
        
            // window.location.href = code ? `/event/${code}` : url;
            window.top.postMessage({
                type: "href",
                href: code ? `/event/${code}` : url
            }, "*");
        })

        eventDiv.dataset.type = "event";
        div.appendChild(eventDiv);

        let realWidth = eventDiv.offsetWidth;
        let realHeight = eventDiv.offsetHeight;

        let textStyles = {
            textIndent: "1ch",
            fontSize: "1dvw",
            fontWeight: "bold",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
        }
        
        if (realHeight > realWidth) textStyles.writingMode = "vertical-lr";
        let fittedText = simulateText(event.name, styles, (realHeight > realWidth ? realHeight : realWidth));
        eventDiv.textContent = fittedText;

        return eventDiv;
    }

    (data || []).forEach((event, idx) => newEvent(event, idx));

    let arr = Array.from(div.querySelectorAll(`div[data-eid]`));
    for (let i = 0; i < arr.length; i++) {
        let eventDiv = arr[i];
        if (!eventDiv) return;

        let day = eventDiv.dataset.day;
        let start = eventDiv.dataset.start;
        let end = eventDiv.dataset.end;
        let duration = eventDiv.dataset.duration;

        let sameTimeEvents = arr.filter((e, idx) =>
            e.dataset.day === day &&
            Number(e.dataset.start) <= Number(end) && 
            Number(e.dataset.end) >= Number(start) && 
            idx > i);

        const ALLOWED_MAX_REMAINS = 2;
        if (sameTimeEvents.length > ALLOWED_MAX_REMAINS) {
            let remaining = sameTimeEvents.length - ALLOWED_MAX_REMAINS;
            let remainingEvents = sameTimeEvents.slice(ALLOWED_MAX_REMAINS);
            sameTimeEvents.forEach((e, i) => i >= ALLOWED_MAX_REMAINS && e.remove());

            let earliest = Math.min(...remainingEvents.map(e => Number(e.dataset.start)));
            let latest = Math.max(...remainingEvents.map(e => Number(e.dataset.end)));
            
            dayMore = newEvent({
                name: `+${remaining} more`,
                desc: `-${remainingEvents.map(e => e.dataset.name).filter((e, i) => i < 6).join(",\n-")}` + 
                    (remainingEvents.length > 6 ? `\n+${remaining - 6} more...` : ""),
                start: earliest,
                end: latest,
                day: Number(day),
                color: isDarkMode ? randLightCol() : randDarkCol(),
                uniqueCode: undefined,
                url: `./${day}`
            },  arr.length + 1);
            
            // arr.splice(i + 1, 0, dayMore);
            arr.push(dayMore);
            remainingEvents.forEach(e => {
                let remIDX = arr.indexOf(e);
                if (remIDX > i) arr.splice(remIDX, 1);
            });

            sameTimeEvents = arr.filter((e, idx) =>
                e.dataset.day === day &&
                Number(e.dataset.start) <= Number(end) && 
                Number(e.dataset.end) >= Number(start) && 
                idx > i);
        }

        let percWidth = Number(eventDiv.style.width.replace("%", "")); // initial is 65%
        let newWidth = percWidth / (sameTimeEvents.length + 1);
        eventDiv.style.width = `${newWidth - 1}%`;
        let ml = eventDiv.style.marginLeft;
        eventDiv.style.marginLeft = `calc(${ml} + 0.5%)`;

        sameTimeEvents.forEach(e => {
            e.style.width = `${percWidth - newWidth}%`;
            e.style.marginLeft = `calc(${ml} + 0.5% + ${newWidth + 1}%`;
        });        

        let realWidth = eventDiv.offsetWidth;
        let realHeight = eventDiv.offsetHeight;
        
        if (realHeight > realWidth) eventDiv.style.writingMode = "vertical-lr";
        else eventDiv.style.writingMode = "";
    }

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
        userSelect: "none",
        whiteSpace: "pre-line"
    }
    Object.entries(tooltipStyles).forEach(([key, value]) => tooltip.style[key] = value);

    tooltip.innerHTML = "";

    createElement("h2", {tc: event.name, append: tooltip});
    createElement("p", {tc: event.desc, append: tooltip, style: {whiteSpace: "pre-line"}});
    createElement("p", {tc: `${neatTime(event.start)} - ${neatTime(event.end)}`, append: tooltip});

    let width = tooltip.getBoundingClientRect().width;
    let height = tooltip.getBoundingClientRect().height;
    if (mouseX + width > window.innerWidth) tooltip.style.left = `${mouseX - width}px`;
    if (mouseY + height > window.innerHeight) tooltip.style.top = `${mouseY - height}px`;
}

function pad(number, digits) {return String(number).padStart(digits, "0");}
function randCol() {return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`; }
function randLightCol() {return `rgb(${Math.floor(Math.random() * 128 + 127)}, ${Math.floor(Math.random() * 128 + 127)}, ${Math.floor(Math.random() * 128 + 127)})`; }
function randDarkCol() {return `rgb(${Math.floor(Math.random() * 64 + 127)}, ${Math.floor(Math.random() * 64 + 127)}, ${Math.floor(Math.random() * 64 + 127)})`; }

function neatTime(time) {
    if (!is12HourMode) return `${pad(Math.floor(time / 60), 2)}:${pad(time % 60, 2)}`;

    let hour = Math.floor(time / 60) % 12;
    if (hour === 0) hour = 12;
    return `${pad(hour, 2)}:${pad(time % 60, 2)} ${Math.floor(time / 60) < 12 ? "AM" : "PM"}`;
}

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
document.addEventListener("resize", () => tooltip?.remove());