export function pathOf(name) {
  return Array.isArray(name) ? name : String(name).replace(/\]/g, "").split(/[.[\]]/).filter(Boolean);
}

export function fieldKey(name) {
  return pathOf(name).join(".");
}

export function getAt(values, name) {
  return pathOf(name).reduce(
    (current, key) => current != null && Object.hasOwn(current, key) ? current[key] : undefined,
    values,
  );
}

function arrayIndex(key) {
  return /^(0|[1-9]\d*)$/.test(key) && Number(key) < 2 ** 32 - 1;
}

export function setAt(values, name, value) {
  const path = pathOf(name);
  if (!path.length) throw new TypeError("A form field path cannot be empty");

  function copyAt(current, depth) {
    if (depth === path.length) return value;

    const key = path[depth];
    const child = copyAt(
      current != null && Object.hasOwn(current, key) ? current[key] : undefined,
      depth + 1,
    );

    if (Array.isArray(current) || (current == null && arrayIndex(key))) {
      const next = current?.slice() ?? [];
      if (!arrayIndex(key) || Number(key) > next.length)
        throw new TypeError(`Form field ${path.join(".")} would create a sparse array`);
      next[key] = child;
      return next;
    }

    return { ...(typeof current === "object" ? current : null), [key]: child };
  }

  return copyAt(values, 0);
}

export function cloneFormValues(values) {
  if (values == null || Array.isArray(values) || typeof values !== "object")
    throw new TypeError("React form values must be a JSON object");

  const ancestors = new Set();

  function check(value, path) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return;
    if (typeof value === "number" && Number.isFinite(value)) return;

    const array = Array.isArray(value);
    if (
      typeof value !== "object" ||
      ancestors.has(value) ||
      (!array && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) ||
      Object.getOwnPropertySymbols(value).length
    ) {
      throw new TypeError(`Unsupported JSON value at ${path}. Upload files through the application and submit their references.`);
    }

    ancestors.add(value);
    if (array) {
      if (Object.keys(value).length !== value.length) throw new TypeError(`Invalid JSON array at ${path}`);
      for (let i = 0; i < value.length; i++) {
        if (!Object.hasOwn(value, i)) throw new TypeError(`Sparse JSON array at ${path}`);
        check(value[i], `${path}[${i}]`);
      }
    } else {
      for (const [key, item] of Object.entries(value)) check(item, `${path}.${key}`);
    }
    ancestors.delete(value);
  }

  check(values, "$");
  return structuredClone(values);
}

function isCheckboxGroup(element) {
  return element.type === "checkbox" && element.name.endsWith("[]");
}

export function nativeValue(element, elements = [element]) {
  if (isCheckboxGroup(element)) {
    return elements.filter((control) => control.type === "checkbox" && control.name === element.name && control.checked)
      .map((control) => control.value);
  }
  if (element.type === "checkbox") return Boolean(element.checked);
  if (element.type === "radio") return elements.find((control) =>
    control.type === "radio" && control.name === element.name && control.checked)?.value ?? null;
  if (element.type === "file") {
    if (element.files?.length) throw new TypeError("Upload files through the application and submit their references");
    return null;
  }
  if (element.type === "number") return element.value === "" ? null : Number(element.value);
  if (element.multiple) return [...element.selectedOptions].map((option) => option.value);
  return element.value;
}

export function setNativeValue(element, value) {
  if (element.type === "checkbox") {
    element.checked = isCheckboxGroup(element) ? Array.isArray(value) && value.includes(element.value) : Boolean(value);
  } else if (element.type === "radio") {
    element.checked = element.value === value;
  } else if (element.multiple) {
    for (const option of element.options) option.selected = Array.isArray(value) && value.includes(option.value);
  } else if (element.type === "file") {
    element.value = "";
  } else {
    element.value = value ?? "";
  }
}

export function collectValues(elements) {
  return elements.reduce((values, element) => setAt(values, element.name, nativeValue(element, elements)), {});
}
