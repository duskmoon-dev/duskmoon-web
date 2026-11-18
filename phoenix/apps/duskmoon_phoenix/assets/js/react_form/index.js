import React from "react";
import { createRoot } from "react-dom/client";
import { compileForm } from "@duskmoon-dev/components/json-schema-form";
import { ReactField } from "./component.js";
import { ReactSchemaForm, changedPath, schemaErrors } from "./schema.js";
import {
  cloneFormValues, collectValues, fieldKey, getAt, nativeValue, pathOf, setAt, setNativeValue,
} from "./values.js";

let nextInstance = 0;

function flattenErrors(errors, prefix = [], result = {}) {
  for (const [key, value] of Object.entries(errors || {})) {
    const path = [...prefix, key];
    if (typeof value === "string") result[path.join(".")] = [value];
    else if (Array.isArray(value) && value.every((message) => typeof message === "string"))
      result[path.join(".")] = value;
    else if (value && typeof value === "object") flattenErrors(value, path, result);
  }
  return result;
}

function equalControlValue(before, after) {
  return Object.is(before, after) ||
    (Array.isArray(before) && Array.isArray(after) &&
      before.length === after.length && before.every((item, i) => Object.is(item, after[i])));
}

export const DuskmoonReactForm = {
  mounted() {
    this.revision = 0;
    this.instance = ++nextInstance;
    this.disconnectedState = false;
    this.mountContent();
    const status = this.el.querySelector("[data-dm-hook-status]");
    if (status) status.hidden = true;
    this.resetRef = this.handleEvent("dm:form:reset", (payload) => {
      if (
        payload?.id === this.el.id &&
        (payload.context_key ?? null) === this.contextKey &&
        (payload.revision == null || payload.revision === this.revision)
      ) {
        this.resetForm(Object.hasOwn(payload, "values") ? payload.values : this.initialValues);
      }
    });
  },

  mountContent() {
    this.contextKey = this.el.dataset.contextKey ?? null;
    this.roots = new Map();
    this.fields = [];
    this.errors = {};
    this.schemaElement = this.el.querySelector("[data-dm-react-schema]");
    if (this.schemaElement) this.mountSchema();
    else this.mountForm();
  },

  updated() {
    if ((this.el.dataset.contextKey ?? null) !== this.contextKey) {
      this.clearContent();
      this.revision++;
      this.mountContent();
      this.setNotice("");
    }
  },

  mountForm() {
    this.form = this.el.querySelector("[data-dm-react-form]");
    this.fields = [...this.el.querySelectorAll("[data-dm-react-field]")];
    const nativeValues = collectValues(this.nativeControls());
    const configured = this.el.dataset.initialValues == null ? {} : JSON.parse(this.el.dataset.initialValues);
    this.values = { ...nativeValues, ...cloneFormValues(configured) };
    this.initialValues = cloneFormValues(this.values);

    const keys = this.fields.map((element) => fieldKey(JSON.parse(element.dataset.dmReactField).name));
    if (new Set(keys).size !== keys.length) throw new Error("React form field names must be unique");
    this.mountFields();
    this.bindNative();
    this.bindForm();
  },

  mountSchema() {
    this.compiledSchema = compileForm(JSON.parse(this.el.dataset.schema));
    const configured = this.el.dataset.initialValues == null
      ? this.compiledSchema.initialValue()
      : JSON.parse(this.el.dataset.initialValues);
    this.values = cloneFormValues(configured);
    this.initialValues = cloneFormValues(this.values);
    this.schemaRevision = 0;
    this.schemaRoot = createRoot(this.schemaElement);
    this.renderSchema();
  },

  renderSchema() {
    this.schemaRoot.render(React.createElement(ReactSchemaForm, {
      key: this.schemaRevision,
      className: this.schemaElement.dataset.formClass,
      compiled: this.compiledSchema,
      value: this.values,
      defaultValue: this.initialValues,
      errors: this.errors,
      disabled: this.disconnectedState,
      onChange: (values) => {
        const next = cloneFormValues(values);
        const path = changedPath(this.values, next);
        this.values = next;
        this.errors = {};
        this.renderSchema();
        this.scheduleChange(path);
      },
      onErrorsChange: () => {
        this.errors = {};
        this.renderSchema();
      },
      onSubmit: (values) => {
        if (this.pendingSubmission) return;
        this.values = cloneFormValues(values);
        this.submit();
      },
      onReset: () => this.resetForm(),
    }));
  },

  mountFields() {
    for (const element of this.fields) {
      const config = JSON.parse(element.dataset.dmReactField);
      const key = fieldKey(config.name);
      this.roots.set(key, { config, root: createRoot(element) });
      this.renderField(key);
    }
  },

  renderField(key) {
    const entry = this.roots.get(key);
    if (!entry) return;
    const { config, root } = entry;
    root.render(React.createElement(ReactField, {
      config,
      value: getAt(this.values, config.name),
      errors: this.errors[key],
      disabled: this.disconnectedState,
      onChange: (value) => this.change(config.name, value),
    }));
  },

  nativeControls() {
    const managedPaths = this.fields.map((element) => pathOf(JSON.parse(element.dataset.dmReactField).name).map(String));
    return [...this.form.querySelectorAll("input[name], select[name], textarea[name]")].filter((element) => {
      if (element.matches(":disabled") || element.closest("[data-dm-react-field]")) return false;
      const path = pathOf(element.name).map(String);
      return !managedPaths.some((managed) => managed.slice(0, Math.min(path.length, managed.length)).every((key, index) => key === path[index]));
    });
  },

  bindNative() {
    this.nativeHandler = (event) => {
      const controls = this.nativeControls();
      const element = event.target;
      if (!controls.includes(element)) return;
      try {
        this.change(element.name, nativeValue(element, controls));
      } catch (error) {
        this.setNotice(error.message);
      }
    };
    this.form.addEventListener("input", this.nativeHandler);
    this.form.addEventListener("change", this.nativeHandler);
  },

  bindForm() {
    this.submitHandler = (event) => {
      event.preventDefault();
      this.submit(event.submitter);
    };
    this.resetHandler = () => {
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.resetForm(), 0);
    };
    this.form.addEventListener("submit", this.submitHandler);
    this.form.addEventListener("reset", this.resetHandler);
  },

  change(name, value) {
    if (equalControlValue(getAt(this.values, name), value)) return;
    this.values = setAt(this.values, name, value);
    const key = fieldKey(name);
    delete this.errors[key];
    this.renderField(key);
    this.scheduleChange(name);
  },

  scheduleChange(name) {
    const event = this.el.getAttribute("phx-change");
    if (!event || this.disconnectedState) return;
    clearTimeout(this.changeTimer);
    this.changeTimer = setTimeout(() => {
      try {
        this.send(event, { changed: pathOf(name) });
      } catch (error) {
        this.setNotice(error.message);
      }
    }, Number(this.el.getAttribute("phx-debounce") || 0));
  },

  submit(submitter) {
    clearTimeout(this.changeTimer);
    const event = this.el.getAttribute("phx-submit");
    if (!event || this.disconnectedState || this.pendingSubmission) return;
    if (this.form && !this.form.noValidate && !submitter?.formNoValidate && !this.form.reportValidity()) return;

    try {
      if (this.form) {
        const controls = this.nativeControls();
        this.values = controls.reduce(
          (values, control) => setAt(values, control.name, nativeValue(control, controls)),
          this.values,
        );
      }
      const metadata = submitter
        ? { submitter: { id: submitter.id, name: submitter.name, value: submitter.value } }
        : {};
      this.send(event, metadata, true);
    } catch (error) {
      this.cancelSubmission(error.message);
      this.setNotice(error.message);
    }
  },

  send(event, metadata, submit = false) {
    const values = this.values;
    const contextKey = this.contextKey;
    const revision = ++this.revision;
    const requestId = globalThis.crypto?.randomUUID?.() ?? `${this.el.id}/${this.instance}/${revision}`;
    const payload = {
      id: this.el.id,
      values: cloneFormValues(values),
      revision,
      request_id: requestId,
      ...(contextKey === null ? {} : { context_key: contextKey }),
      ...metadata,
    };

    if (submit) {
      this.setNotice("Saving…");
      this.pendingSubmission = { requestId, timer: setTimeout(() => {
        this.cancelSubmission("Save status is unknown. Check the result before trying again.");
      }, 15000) };
    }

    const callback = (reply) => {
      if (this.destroyedState || this.disconnectedState || this.contextKey !== contextKey) return;
      if (
        (reply?.request_id != null && reply.request_id !== requestId) ||
        (reply?.revision != null && reply.revision !== revision) ||
        (reply?.context_key != null && reply.context_key !== contextKey)
      ) return;

      if (submit) {
        if (this.pendingSubmission?.requestId !== requestId) return;
        if (!["ok", "error"].includes(reply?.status)) return;
        this.cancelSubmission(reply.message || (reply.status === "ok" ? "Saved." : "Save rejected."));
      }
      if (revision !== this.revision || values !== this.values || !reply) return;

      this.errors = this.schemaRoot ? schemaErrors(reply.errors) : flattenErrors(reply.errors);
      this.renderAll();
    };

    const target = this.el.getAttribute("phx-target");
    if (target) this.pushEventTo(target, event, payload, callback);
    else this.pushEvent(event, payload, callback);
  },

  setNotice(message) {
    const status = this.el.querySelector("[data-dm-form-notice]");
    if (status) status.textContent = message;
  },

  cancelSubmission(message) {
    if (!this.pendingSubmission) return;
    clearTimeout(this.pendingSubmission.timer);
    this.pendingSubmission = null;
    if (message) this.setNotice(message);
  },

  renderAll() {
    if (this.schemaRoot) this.renderSchema();
    else for (const key of this.roots?.keys() ?? []) this.renderField(key);
  },

  resetForm(values = this.initialValues) {
    clearTimeout(this.changeTimer);
    clearTimeout(this.resetTimer);
    this.values = cloneFormValues(values);
    this.errors = {};
    this.revision++;
    if (this.schemaRoot) this.schemaRevision++;
    else this.nativeControls().forEach((element) => setNativeValue(element, getAt(this.values, element.name)));
    this.renderAll();
  },

  disconnected() {
    clearTimeout(this.changeTimer);
    this.cancelSubmission("Save status is unknown. Check the result before trying again.");
    this.disconnectedState = true;
    this.revision++;
    this.renderAll();
  },

  reconnected() {
    this.disconnectedState = false;
    this.renderAll();
  },

  clearContent() {
    clearTimeout(this.changeTimer);
    clearTimeout(this.resetTimer);
    this.cancelSubmission();
    this.schemaRoot?.unmount();
    this.schemaRoot = null;
    this.form?.removeEventListener("submit", this.submitHandler);
    this.form?.removeEventListener("reset", this.resetHandler);
    this.form?.removeEventListener("input", this.nativeHandler);
    this.form?.removeEventListener("change", this.nativeHandler);
    this.form = null;
    this.roots?.forEach(({ root }) => root.unmount());
    this.roots?.clear();
  },

  destroyed() {
    this.destroyedState = true;
    if (this.resetRef != null) this.removeHandleEvent?.(this.resetRef);
    this.clearContent();
  },
};
