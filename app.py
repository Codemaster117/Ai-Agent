from flask import Flask, render_template, redirect, jsonify, request
from datetime import datetime
import os

app = Flask(__name__)

# Configure your AI agents here
AI_AGENTS = [
    {
        'id': 'agent1',
        'name': 'Code Assistant',
        'description': 'Specialized in coding and development tasks',
        'url': 'https://your-agent-1-url.com',
        'icon': '💻',
        'category': 'Development',
        'capabilities': ['coding', 'debugging', 'architecture']
    },
    {
        'id': 'agent2',
        'name': 'Data Analyst',
        'description': 'Analyzes data and generates insights',
        'url': 'https://your-agent-2-url.com',
        'icon': '📊',
        'category': 'Analytics',
        'capabilities': ['analysis', 'visualization', 'reporting']
    },
    {
        'id': 'agent3',
        'name': 'Content Writer',
        'description': 'Creates engaging content and copy',
        'url': 'https://your-agent-3-url.com',
        'icon': '✍️',
        'category': 'Content',
        'capabilities': ['writing', 'editing', 'seo']
    },
    {
        'id': 'agent4',
        'name': 'Research Assistant',
        'description': 'Deep research and information gathering',
        'url': 'https://your-agent-4-url.com',
        'icon': '🔍',
        'category': 'Research',
        'capabilities': ['research', 'summarization', 'fact-checking']
    }
]

# In-memory storage for tasks
tasks = []
task_counter = 0

@app.route('/')
def index():
    return "<h1>¡Funciona perfecto, Alejandro! 🚀 Tu portal está live en Render.</h1><p>Prueba <a href='/sync-mode'>Sync Mode</a> o <a href='/health'>health</a>.</p>"

@app.route('/sync-mode')
def sync_mode():
    return render_template('sync_mode.html', agents=AI_AGENTS)

@app.route('/agent/<agent_id>')
def redirect_to_agent(agent_id):
    agent = next((a for a in AI_AGENTS if a['id'] == agent_id), None)
    if agent:
        return redirect(agent['url'])
    return "Agent not found", 404

# API Routes for task management
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    global task_counter
    data = request.json
    task_counter += 1
    
    task = {
        'id': task_counter,
        'title': data.get('title'),
        'description': data.get('description'),
        'assigned_agents': data.get('assigned_agents', []),
        'subtasks': data.get('subtasks', []),
        'status': 'pending',
        'created_at': datetime.now().isoformat(),
        'completed_at': None
    }
    
    tasks.append(task)
    return jsonify(task), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = next((t for t in tasks if t['id'] == task_id), None)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.json
    task.update(data)
    
    # Auto-complete task if all subtasks are done
    if 'subtasks' in task:
        all_complete = all(st.get('completed', False) for st in task['subtasks'])
        if all_complete and task['status'] != 'completed':
            task['status'] = 'completed'
            task['completed_at'] = datetime.now().isoformat()
    
    return jsonify(task)

@app.route('/api/tasks/<int:task_id>/subtask/<int:subtask_index>', methods=['PUT'])
def update_subtask(task_id, subtask_index):
    task = next((t for t in tasks if t['id'] == task_id), None)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    if subtask_index >= len(task['subtasks']):
        return jsonify({'error': 'Subtask not found'}), 404
    
    data = request.json
    task['subtasks'][subtask_index].update(data)
    
    # Check if all subtasks are complete
    all_complete = all(st.get('completed', False) for st in task['subtasks'])
    if all_complete and task['status'] != 'completed':
        task['status'] = 'completed'
        task['completed_at'] = datetime.now().isoformat()
    
    return jsonify(task)

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    global tasks
    tasks = [t for t in tasks if t['id'] != task_id]
    return jsonify({'success': True})

@app.route('/health')
def health():
    return {'status': 'healthy'}, 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
