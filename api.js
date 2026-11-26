// api.js - ALL data access lives in this one file.
// Right now it saves to the browser (localStorage) so the frontend works alone.
// When your Java backend is ready, replace each function body with a fetch()
// call to the REST endpoint written in its comment. Nothing else needs to change.
// Note: passwords are stored as plain text here only for the demo. The backend must hash them.

const API = {
  _get(key) { return JSON.parse(localStorage.getItem(key) || "[]"); },
  _set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },

  currentUser() { return JSON.parse(localStorage.getItem("tm_session") || "null"); },

  // POST /api/auth/register
  async register(name, email, password) {
    const users = this._get("tm_users");
    if (users.some(u => u.email === email)) throw new Error("This email is already registered.");
    users.push({ id: Date.now(), name, email, password });
    this._set("tm_users", users);
  },

  // POST /api/auth/login
  async login(email, password) {
    const user = this._get("tm_users").find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Email or password is wrong.");
    localStorage.setItem("tm_session", JSON.stringify({ id: user.id, name: user.name }));
  },

  logout() { localStorage.removeItem("tm_session"); },

  // GET /api/tasks
  async getTasks() {
    const me = this.currentUser();
    return this._get("tm_tasks").filter(t => t.userId === me.id);
  },

  // POST /api/tasks (new task) or PUT /api/tasks/{id} (edit task)
  async saveTask(task) {
    const all = this._get("tm_tasks");
    if (task.id) {
      const i = all.findIndex(t => t.id === task.id);
      all[i] = { ...all[i], ...task };
    } else {
      all.push({ ...task, id: Date.now(), userId: this.currentUser().id });
    }
    this._set("tm_tasks", all);
  },

  // DELETE /api/tasks/{id}
  async deleteTask(id) {
    this._set("tm_tasks", this._get("tm_tasks").filter(t => t.id !== id));
  }
};
