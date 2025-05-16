document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');

    // Load todos on startup
    loadTodos();

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = input.value.trim();
        if (title) {
            await addTodo(title);
            input.value = '';
            loadTodos();
        }
    });

    // Load todos from API
    async function loadTodos() {
        try {
            const response = await fetch('/api/todos');
            const todos = await response.json();
            renderTodos(todos);
        } catch (err) {
            console.error('Error loading todos:', err);
        }
    }

    // Render todos to the DOM
    function renderTodos(todos) {
        list.innerHTML = '';
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item';
            if (todo.completed) li.classList.add('completed');

            li.innerHTML = `
        <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo._id}">
        <span>${todo.title}</span>
        <button data-id="${todo._id}">Delete</button>
      `;

            // Add event listeners
            const checkbox = li.querySelector('input');
            const deleteBtn = li.querySelector('button');

            checkbox.addEventListener('change', () => toggleTodoComplete(todo._id, checkbox.checked));
            deleteBtn.addEventListener('click', () => deleteTodo(todo._id));

            list.appendChild(li);
        });
    }

    // Add new todo
    async function addTodo(title) {
        try {
            await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title })
            });
        } catch (err) {
            console.error('Error adding todo:', err);
        }
    }

    // Toggle todo completion status
    async function toggleTodoComplete(id, completed) {
        try {
            await fetch(`/api/todos/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed })
            });
            loadTodos();
        } catch (err) {
            console.error('Error updating todo:', err);
        }
    }

    // Delete todo
    async function deleteTodo(id) {
        try {
            await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            loadTodos();
        } catch (err) {
            console.error('Error deleting todo:', err);
        }
    }
});