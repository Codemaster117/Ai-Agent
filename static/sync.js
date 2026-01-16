// Task Management System
let tasks = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('addSubtask').addEventListener('click', addSubtaskField);
}

// Add subtask input field
function addSubtaskField() {
    const subtaskList = document.getElementById('subtaskList');
    const agentSelect = createAgentSelect();
    
    const subtaskItem = document.createElement('div');
    subtaskItem.className = 'subtask-item';
    subtaskItem.innerHTML = `
        <input type="text" placeholder="Subtask description..." class="subtask-input">
        ${agentSelect}
        <button type="button" onclick="this.parentElement.remove()">✕</button>
    `;
    
    subtaskList.appendChild(subtaskItem);
}

// Create agent select dropdown
function createAgentSelect() {
    const checkboxes = document.querySelectorAll('.agent-checkboxes input[type="checkbox"]');
    let options = '<option value="">Unassigned</option>';
    
    checkboxes.forEach(cb => {
        const label = cb.parentElement.textContent.trim();
        options += `<option value="${cb.value}">${label}</option>`;
    });
    
    return `<select class="subtask-agent-select">${options}</select>`;
}

// Handle task form submission
async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const selectedAgents = Array.from(document.querySelectorAll('.agent-checkboxes input:checked'))
        .map(cb => cb.value);
    
    // Collect subtasks
    const subtaskItems = document.querySelectorAll('.subtask-item');
    const subtasks = Array.from(subtaskItems).map((item, index) => {
        const input = item.querySelector('.subtask-input');
        const select = item.querySelector('.subtask-agent-select');
        return {
            id: index,
            description: input.value,
            agent: select.value || null,
            completed: false
        };
    }).filter(st => st.description.trim() !== '');
    
    // Create task
    const task = {
        title,
        description,
        assigned_agents: selectedAgents,
        subtasks
    };
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        
        if (response.ok) {
            // Reset form
            document.getElementById('taskForm').reset();
            document.getElementById('subtaskList').innerHTML = '';
            
            // Reload tasks
            await loadTasks();
        }
    } catch (error) {
        console.error('Error creating task:', error);
    }
}

// Load all tasks from server
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        tasks = await response.json();
        renderTasks();
        updateStats();
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Render tasks to DOM
function renderTasks() {
    const container = document.getElementById('taskContainer');
    
    if (tasks.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No tasks yet. Create your first task above!</p>';
        return;
    }
    
    container.innerHTML = tasks.map(task => createTaskCard(task)).join('');
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.subtask input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', handleSubtaskToggle);
    });
    
    // Add delete listeners
    document.querySelectorAll('.task-delete').forEach(btn => {
        btn.addEventListener('click', handleTaskDelete);
    });
}

// Create HTML for task card
function createTaskCard(task) {
    const statusClass = task.status.replace(' ', '-');
    const agentNames = getAgentNames(task.assigned_agents);
    
    return `
        <div class="task-card ${task.status === 'completed' ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <span class="task-status ${statusClass}">${task.status}</span>
            </div>
            ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
            ${task.assigned_agents.length > 0 ? `
                <div class="task-agents">
                    ${agentNames.map(name => `<span class="task-agent-badge">${name}</span>`).join('')}
                </div>
            ` : ''}
            ${task.subtasks.length > 0 ? `
                <div class="subtask-list">
                    ${task.subtasks.map((st, idx) => createSubtaskHTML(task.id, st, idx)).join('')}
                </div>
            ` : ''}
            <div class="task-actions">
                <button class="task-delete" data-task-id="${task.id}">Delete Task</button>
            </div>
        </div>
    `;
}

// Create HTML for subtask
function createSubtaskHTML(taskId, subtask, index) {
    const agentName = subtask.agent ? getAgentNames([subtask.agent])[0] : '';
    
    return `
        <div class="subtask ${subtask.completed ? 'completed' : ''}" data-task-id="${taskId}" data-subtask-id="${index}">
            <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
            <span class="subtask-text">${subtask.description}</span>
            ${agentName ? `<span class="subtask-agent">${agentName}</span>` : ''}
        </div>
    `;
}

// Get agent names from IDs
function getAgentNames(agentIds) {
    const agentElements = document.querySelectorAll('.agent-item');
    return agentIds.map(id => {
        const agent = Array.from(agentElements).find(el => el.dataset.agentId === id);
        return agent ? agent.querySelector('.agent-item-name').textContent : id;
    });
}

// Handle subtask checkbox toggle
async function handleSubtaskToggle(e) {
    const subtaskEl = e.target.closest('.subtask');
    const taskId = parseInt(subtaskEl.dataset.taskId);
    const subtaskIndex = parseInt(subtaskEl.dataset.subtaskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.subtasks[subtaskIndex].completed = e.target.checked;
    
    try {
        await fetch(`/api/tasks/${taskId}/subtask/${subtaskIndex}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: e.target.checked })
        });
        
        await loadTasks();
    } catch (error) {
        console.error('Error updating subtask:', error);
    }
}

// Handle task deletion
async function handleTaskDelete(e) {
    const taskId = parseInt(e.target.dataset.taskId);
    
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Update statistics dashboard
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const active = total - completed;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('activeTasks').textContent = active;
    document.getElementById('completedTasks').textContent = completed;
    
    // Calculate overall progress
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    
    tasks.forEach(task => {
        totalSubtasks += task.subtasks.length;
        completedSubtasks += task.subtasks.filter(st => st.completed).length;
    });
    
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
    
    document.getElementById('overallProgress').style.width = `${progress}%`;
    document.getElementById('progressPercent').textContent = `${progress}%`;
}