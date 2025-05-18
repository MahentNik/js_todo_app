document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const descriptionInput = document.getElementById('todo-description');
    const categorySelect = document.getElementById('todo-category');
    const prioritySelect = document.getElementById('todo-priority');
    const dueDateInput = document.getElementById('todo-due-date');
    const categoryFilter = document.getElementById('category-filter');
    const priorityFilter = document.getElementById('priority-filter');

    // Load todos on startup
    loadTodos();

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = input.value.trim();
        if (title) {
            const todoData = {
                title,
                description: descriptionInput.value.trim(),
                category: categorySelect.value,
                priority: prioritySelect.value,
                dueDate: dueDateInput.value ? new Date(dueDateInput.value) : null
            };

            await addTodo(todoData);
            form.reset();
            loadTodos();
        }
    });

    categoryFilter.addEventListener('change', loadTodos);
    priorityFilter.addEventListener('change', loadTodos);

    async function loadTodos() {
        try {
            const category = categoryFilter.value;
            const priority = priorityFilter.value;

            let url = '/api/todos';
            const params = new URLSearchParams();

            if (category !== 'all') params.append('category', category);
            if (priority !== 'all') params.append('priority', priority);

            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url);
            const todos = await response.json();
            renderTodos(todos);
        } catch (err) {
            console.error('Error loading todos:', err);
        }
    }

    function renderTodos(todos) {
        document.querySelectorAll('.todo-list').forEach(list => {
            list.innerHTML = '';
        });

        todos.forEach(todo => {
            const listId = `${todo.category}-todos`;
            const list = document.getElementById(listId);
            if (!list) return;

            const li = document.createElement('li');
            li.className = 'todo-item';
            if (todo.completed) li.classList.add('completed');

            const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isOverdue = dueDate && dueDate < today && !todo.completed;

            li.innerHTML = `
                <div class="todo-item-header">
                    <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo._id}">
                    <span class="todo-title">${todo.title}</span>
                </div>
                ${todo.description ? `<div class="todo-description">${todo.description}</div>` : ''}
                <div class="todo-meta">
                    <span class="todo-priority priority-${todo.priority}">${todo.priority}</span>
                    ${dueDate ? `<span class="todo-due-date ${isOverdue ? 'overdue' : ''}">
                        Due: ${dueDate.toLocaleDateString()}
                    </span>` : ''}
                </div>
                <div class="todo-actions">
                    <button class="edit-btn" data-id="${todo._id}">Edit</button>
                    <button class="delete-btn" data-id="${todo._id}">Delete</button>
                </div>
            `;

            const checkbox = li.querySelector('input[type="checkbox"]');
            const deleteBtn = li.querySelector('.delete-btn');
            const editBtn = li.querySelector('.edit-btn');

            checkbox.addEventListener('change', () => toggleTodoComplete(todo._id, checkbox.checked));
            deleteBtn.addEventListener('click', () => deleteTodo(todo._id));
            editBtn.addEventListener('click', () => editTodo(todo));

            list.appendChild(li);
        });
    }

    // Add new todo
    async function addTodo(todoData) {
        try {
            await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(todoData)
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

    // Edit todo (placeholder for now)
    function editTodo(todo) {
        // Populate form with todo data
        input.value = todo.title;
        descriptionInput.value = todo.description || '';
        categorySelect.value = todo.category;
        prioritySelect.value = todo.priority;
        dueDateInput.value = todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '';

        // Change form to edit mode
        form.dataset.editId = todo._id;
        form.querySelector('button').textContent = 'Update Task';

        // Remove the submit event listener temporarily
        form.removeEventListener('submit', form._submitHandler);

        // Add new submit handler for update
        const updateHandler = async (e) => {
            e.preventDefault();
            const title = input.value.trim();
            if (title) {
                const todoData = {
                    title,
                    description: descriptionInput.value.trim(),
                    category: categorySelect.value,
                    priority: prioritySelect.value,
                    dueDate: dueDateInput.value ? new Date(dueDateInput.value) : null
                };

                await updateTodo(form.dataset.editId, todoData);
                form.reset();
                delete form.dataset.editId;
                form.querySelector('button').textContent = 'Add Task';
                loadTodos();

                // Restore original handler
                form.removeEventListener('submit', updateHandler);
                form.addEventListener('submit', form._submitHandler);
            }
        };

        form.addEventListener('submit', updateHandler);
    }

    // Update todo
    async function updateTodo(id, todoData) {
        try {
            await fetch(`/api/todos/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(todoData)
            });
        } catch (err) {
            console.error('Error updating todo:', err);
        }
    }

    // Store original submit handler
    form._submitHandler = form.addEventListener('submit', form._submitHandler);
});