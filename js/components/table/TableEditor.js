export class TableEditor {
  constructor(options) {
    this.root = options.root || document;

    this.table = this.root.querySelector(options.table);
    this.container = options.container
      ? this.root.querySelector(options.container)
      : this.table.parentElement;

    this.fields = options.fields || {};

    this.activeCell = null;
    this.prevText = "";

    this.editor = document.createElement("input");
    this.editor.type = "text";
    this.editor.className = "cell-editor";

    this.init();
  }

  init() {
    // ✅ Activate editor on click
    this.table.addEventListener("click", (e) => {
      const cell = e.target.closest("td");

      if (!cell || !this.table.contains(cell)) return;
      if (!this.isEditableCell(cell)) return;

      this.activate(cell);
    });

    // ✅ Keyboard handling
    this.editor.addEventListener("keydown", (e) => this.handleKeydown(e));

    // ✅ Click outside → commit
    document.addEventListener("click", (e) => {
      if (!this.activeCell) return;

      const insideEditor = this.editor.contains(e.target);
      const insideCell = e.target.closest("td");

      if (!insideEditor && !insideCell) {
        this.commit();
      }
    });

    // ✅ Keep editor aligned on scroll
    this.container.addEventListener("scroll", () => {
      if (this.activeCell) this.updateEditorPosition();
    });

    window.addEventListener("resize", () => {
      if (this.activeCell) this.updateEditorPosition();
    });
  }

  // ✅ Check if cell is editable
  isEditableCell(cell) {
    const field = cell.dataset.field;
    return field && this.fields.hasOwnProperty(field);
  }

  // ✅ Activate editor
  activate(cell) {
    if (this.activeCell === cell) return;

    this.commit();

    this.activeCell = cell;
    this.prevText = cell.innerText.trim();

    this.editor.value = this.prevText;

    this.container.appendChild(this.editor);
    this.updateEditorPosition();

    this.editor.focus();
    this.editor.select();
  }

  // ✅ Save + validation
  async commit() {
    if (!this.activeCell) return;

    const cell = this.activeCell;
    const field = cell.dataset.field;
    const id = cell.dataset.id;

    const config = this.fields[field];
    const newValue = this.editor.value.trim();

    // ✅ Validation (optional)
    if (config.validate) {
      const valid = config.validate(newValue, cell);

      if (!valid) {
        cell.classList.add("cell-error");
        return;
      } else {
        cell.classList.remove("cell-error");
      }
    }

    cell.innerText = newValue;

    // ✅ Async save
    if (config.save && newValue !== this.prevText) {
      this.showSpinner(cell);

      try {
        await config.save(id, newValue, cell);
        cell.classList.remove("cell-error");
      } catch (err) {
        console.error(err);
        cell.classList.add("cell-error");
      }

      this.hideSpinner(cell);
    }

    this.editor.remove();
    this.activeCell = null;
  }

  // ✅ Keyboard navigation
  handleKeydown(e) {
    if (!this.activeCell) return;

    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      this.navigate("down");
    }

    else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.navigate("up");
    }

    else if (e.key === "Escape") {
      this.activeCell.innerText = this.prevText;
      this.editor.remove();
      this.activeCell = null;
    }
  }

  // ✅ Navigate (with auto-scroll)
  async navigate(direction) {
    const current = this.activeCell;

    await this.commit();

    if (!current) return;

    const next = this.getNextEditableCell(current, direction);

    if (next) {
      this.ensureVisible(next);   // ✅ auto-scroll
      this.activate(next);
    }
  }

  // ✅ Get next editable cell (same column)
  getNextEditableCell(cell, direction) {
    const row = cell.parentElement;
    const colIndex = cell.cellIndex;

    const nextRow =
      direction === "down"
        ? row.nextElementSibling
        : row.previousElementSibling;

    if (!nextRow) return null;

    const nextCell = nextRow.cells[colIndex];

    return this.isEditableCell(nextCell) ? nextCell : null;
  }

  // ✅ Auto-scroll logic
  ensureVisible(cell) {
    const rect = cell.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    if (rect.top < containerRect.top) {
      this.container.scrollTop -= (containerRect.top - rect.top);
    }

    else if (rect.bottom > containerRect.bottom) {
      this.container.scrollTop += (rect.bottom - containerRect.bottom);
    }
  }

  // ✅ Position editor inside container
  updateEditorPosition() {
    if (!this.activeCell) return;

    const rect = this.activeCell.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    let left = rect.left - containerRect.left + this.container.scrollLeft;
    let top = rect.top - containerRect.top + this.container.scrollTop;

    // ✅ Prevent overlap with header / viewport issues
    const minTop = this.container.scrollTop;
    const maxTop =
      this.container.scrollTop +
      this.container.clientHeight -
      rect.height;

    if (top < minTop) top = minTop;
    if (top > maxTop) top = maxTop;

    Object.assign(this.editor.style, {
      position: "absolute",
      left: left - 1 + "px",
      top: top - 1 + "px",
      width: rect.width + "px",
      height: rect.height + "px",
      zIndex: 10
    });
  }

  // ✅ Spinner
  showSpinner(cell) {
    cell.classList.add("cell-loading");
  }

  hideSpinner(cell) {
    cell.classList.remove("cell-loading");
  }
}