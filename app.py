@app.route('/')
def index():
	return "<h1>¡Sí funciona, Alejandro! Tu app Flask está live en Render. 🚀</h1><p>El problema era el template. Ahora lo arreglamos.</p><a href='/sync-mode'>Ir a Sync Mode</a> | <a href='/health'>Health check</a>"