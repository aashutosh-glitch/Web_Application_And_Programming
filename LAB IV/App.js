// =================================================================
// LAB 4 - CRUD TODO APP (React + State Manipulation)
// Topics: useState, list rendering, add/edit/delete/complete,
//         array methods, conditional rendering, key prop
//
// HOW TO RUN:
//   npx create-react-app lab4-todo
//   cd lab4-todo
//   Replace src/App.js with this file
//   npm start
// =================================================================

import { useState } from "react";

// ============================================================
// SINGLE TODO ITEM COMPONENT
// Props: todo (object), onDelete, onToggle, onEdit
// ============================================================
function TodoItem({ todo, onDelete, onToggle, onEdit }) {
  // Local state for inline editing
  const [isEditing,  setIsEditing]  = useState(false);
  const [editText,   setEditText]   = useState(todo.text);

  function handleSave() {
    if (editText.trim() === "") return;  // don't save empty
    onEdit(todo.id, editText.trim());    // call parent's edit handler
    setIsEditing(false);
  }

  return (
    <div style={{
      ...styles.todoItem,
      opacity: todo.completed ? 0.55 : 1,
      borderColor: todo.completed ? "#2a2a3d" : "#3d3d5c",
    }}>
      {/* Checkbox to toggle complete */}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        style={styles.checkbox}
      />

      {/* Text or edit input */}
      {isEditing ? (
        <input
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          style={styles.editInput}
          autoFocus
        />
      ) : (
        <span style={{
          ...styles.todoText,
          textDecoration: todo.completed ? "line-through" : "none",
          color: todo.completed ? "#555577" : "#e8e8f0",
        }}>
          {todo.text}
        </span>
      )}

      {/* Priority badge */}
      <span style={{
        ...styles.badge,
        background: todo.priority === "high"   ? "rgba(252,92,125,0.15)" :
                    todo.priority === "medium" ? "rgba(255,183,0,0.15)"  :
                                                  "rgba(46,125,50,0.15)",
        color: todo.priority === "high"   ? "#fc5c7d" :
               todo.priority === "medium" ? "#ffb700" : "#81c784",
      }}>
        {todo.priority}
      </span>

      {/* Action buttons */}
      <div style={styles.actions}>
        {isEditing ? (
          <button style={styles.btnSave} onClick={handleSave}>Save</button>
        ) : (
          <button style={styles.btnEdit} onClick={() => setIsEditing(true)}>Edit</button>
        )}
        <button style={styles.btnDelete} onClick={() => onDelete(todo.id)}>Delete</button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  // List of todos — each is { id, text, completed, priority }
  const [todos, setTodos] = useState([
    { id: 1, text: "Complete LAB 1 - Portfolio",  completed: true,  priority: "high"   },
    { id: 2, text: "Complete LAB 2 - JS Intro",   completed: false, priority: "high"   },
    { id: 3, text: "Push code to GitHub",         completed: false, priority: "medium" },
    { id: 4, text: "Review React notes",          completed: false, priority: "low"    },
  ]);

  // Input state
  const [newText,     setNewText]     = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  // Filter state: "all" | "active" | "completed"
  const [filter, setFilter] = useState("all");

  // ---- CRUD OPERATIONS ----

  // CREATE — add a new todo
  function addTodo() {
    if (newText.trim() === "") return;  // ignore empty input

    const newTodo = {
      id:        Date.now(),          // unique ID using timestamp
      text:      newText.trim(),
      completed: false,
      priority:  newPriority,
    };

    setTodos(prev => [newTodo, ...prev]);  // add to top of list
    setNewText("");                         // clear input
  }

  // DELETE — remove a todo by id
  function deleteTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  // UPDATE (TOGGLE) — flip completed status
  function toggleTodo(id) {
    setTodos(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  }

  // UPDATE (EDIT TEXT) — change the text of a todo
  function editTodo(id, newText) {
    setTodos(prev =>
      prev.map(t =>
        t.id === id ? { ...t, text: newText } : t
      )
    );
  }

  // DELETE ALL COMPLETED
  function clearCompleted() {
    setTodos(prev => prev.filter(t => !t.completed));
  }

  // ---- FILTERING ----
  const filteredTodos = todos.filter(t => {
    if (filter === "active")    return !t.completed;
    if (filter === "completed") return  t.completed;
    return true;  // "all"
  });

  // ---- STATS ----
  const totalCount     = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const activeCount    = totalCount - completedCount;

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <h1 style={styles.title}>My Todo List</h1>
        <p style={styles.subtitle}>LAB 4 — React CRUD</p>

        {/* Stats */}
        <div style={styles.stats}>
          <span style={styles.stat}><b>{totalCount}</b> total</span>
          <span style={styles.stat}><b style={{color:"#7c5cfc"}}>{activeCount}</b> active</span>
          <span style={styles.stat}><b style={{color:"#81c784"}}>{completedCount}</b> done</span>
        </div>

        {/* Add Todo */}
        <div style={styles.addBar}>
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTodo()}
            placeholder="Add a new task..."
            style={styles.mainInput}
          />
          <select
            value={newPriority}
            onChange={e => setNewPriority(e.target.value)}
            style={styles.select}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button onClick={addTodo} style={styles.addBtn}>
            + Add
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterBar}>
          {["all", "active", "completed"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                background: filter === f ? "#7c5cfc" : "transparent",
                color:      filter === f ? "white"   : "#8888aa",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div style={styles.list}>
          {filteredTodos.length === 0 ? (
            <p style={styles.emptyMsg}>
              {filter === "completed" ? "Nothing completed yet." : "No tasks here!"}
            </p>
          ) : (
            filteredTodos.map(todo => (
              // Key prop is required when rendering lists in React
              <TodoItem
                key={todo.id}
                todo={todo}
                onDelete={deleteTodo}
                onToggle={toggleTodo}
                onEdit={editTodo}
              />
            ))
          )}
        </div>

        {/* Footer actions */}
        {completedCount > 0 && (
          <button onClick={clearCompleted} style={styles.clearBtn}>
            Clear {completedCount} completed
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    justifyContent: "center",
    padding: "3rem 1rem",
    fontFamily: "'Space Mono', monospace",
  },
  container: {
    width: "100%",
    maxWidth: "600px",
  },
  title: {
    color: "#e8e8f0",
    fontSize: "2rem",
    fontWeight: 800,
    marginBottom: "0.2rem",
  },
  subtitle: {
    color: "#7c5cfc",
    fontSize: "0.8rem",
    letterSpacing: "0.1em",
    marginBottom: "1.5rem",
  },
  stats: {
    display: "flex",
    gap: "1.5rem",
    marginBottom: "1.5rem",
    color: "#8888aa",
    fontSize: "0.85rem",
  },
  stat: { },
  addBar: {
    display: "flex",
    gap: "0.6rem",
    marginBottom: "1rem",
  },
  mainInput: {
    flex: 1,
    background: "#13131a",
    border: "1px solid #2a2a3d",
    borderRadius: "6px",
    color: "#e8e8f0",
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
    fontFamily: "'Space Mono', monospace",
    outline: "none",
  },
  select: {
    background: "#13131a",
    border: "1px solid #2a2a3d",
    borderRadius: "6px",
    color: "#e8e8f0",
    padding: "0.5rem",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  addBtn: {
    background: "#7c5cfc",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.2rem",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Space Mono', monospace",
  },
  filterBar: {
    display: "flex",
    gap: "0.4rem",
    marginBottom: "1.2rem",
  },
  filterBtn: {
    border: "1px solid #2a2a3d",
    borderRadius: "6px",
    padding: "0.4rem 1rem",
    fontSize: "0.8rem",
    cursor: "pointer",
    fontFamily: "'Space Mono', monospace",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  todoItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "#13131a",
    border: "1px solid #3d3d5c",
    borderRadius: "8px",
    padding: "0.9rem 1rem",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#7c5cfc",
    flexShrink: 0,
  },
  todoText: {
    flex: 1,
    fontSize: "0.9rem",
  },
  editInput: {
    flex: 1,
    background: "#1c1c28",
    border: "1px solid #7c5cfc",
    borderRadius: "4px",
    color: "#e8e8f0",
    padding: "0.3rem 0.6rem",
    fontSize: "0.9rem",
    fontFamily: "'Space Mono', monospace",
    outline: "none",
  },
  badge: {
    padding: "0.2rem 0.6rem",
    borderRadius: "4px",
    fontSize: "0.7rem",
    flexShrink: 0,
    letterSpacing: "0.05em",
  },
  actions: {
    display: "flex",
    gap: "0.4rem",
    flexShrink: 0,
  },
  btnEdit: {
    background: "transparent",
    border: "1px solid #2a2a3d",
    borderRadius: "4px",
    color: "#aaaacc",
    padding: "0.25rem 0.6rem",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
  btnSave: {
    background: "rgba(124,92,252,0.2)",
    border: "1px solid #7c5cfc",
    borderRadius: "4px",
    color: "#7c5cfc",
    padding: "0.25rem 0.6rem",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
  btnDelete: {
    background: "rgba(252,92,125,0.1)",
    border: "1px solid rgba(252,92,125,0.3)",
    borderRadius: "4px",
    color: "#fc5c7d",
    padding: "0.25rem 0.6rem",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
  emptyMsg: {
    color: "#555577",
    textAlign: "center",
    padding: "2rem",
    fontSize: "0.9rem",
  },
  clearBtn: {
    marginTop: "1rem",
    background: "transparent",
    border: "1px solid #fc5c7d",
    borderRadius: "6px",
    color: "#fc5c7d",
    padding: "0.5rem 1.2rem",
    fontSize: "0.8rem",
    cursor: "pointer",
    fontFamily: "'Space Mono', monospace",
  },
};
