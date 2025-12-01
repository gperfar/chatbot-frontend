# AI Chatbot Frontend

A modern, responsive web interface for interacting with the AI Chatbot Platform API.

## Features

- 🎨 **Modern UI**: Clean, responsive design with dark/light theme support
- 🤖 **Agent Selection**: Choose from different AI agents with custom personalities
- 💬 **Real-time Chat**: Send messages and receive AI responses instantly
- 📚 **Conversation History**: View and manage past conversations
- 🎯 **Agent Management**: Visual agent selection with avatars and descriptions
- 📱 **Responsive**: Works on desktop and mobile devices

## Prerequisites

- A running instance of the [AI Chatbot API](../chatbot-ai)
- Modern web browser with JavaScript enabled

## Getting Started

1. **Start the API backend** (see main project README)

2. **Serve the frontend** (choose one option):

   **Option A: Simple file access**
   - Simply open `index.html` in your web browser
   - No server required - works as a static website

   **Option B: Python server (recommended)**
   ```bash
   python3 server.py
   ```
   Then visit http://localhost:8080

3. **Configure API endpoint** (optional):
   - Edit `API_BASE_URL` in `script.js` if your API runs on a different port

## Usage

### Selecting an Agent
- Click on any agent in the left sidebar
- Each agent has a unique personality and expertise
- The chat header shows the selected agent's info

### Chatting
- Type your message in the input field at the bottom
- Press Enter or click the send button
- AI responses appear in real-time
- Typing indicators show when the AI is responding

### Managing Conversations
- View past conversations in the right sidebar
- Click on any conversation to reload it
- Clear current chat to start fresh
- Conversations are automatically saved to the API

### Theme Toggle
- Click the moon/sun icon to switch between light and dark themes
- Theme preference is saved in browser storage

## API Integration

The frontend connects to these API endpoints:

- `GET /api/agents` - Load available agents
- `POST /api/chat/completion` - Send chat messages
- `GET /api/conversations` - Load conversation history
- `GET /api/conversations/{id}` - Load specific conversation

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

## Development

### File Structure
```
chatbot-frontend/
├── index.html      # Main HTML structure
├── styles.css      # CSS styling and themes
├── script.js       # JavaScript functionality
└── README.md       # This file
```

### Customization

**Styling**: Modify `styles.css` to change colors, fonts, and layout

**API Configuration**: Update `API_BASE_URL` in `script.js`

**Features**: Add new functionality in `script.js`

### Adding New Features

The codebase is modular and easy to extend:

- Agent management functions in `loadAgents()`, `displayAgents()`
- Chat functionality in `sendMessage()`, `addMessageToChat()`
- Conversation management in `loadConversations()`, `displayConversations()`

## Troubleshooting

### API Connection Issues
- Ensure the backend API is running on the correct port
- Check browser console for CORS or network errors
- Verify `API_BASE_URL` matches your API location

### Agent Loading Problems
- Check that agents exist in the database
- Verify API endpoints are responding correctly
- Look for JavaScript errors in browser console

### Chat Not Working
- Ensure an agent is selected
- Check API key is configured in backend
- Verify OpenAI service is accessible

## Contributing

1. Test changes with the API backend running
2. Ensure responsive design works on mobile
3. Test both light and dark themes
4. Verify accessibility features

## License

Same as the main project.
