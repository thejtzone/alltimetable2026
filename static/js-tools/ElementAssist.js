/**
 * Creates a new HTML element of the specified tag with the provided properties.
 *
 * @param {string} element - The tag name of the element to create.
 * @param {Object} [options={}] - An object containing optional parameters for the element.
 * @param {string} [options.textContent] - The text content of the element.
 * @param {string} [options.tc] - An alias for options.textContent.
 * @param {string} [options.innerHTML] - The HTML content of the element.
 * @param {string} [options.classname] - The class name to add to the element.
 * @param {Array<string>} [options.classes] - An array of class names to add to the element.
 * @param {string} [options.id] - The ID of the element.
 * @param {string} [options.name] - The name of the element.
 * @param {Object} [options.styles] - An object containing CSS styles to apply to the element in the form of key-value pairs.
 * @param {HTMLElement} [options.append] - The element to append the new element to.
 * @return {HTMLElement} The newly created element.
 */
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