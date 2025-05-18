document.addEventListener('DOMContentLoaded', () => {
    // Получаем элементы DOM
    const modal = document.getElementById('task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('todo-form');
    const submitBtn = form.querySelector('.submit-btn');
    const categoryFilter = document.getElementById('category-filter');
    const priorityFilter = document.getElementById('priority-filter');

    // Переменные состояния
    let currentMode = 'add';
    let currentEditId = null;

    // Инициализация
    loadTodos();
    setupEventListeners();

    function setupEventListeners() {
        // Кнопка добавления задачи
        addTaskBtn.addEventListener('click', openAddModal);

        // Кнопка закрытия модального окна
        closeBtn.addEventListener('click', closeModal);

        // Закрытие по клику вне модального окна
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Отправка формы
        form.addEventListener('submit', handleFormSubmit);

        // Фильтры
        categoryFilter.addEventListener('change', loadTodos);
        priorityFilter.addEventListener('change', loadTodos);
    }

    function openAddModal() {
        currentMode = 'add';
        currentEditId = null;
        form.reset();
        submitBtn.textContent = 'Add Task';
        modal.style.display = 'block';
        document.getElementById('todo-input').focus();
    }

    function closeModal() {
        modal.style.display = 'none';
        form.reset();
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('todo-input').value.trim();
        if (!title) return;

        const todoData = {
            title,
            description: document.getElementById('todo-description').value.trim(),
            category: document.getElementById('todo-category').value,
            priority: document.getElementById('todo-priority').value,
            dueDate: document.getElementById('todo-due-date').value || null
        };

        try {
            if (currentMode === 'edit' && currentEditId) {
                await updateTodo(currentEditId, todoData);
            } else {
                await addTodo(todoData);
            }
            closeModal();
            await loadTodos();
        } catch (err) {
            console.error('Error saving todo:', err);
            alert('Failed to save task. Please try again.');
        }
    }

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

    function renderTodos(todos) {
        // Очищаем все списки
        document.querySelectorAll('.todo-list').forEach(list => {
            list.innerHTML = '';
        });

        // Добавляем задачи в соответствующие категории
        todos.forEach(todo => {
            const listId = `${todo.category}-todos`;
            const list = document.getElementById(listId);
            if (!list) return;

            const li = createTodoElement(todo);
            list.appendChild(li);
        });
    }

    function createTodoElement(todo) {
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

        // Добавляем обработчики событий
        const checkbox = li.querySelector('input[type="checkbox"]');
        const deleteBtn = li.querySelector('.delete-btn');
        const editBtn = li.querySelector('.edit-btn');

        checkbox.addEventListener('change', () => toggleTodoComplete(todo._id, checkbox.checked));
        deleteBtn.addEventListener('click', () => deleteTodo(todo._id));
        editBtn.addEventListener('click', () => editTodo(todo));

        return li;
    }

    function editTodo(todo) {
        currentMode = 'edit';
        currentEditId = todo._id;

        // Заполняем форму данными задачи
        document.getElementById('todo-input').value = todo.title;
        document.getElementById('todo-description').value = todo.description || '';
        document.getElementById('todo-category').value = todo.category;
        document.getElementById('todo-priority').value = todo.priority;
        document.getElementById('todo-due-date').value = todo.dueDate ?
            new Date(todo.dueDate).toISOString().split('T')[0] : '';

        submitBtn.textContent = 'Update Task';
        modal.style.display = 'block';
        document.getElementById('todo-input').focus();
    }

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
});