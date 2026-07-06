window.Combobox = class Combobox {
  constructor(container, options) {
    this.container = container;
    this.data = options.data || [];
    this.getLabel = options.getLabel || ((item) => item.name);
    this.getValue = options.getValue || ((item) => item.name);
    this.getBrand = options.getBrand || ((item) => item.brand);
    this.placeholder = options.placeholder || "Search...";
    this.onChange = options.onChange || (() => {});
    this.value = options.value || "";
    this.highlightIndex = -1;
    this.open = false;
    this.render();
    this.bindEvents();
    if (this.value) this.setValue(this.value, false);
  }

  render() {
    this.container.innerHTML = "";
    this.container.className = "combobox";
    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.className = "combobox-input";
    this.input.placeholder = this.placeholder;
    this.input.autocomplete = "off";
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-expanded", "false");
    this.input.setAttribute("aria-autocomplete", "list");
    this.hidden = document.createElement("input");
    this.hidden.type = "hidden";
    this.hidden.name = this.container.dataset.name || "";
    this.list = document.createElement("ul");
    this.list.className = "combobox-list";
    this.list.setAttribute("role", "listbox");
    this.list.hidden = true;
    this.container.appendChild(this.input);
    this.container.appendChild(this.hidden);
    this.container.appendChild(this.list);
  }

  bindEvents() {
    this.input.addEventListener("input", () => {
      this.open = true;
      this.highlightIndex = -1;
      this.renderList(this.input.value);
    });
    this.input.addEventListener("focus", () => {
      this.open = true;
      this.renderList(this.input.value);
    });
    this.input.addEventListener("keydown", (e) => this.handleKeydown(e));
    this.input.addEventListener("blur", () => {
      setTimeout(() => {
        this.closeList();
        const match = this.data.find((item) => this.getLabel(item) === this.input.value.trim());
        if (match) this.selectItem(match, false);
        else if (this.value) {
          const current = this.data.find((item) => this.getValue(item) === this.value);
          if (current) this.input.value = this.getLabel(current);
        }
      }, 150);
    });
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) this.closeList();
    });
  }

  handleKeydown(e) {
    const items = this.list.querySelectorAll("[data-value]");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.open = true;
      this.renderList(this.input.value);
      this.highlightIndex = Math.min(this.highlightIndex + 1, items.length - 1);
      this.updateHighlight(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.highlightIndex = Math.max(this.highlightIndex - 1, 0);
      this.updateHighlight(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (this.highlightIndex >= 0 && items[this.highlightIndex]) {
        this.selectByValue(items[this.highlightIndex].dataset.value);
      }
    } else if (e.key === "Escape") {
      this.closeList();
    }
  }

  updateHighlight(items) {
    items.forEach((el, i) => el.classList.toggle("highlighted", i === this.highlightIndex));
    if (items[this.highlightIndex]) items[this.highlightIndex].scrollIntoView({ block: "nearest" });
  }

  renderList(filter) {
    const q = (filter || "").toLowerCase().trim();
    const filtered = this.data.filter((item) => this.getLabel(item).toLowerCase().includes(q));
    const groups = filtered.reduce((acc, item) => {
      const brand = this.getBrand(item);
      acc[brand] = acc[brand] || [];
      acc[brand].push(item);
      return acc;
    }, {});
    this.list.innerHTML = Object.entries(groups)
      .map(([brand, items]) => {
        const header = `<li class="combobox-group" role="presentation">${brand}</li>`;
        const opts = items
          .map(
            (item) =>
              `<li class="combobox-option" role="option" data-value="${this.escape(this.getValue(item))}">${this.escape(this.getLabel(item))}</li>`
          )
          .join("");
        return header + opts;
      })
      .join("");
    this.list.hidden = !this.open || filtered.length === 0;
    this.input.setAttribute("aria-expanded", String(!this.list.hidden));
    this.list.querySelectorAll(".combobox-option").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.selectByValue(el.dataset.value);
      });
    });
  }

  selectByValue(val) {
    const item = this.data.find((i) => this.getValue(i) === val);
    if (item) this.selectItem(item, true);
  }

  selectItem(item, fireChange) {
    this.value = this.getValue(item);
    this.hidden.value = this.value;
    this.input.value = this.getLabel(item);
    this.closeList();
    if (fireChange) this.onChange(this.value);
  }

  setValue(val, fireChange) {
    const item = this.data.find((i) => this.getValue(i) === val);
    if (item) this.selectItem(item, fireChange);
  }

  getValue_() {
    return this.value;
  }

  closeList() {
    this.open = false;
    this.list.hidden = true;
    this.highlightIndex = -1;
    this.input.setAttribute("aria-expanded", "false");
  }

  escape(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
};
