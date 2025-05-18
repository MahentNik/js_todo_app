document.addEventListener('DOMContentLoaded', () => {
    // ====================== DOM Elements ======================
    const modal = document.getElementById('task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryModal = document.getElementById('category-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const form = document.getElementById('todo-form');
    const categoryForm = document.getElementById('category-form');
    const submitBtn = form.querySelector('.submit-btn');
    const categoryFilter = document.getElementById('category-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const todoGroups = document.querySelector('.todo-groups');

    // ====================== App State ======================
    let currentMode = 'add';
    let currentEditId = null;
    let currentCategoryEdit = null;
    let categories = ['general', 'work', 'personal', 'shopping'];
    const categoryColors = {
        'general': '#5cb85c',
        'work': '#337ab7',
        'personal': '#f0ad4e',
        'shopping': '#d9534f'
    };

    // ====================== Initialization ======================
    initApp();

    function initApp() {
        loadFromLocalStorage();
        setupEventListeners();
        loadTodos();
    }

    function loadFromLocalStorage() {
        const savedCategories = localStorage.getItem('todoCategories');
        const savedColors = localStorage.getItem('categoryColors');

        if (savedCategories) categories = JSON.parse(savedCategories);
        if (savedColors) Object.assign(categoryColors, JSON.parse(savedColors));

        updateCategoryFilters();
    }

    function saveToLocalStorage() {
        localStorage.setItem('todoCategories', JSON.stringify(categories));
        localStorage.setItem('categoryColors', JSON.stringify(categoryColors));
    }

    // ====================== Event Listeners ======================
    function setupEventListeners() {
        // Task Modal
        addTaskBtn.addEventListener('click', openAddTaskModal);

        // Category Modal
        addCategoryBtn.addEventListener('click', openAddCategoryModal);

        // Close Buttons
        closeBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
        window.addEventListener('click', handleOutsideClick);

        // Forms
        form.addEventListener('submit', handleTaskFormSubmit);
        categoryForm.addEventListener('submit', handleCategoryFormSubmit);

        // Filters
        categoryFilter.addEventListener('change', loadTodos);
        priorityFilter.addEventListener('change', loadTodos);
    }

    function handleOutsideClick(e) {
        if (e.target === modal || e.target === categoryModal) {
            closeAllModals();
        }
    }

    // ====================== Modal Functions ======================
    function openAddTaskModal() {
        currentMode = 'add';
        currentEditId = null;
        form.reset();
        submitBtn.textContent = 'Add Task';
        modal.style.display = 'block';
        document.getElementById('todo-input').focus();
    }

    function openAddCategoryModal() {
        currentCategoryEdit = null;
        categoryForm.reset();
        document.getElementById('category-name').value = '';
        document.getElementById('category-color').value = '#5cb85c';
        document.querySelector('#category-form .submit-btn').textContent = 'Create Category';
        categoryModal.style.display = 'block';
        document.getElementById('category-name').focus();
    }

    function openEditCategoryModal(category) {
        currentCategoryEdit = category;
        categoryForm.reset();
        document.getElementById('category-name').value = category;
        document.getElementById('category-color').value = categoryColors[category] || '#5cb85c';
        document.querySelector('#category-form .submit-btn').textContent = 'Update Category';
        categoryModal.style.display = 'block';
        document.getElementById('category-name').focus();
    }

    function closeAllModals() {
        modal.style.display = 'none';
        categoryModal.style.display = 'none';
        form.reset();
        categoryForm.reset();
    }

    // ====================== Category Functions ======================
    function updateCategoryFilters() {
        // Update category filter dropdown
        categoryFilter.innerHTML = `
            <option value="all">All Categories</option>
            ${categories.map(cat => `
                <option value="${cat}">${capitalizeFirstLetter(cat)}</option>
            `).join('')}
        `;

        // Update category select in task form
        const categorySelect = document.getElementById('todo-category');
        categorySelect.innerHTML = categories.map(cat => `
            <option value="${cat}">${capitalizeFirstLetter(cat)}</option>
        `).join('');
    }

    async function handleCategoryFormSubmit(e) {
        e.preventDefault();
        const nameInput = document.getElementById('category-name');
        const name = nameInput.value.trim().toLowerCase();
        const color = document.getElementById('category-color').value;

        if (!name) {
            alert('Category name cannot be empty!');
            return;
        }

        try {
            if (currentCategoryEdit) {
                await handleCategoryUpdate(name, color);
            } else {
                await handleNewCategory(name, color);
            }

            closeAllModals();
            await loadTodos();
        } catch (err) {
            console.error('Category error:', err);
            alert(err.message);
            nameInput.focus();
        }
    }

    async function handleCategoryUpdate(newName, newColor) {
        if (newName !== currentCategoryEdit && categories.includes(newName)) {
            throw new Error('Category already exists!');
        }

        // Update tasks with this category
        if (newName !== currentCategoryEdit) {
            await updateTodosCategory(currentCategoryEdit, newName);
        }

        // Update category data
        const index = categories.indexOf(currentCategoryEdit);
        if (index !== -1) {
            categories[index] = newName;
        }

        categoryColors[newName] = newColor;
        delete categoryColors[currentCategoryEdit];

        saveToLocalStorage();
        updateCategoryFilters();
    }

    async function handleNewCategory(name, color) {
        if (categories.includes(name)) {
            throw new Error('Category already exists!');
        }

        categories.push(name);
        categoryColors[name] = color;

        saveToLocalStorage();
        updateCategoryFilters();
    }

    async function deleteCategory(category) {
        if (category === 'general') return;

        if (!confirm(`Delete category "${capitalizeFirstLetter(category)}"? All tasks will be moved to General.`)) {
            return;
        }

        try {
            // Move tasks to general
            await updateTodosCategory(category, 'general');

            // Remove category
            const index = categories.indexOf(category);
            if (index !== -1) {
                categories.splice(index, 1);
                delete categoryColors[category];
            }

            saveToLocalStorage();
            updateCategoryFilters();
            await loadTodos();
        } catch (err) {
            console.error('Delete category error:', err);
            alert('Failed to delete category. Please try again.');
        }
    }

    async function updateTodosCategory(oldCategory, newCategory) {
        try {
            const response = await fetch('/api/todos/update-category', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldCategory,
                    newCategory
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update tasks category');
            }

            return await response.json();
        } catch (err) {
            console.error('Update tasks category error:', err);
            throw err;
        }
    }

    // ====================== Todo Functions ======================
    async function loadTodos() {
        try {
            const [category, priority] = [categoryFilter.value, priorityFilter.value];
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
            console.error('Load todos error:', err);
            alert('Failed to load tasks. Please try again.');
        }
    }

    function renderTodos(todos) {
        // Clear all todo lists
        todoGroups.innerHTML = '';

        // Create category sections
        categories.forEach(category => {
            createCategorySection(category);
        });

        // Add todos to their categories
        todos.forEach(todo => {
            const list = document.getElementById(`${todo.category}-todos`);
            if (list) {
                list.appendChild(createTodoElement(todo));
            }
        });
    }

    function createCategorySection(category) {
        const section = document.createElement('div');
        section.className = 'todo-category';
        section.dataset.category = category;

        section.innerHTML = `
            <div class="category-header">
                <h2>
                    <span class="category-color" style="background-color: ${categoryColors[category] || '#5cb85c'}"></span>
                    ${capitalizeFirstLetter(category)}
                </h2>
                <div class="category-actions">
                    <button class="edit-category-btn" data-category="${category}">Edit</button>
                    ${category !== 'general' ? `
                        <button class="delete-category-btn" data-category="${category}">Delete</button>
                    ` : ''}
                </div>
            </div>
            <ul class="todo-list" id="${category}-todos"></ul>
        `;

        todoGroups.appendChild(section);

        // Add event listeners to category buttons
        section.querySelector('.edit-category-btn')
            .addEventListener('click', () => openEditCategoryModal(category));

        const deleteBtn = section.querySelector('.delete-category-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteCategory(category));
        }
    }

    function createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = 'todo-item';
        if (todo.completed) li.classList.add('completed');

        const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && !todo.completed;

        li.innerHTML = `
            <div class="todo-item-header">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo._id}">
                <span class="todo-title">${todo.title}</span>
            </div>
            ${todo.description ? `<div class="todo-description">${todo.description}</div>` : ''}
            <div class="todo-meta">
                <span class="todo-priority priority-${todo.priority}">${todo.priority}</span>
                ${dueDate ? `
                    <span class="todo-due-date ${isOverdue ? 'overdue' : ''}">
                        Due: ${dueDate.toLocaleDateString()}
                    </span>
                ` : ''}
            </div>
            <div class="todo-actions">
                <button class="edit-btn" data-id="${todo._id}">Edit</button>
                <button class="delete-btn" data-id="${todo._id}">Delete</button>
            </div>
        `;

        // Add event listeners
        li.querySelector('input[type="checkbox"]')
            .addEventListener('change', (e) => toggleTodoComplete(todo._id, e.target.checked));

        li.querySelector('.delete-btn')
            .addEventListener('click', () => deleteTodo(todo._id));

        li.querySelector('.edit-btn')
            .addEventListener('click', () => editTodo(todo));

        return li;
    }

    async function handleTaskFormSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('todo-input').value.trim();
        if (!title) {
            alert('Task title cannot be empty!');
            return;
        }

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

            closeAllModals();
            await loadTodos();
        } catch (err) {
            console.error('Save task error:', err);
            alert('Failed to save task. Please try again.');
        }
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

    function editTodo(todo) {
        currentMode = 'edit';
        currentEditId = todo._id;

        // Fill form with todo data
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
            console.error('Toggle complete error:', err);
            alert('Failed to update task status. Please try again.');
        }
    }

    async function deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            await loadTodos();
        } catch (err) {
            console.error('Delete todo error:', err);
            alert('Failed to delete task. Please try again.');
        }
    }

    // ====================== Helper Functions ======================
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});