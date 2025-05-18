document.addEventListener('DOMContentLoaded', () => {
    // Get modal elements
    const modal = document.getElementById('task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('todo-form');
    const categoryFilter = document.getElementById('category-filter');
    const priorityFilter = document.getElementById('priority-filter');

    // Open modal when Add Task button is clicked
    addTaskBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        document.getElementById('todo-input').focus();
    });

    // Close modal when X is clicked
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            form.reset();
        }
    });

    // Load todos on startup and when filters change
    loadTodos();
    categoryFilter.addEventListener('change', loadTodos);
    priorityFilter.addEventListener('change', loadTodos);

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('todo-input').value.trim();
        if (title) {
            const todoData = {
                title,
                description: document.getElementById('todo-description').value.trim(),
                category: document.getElementById('todo-category').value,
                priority: document.getElementById('todo-priority').value,
                dueDate: document.getElementById('todo-due-date').value ?
                    new Date(document.getElementById('todo-due-date').value) : null
            };

            try {
                await addTodo(todoData);
                form.reset();
                modal.style.display = 'none';
                await loadTodos();
            } catch (err) {
                console.error('Error adding todo:', err);
                alert('Failed to add task. Please try again.');
            }
        }
    });

    // Load todos from API with filters
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
            if (!response.ok) throw new Error('Failed to fetch todos');

            const todos = await response.json();
            renderTodos(todos);
        } catch (err) {
            console.error('Error loading todos:', err);
            alert('Failed to load tasks. Please try again.');
        }
    }

    // Render todos to the DOM grouped by category
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
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(todoData)
        });

        if (!response.ok) {
            throw new Error('Failed to add todo');
        }

        return await response.json();
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
            await loadTodos();
        } catch (err) {
            console.error('Error updating todo:', err);
            alert('Failed to update task status. Please try again.');
        }
    }

    // Delete todo
    async function deleteTodo(id) {
        try {
            await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            await loadTodos();
        } catch (err) {
            console.error('Error deleting todo:', err);
            alert('Failed to delete task. Please try again.');
        }
    }

    // Edit todo
    function editTodo(todo) {
        document.getElementById('todo-input').value = todo.title;
        document.getElementById('todo-description').value = todo.description || '';
        document.getElementById('todo-category').value = todo.category;
        document.getElementById('todo-priority').value = todo.priority;
        document.getElementById('todo-due-date').value = todo.dueDate ?
            new Date(todo.dueDate).toISOString().split('T')[0] : '';

        form.dataset.editId = todo._id;
        form.querySelector('.submit-btn').textContent = 'Update Task';
        modal.style.display = 'block';

        // Store original submit handler
        if (!form._originalSubmitHandler) {
            form._originalSubmitHandler = form._submitHandler;
        }

        // Remove current submit handler
        form.removeEventListener('submit', form._submitHandler);

        // Add update handler
        form._submitHandler = async (e) => {
            e.preventDefault();
            const title = document.getElementById('todo-input').value.trim();
            if (title) {
                const todoData = {
                    title,
                    description: document.getElementById('todo-description').value.trim(),
                    category: document.getElementById('todo-category').value,
                    priority: document.getElementById('todo-priority').value,
                    dueDate: document.getElementById('todo-due-date').value ?
                        new Date(document.getElementById('todo-due-date').value) : null
                };

                try {
                    await updateTodo(form.dataset.editId, todoData);
                    form.reset();
                    modal.style.display = 'none';
                    delete form.dataset.editId;
                    form.querySelector('.submit-btn').textContent = 'Add Task';
                    await loadTodos();

                    // Restore original handler
                    form.removeEventListener('submit', form._submitHandler);
                    form.addEventListener('submit', form._originalSubmitHandler);
                } catch (err) {
                    console.error('Error updating todo:', err);
                    alert('Failed to update task. Please try again.');
                }
            }
        };

        form.addEventListener('submit', form._submitHandler);
    }

    // Update todo
    async function updateTodo(id, todoData) {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(todoData)
        });

        if (!response.ok) {
            throw new Error('Failed to update todo');
        }

        return await response.json();
    }

    // Store original submit handler
    form._submitHandler = form.addEventListener('submit', form._submitHandler);
});