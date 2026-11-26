// main.js - page logic. The <body data-page="..."> value tells us which page we are on.
const page = document.body.dataset.page;
const $ = id => document.getElementById(id);

function el(tag, text, cls) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;   // textContent (not innerHTML) keeps user text safe
  if (cls) node.className = cls;
  return node;
}

/* ---------- Login and Register ---------- */
if (page === "login" || page === "register") {
  if (API.currentUser()) location.href = "dashboard.html";

  $("auth-form").addEventListener("submit", async e => {
    e.preventDefault();
    const box = $("error");
    box.hidden = true;
    const f = new FormData(e.target);
    const email = f.get("email").trim();
    try {
      if (page === "register") await API.register(f.get("name").trim(), email, f.get("password"));
      await API.login(email, f.get("password"));
      location.href = "dashboard.html";
    } catch (err) {
      box.textContent = err.message;
      box.hidden = false;
    }
  });
}

/* ---------- Dashboard ---------- */
if (page === "dashboard") {
  const user = API.currentUser();
  if (!user) location.href = "login.html";
  else initDashboard(user);
}

function initDashboard(user) {
  const labels = { todo: "To do", doing: "In progress", done: "Done" };
  const form = $("task-form");
  let tasks = [], filter = "all", editingId = null;

  $("user-name").textContent = user.name;
  $("logout").onclick = () => { API.logout(); location.href = "login.html"; };

  async function refresh() { tasks = await API.getTasks(); render(); }

  function render() {
    const today = new Date().toISOString().slice(0, 10);
    const shown = tasks.filter(t => filter === "all" || t.status === filter);
    const list = $("task-list");
    list.innerHTML = "";
    $("empty").hidden = shown.length > 0;

    shown.forEach(t => {
      const li = el("li", "", "task " + t.status);

      const info = el("div");
      info.append(el("h3", t.title));
      if (t.description) info.append(el("p", t.description));
      const meta = el("div", "", "meta");
      meta.append(el("span", t.priority + " priority"));
      if (t.due) meta.append(el("span", "Due " + t.due, t.due < today && t.status !== "done" ? "overdue" : ""));
      info.append(meta);

      const actions = el("div", "", "actions");
      const statusSel = el("select");
      statusSel.setAttribute("aria-label", "Change status of " + t.title);
      Object.entries(labels).forEach(([value, text]) => {
        const opt = el("option", text);
        opt.value = value;
        opt.selected = value === t.status;
        statusSel.append(opt);
      });
      statusSel.onchange = async () => { await API.saveTask({ id: t.id, status: statusSel.value }); refresh(); };

      const editBtn = el("button", "Edit", "ghost");
      editBtn.onclick = () => startEdit(t);
      const delBtn = el("button", "Delete", "danger");
      delBtn.onclick = async () => {
        if (confirm('Delete "' + t.title + '"?')) { await API.deleteTask(t.id); refresh(); }
      };

      actions.append(statusSel, editBtn, delBtn);
      li.append(info, actions);
      list.append(li);
    });

    // show counts on the filter buttons
    document.querySelectorAll("#filters button").forEach(b => {
      const key = b.dataset.filter;
      const n = key === "all" ? tasks.length : tasks.filter(t => t.status === key).length;
      b.textContent = (key === "all" ? "All" : labels[key]) + " (" + n + ")";
      b.classList.toggle("active", key === filter);
    });
  }

  function startEdit(t) {
    editingId = t.id;
    form.title.value = t.title;
    form.description.value = t.description || "";
    form.due.value = t.due || "";
    form.priority.value = t.priority;
    form.status.value = t.status;
    $("form-title").textContent = "Edit task";
    $("save-btn").textContent = "Save changes";
    $("cancel-btn").hidden = false;
    form.title.focus();
  }

  function resetForm() {
    editingId = null;
    form.reset();
    $("form-title").textContent = "Add a task";
    $("save-btn").textContent = "Add task";
    $("cancel-btn").hidden = true;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await API.saveTask({
      id: editingId,
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      due: form.due.value,
      priority: form.priority.value,
      status: form.status.value
    });
    resetForm();
    refresh();
  });

  $("cancel-btn").onclick = resetForm;
  $("filters").addEventListener("click", e => {
    if (e.target.dataset.filter) { filter = e.target.dataset.filter; render(); }
  });

  refresh();
}
