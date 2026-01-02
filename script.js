// Configuration
const API_BASE_URL = 'https://chatbot-ai-vyff.onrender.com/api';
// 'http://localhost:8000/api';

// Global state
let currentAgent = null;
let currentConversationId = null;
let isTyping = false;
let developerMode = false;
let viewerMode = false;
let viewerConversationId = null;

// DOM elements
const agentsList = document.getElementById('agents-list');
const conversationsList = document.getElementById('conversations-list');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const statusText = document.getElementById('status-text');
const typingIndicator = document.getElementById('typing-indicator');
const currentAgentName = document.getElementById('current-agent-name');
const currentAgentDesc = document.getElementById('current-agent-desc');
const refreshAgentsBtn = document.getElementById('refresh-agents');
const refreshConversationsBtn = document.getElementById('refresh-conversations');
const clearChatBtn = document.getElementById('clear-chat');
const toggleThemeBtn = document.getElementById('toggle-theme');
const toggleDeveloperBtn = document.getElementById('toggle-developer');
const backToChatBtn = document.getElementById('back-to-chat');
const conversationSidebar = document.querySelector('.conversation-sidebar');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeViewerMode();
    initializeDeveloperMode();

    if (!viewerMode) {
        loadAgents();
        loadConversations();
        setupMessageInput();
    } else {
        loadViewerConversation();
    }
});

// Setup event listeners
function setupEventListeners() {
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', handleKeyPress);
    refreshAgentsBtn.addEventListener('click', loadAgents);
    refreshConversationsBtn.addEventListener('click', loadConversations);
    clearChatBtn.addEventListener('click', clearChat);
    toggleThemeBtn.addEventListener('click', toggleTheme);
    toggleDeveloperBtn.addEventListener('click', toggleDeveloperMode);
    backToChatBtn.addEventListener('click', () => window.location.href = '/');
}

// Setup message input auto-resize
function setupMessageInput() {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// Handle Enter key in message input
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// API helper functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        showError(`Failed to connect to API: ${error.message}`);
        throw error;
    }
}

// Load agents from API
async function loadAgents() {
    try {
        showLoading(agentsList);
        const data = await apiRequest('/agents?active_only=true');
        displayAgents(data);
    } catch (error) {
        console.error('Failed to load agents:', error);
        showError('Failed to load agents');
    } finally {
        hideLoading(agentsList);
    }
}

// Display agents in the sidebar
function displayAgents(agents) {
    agentsList.innerHTML = '';

    if (agents.length === 0) {
        agentsList.innerHTML = '<p class="no-agents">No active agents found</p>';
        return;
    }

    agents.forEach(agent => {
        const agentElement = createAgentElement(agent);
        agentsList.appendChild(agentElement);
    });
}

// Create agent element
function createAgentElement(agent) {
    const agentDiv = document.createElement('div');
    agentDiv.className = 'agent-item';
    agentDiv.dataset.agentId = agent.id;

    agentDiv.innerHTML = `
        <div class="agent-avatar" style="background-color: ${agent.color || '#3b82f6'}">
            <i class="fas fa-robot"></i>
        </div>
        <div class="agent-info">
            <h4>${agent.display_name}</h4>
            <p>${agent.description || 'AI assistant'}</p>
        </div>
    `;

    agentDiv.addEventListener('click', () => selectAgent(agent));
    return agentDiv;
}

// Select an agent
function selectAgent(agent) {
    currentAgent = agent;

    // Update UI
    document.querySelectorAll('.agent-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-agent-id="${agent.id}"]`).classList.add('active');

    // Update header
    currentAgentName.textContent = agent.display_name;
    currentAgentDesc.textContent = agent.description || 'AI assistant';

    // Enable input
    messageInput.disabled = false;
    sendButton.disabled = false;
    statusText.textContent = 'Ready to chat';

    // Clear current conversation
    clearChat();

    showSuccess(`Selected ${agent.display_name}`);
}

// Load conversations from API
async function loadConversations() {
    try {
        showLoading(conversationsList);
        const data = await apiRequest('/conversations');
        displayConversations(data);
    } catch (error) {
        console.error('Failed to load conversations:', error);
        showError('Failed to load conversations');
    } finally {
        hideLoading(conversationsList);
    }
}

// Display conversations in sidebar
function displayConversations(conversations) {
    conversationsList.innerHTML = '';

    if (conversations.length === 0) {
        conversationsList.innerHTML = '<p class="no-conversations">No conversations yet</p>';
        return;
    }

    conversations.forEach(conversation => {
        const conversationElement = createConversationElement(conversation);
        conversationsList.appendChild(conversationElement);
    });
}

// Create conversation element
function createConversationElement(conversation) {
    const convDiv = document.createElement('div');
    convDiv.className = 'conversation-item';
    convDiv.dataset.conversationId = conversation.id;

    const date = new Date(conversation.created_at).toLocaleDateString();
    const title = conversation.title || `Conversation ${conversation.id}`;

    convDiv.innerHTML = `
        <div class="conversation-title">${title}</div>
        <div class="conversation-meta">
            <span>${conversation.message_count} messages</span>
            <span>${date}</span>
        </div>
    `;

    convDiv.addEventListener('click', () => {
        window.location.href = `/conversations/${conversation.id}`;
    });
    return convDiv;
}

// Load specific conversation
async function loadConversation(conversationId) {
    try {
        const data = await apiRequest(`/conversations/${conversationId}`);
        displayConversation(data);
        currentConversationId = conversationId;
    } catch (error) {
        console.error('Failed to load conversation:', error);
        showError('Failed to load conversation');
    }
}

// Display conversation in chat
function displayConversation(conversation) {
    chatMessages.innerHTML = '';

    conversation.messages.forEach(message => {
        // In viewer mode, show all messages regardless of developer mode
        // In normal mode, only show user and assistant messages unless developer mode is on
        if (viewerMode || developerMode || message.role === 'user' || message.role === 'assistant') {
            addMessageToChat(message.role, message.content);
        }
    });

    // Update header with agent info if available
    if (conversation.agent_name) {
        currentAgentName.textContent = conversation.agent_name;
        currentAgentDesc.textContent = `Conversation #${conversation.id}`;
    }
}

// Send message
async function sendMessage() {
    if (!currentAgent) {
        showError('Please select an agent first');
        return;
    }

    const message = messageInput.value.trim();
    if (!message) {
        console.warn('Attempted to send empty message');
        return;
    }

    console.log('Sending message:', message);

    // Add user message to chat
    addMessageToChat('user', message);
    messageInput.value = '';

    // Reset input height
    messageInput.style.height = 'auto';

    // Show typing indicator
    showTyping();

    try {
        let response;

        // Send message (will start new conversation or continue existing one)
        response = await apiRequest('/chat/conversation', {
            method: 'POST',
            body: JSON.stringify({
                messages: [{ role: 'user', content: message }],
                agent_id: currentAgent.id,
                ...(currentConversationId && { conversation_id: currentConversationId })
            })
        });

        // Set conversation ID if this started a new conversation
        if (!currentConversationId && response.conversation_id) {
            currentConversationId = response.conversation_id;
        }

        // Add assistant response to chat
        addMessageToChat('assistant', response.response);

        // Hide typing indicator
        hideTyping();

        // Update status
        statusText.textContent = `Tokens used: ${response.usage ? response.usage.total_tokens : 'N/A'}`;

        // Reload conversations to show updates
        loadConversations();

    } catch (error) {
        hideTyping();
        console.error('Failed to send message:', error);
        showError('Failed to send message. Please try again.');
        statusText.textContent = 'Error sending message';
    }
}

// Add message to chat UI
function addMessageToChat(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    // Get appropriate icon based on role and developer mode
    let iconClass = 'fa-robot'; // default
    if (role === 'user') {
        iconClass = 'fa-user';
    } else if (role === 'assistant') {
        iconClass = 'fa-robot';
    } else if (role === 'system') {
        iconClass = 'fa-cog';
    } else if (role === 'tool') {
        iconClass = 'fa-wrench';
    } else if (role === 'function') {
        iconClass = 'fa-code';
    }

    // Show role label in developer mode
    const roleLabel = developerMode ? `<div class="message-role">${role}</div>` : '';

    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="message-content">
            ${roleLabel}
            <p>${formatMessage(content)}</p>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format message content (handle markdown-like formatting)
function formatMessage(content) {
    // Simple formatting - you can enhance this
    return content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Show typing indicator
function showTyping() {
    isTyping = true;
    typingIndicator.style.display = 'flex';
    statusText.textContent = 'AI is thinking...';
    messageInput.disabled = true;
    sendButton.disabled = true;
}

// Hide typing indicator
function hideTyping() {
    isTyping = false;
    typingIndicator.style.display = 'none';
    if (currentAgent) {
        messageInput.disabled = false;
        sendButton.disabled = false;
        statusText.textContent = 'Ready to chat';
    }
}

// Clear chat
function clearChat() {
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${currentAgent ? `Start chatting with ${currentAgent.display_name}!` : 'Welcome to the AI Chatbot Platform! Select an agent from the sidebar to start a conversation.'}</p>
            </div>
        </div>
    `;
    currentConversationId = null;
    statusText.textContent = currentAgent ? 'Ready to chat' : 'Select an agent to start chatting';
}

// Toggle theme
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    toggleThemeBtn.innerHTML = newTheme === 'dark' ?
        '<i class="fas fa-sun"></i>' :
        '<i class="fas fa-moon"></i>';

    localStorage.setItem('theme', newTheme);
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    toggleThemeBtn.innerHTML = savedTheme === 'dark' ?
        '<i class="fas fa-sun"></i>' :
        '<i class="fas fa-moon"></i>';
}

// Loading states
function showLoading(element) {
    element.classList.add('loading');
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    element.innerHTML = '';
    element.appendChild(spinner);
}

function hideLoading(element) {
    element.classList.remove('loading');
}

// Error handling
function showError(message) {
    statusText.textContent = message;
    statusText.classList.add('error-message');
    setTimeout(() => {
        statusText.classList.remove('error-message');
        if (!isTyping && currentAgent) {
            statusText.textContent = 'Ready to chat';
        }
    }, 5000);
}

function showSuccess(message) {
    statusText.textContent = message;
    statusText.style.color = 'var(--success-color)';
    setTimeout(() => {
        statusText.style.color = 'var(--text-secondary)';
        if (!isTyping && currentAgent) {
            statusText.textContent = 'Ready to chat';
        }
    }, 3000);
}

// Initialize viewer mode
function initializeViewerMode() {
    const path = window.location.pathname;
    const viewerMatch = path.match(/^\/conversations\/(\d+)$/);

    if (viewerMatch) {
        viewerMode = true;
        viewerConversationId = parseInt(viewerMatch[1]);
        updateViewerModeUI();
    }
}

// Load conversation for viewer mode
async function loadViewerConversation() {
    try {
        const data = await apiRequest(`/conversations/${viewerConversationId}`);
        displayConversation(data);
        currentConversationId = viewerConversationId;

        // Update header
        if (data.agent_name) {
            currentAgentName.textContent = data.agent_name;
            currentAgentDesc.textContent = `Conversation #${data.id}`;
        }
    } catch (error) {
        console.error('Failed to load conversation for viewer:', error);
        showError('Failed to load conversation');
        // Fallback to normal mode if conversation not found
        viewerMode = false;
        updateViewerModeUI();
        loadAgents();
        loadConversations();
        setupMessageInput();
    }
}

// Update UI for viewer mode
function updateViewerModeUI() {
    const agentSidebar = document.querySelector('.sidebar');
    const conversationSidebar = document.querySelector('.conversation-sidebar');
    const chatInputArea = document.querySelector('.chat-input-area');
    const chatActions = document.querySelector('.chat-actions');

    if (viewerMode) {
        // Hide agent sidebar, conversation sidebar, and input area
        if (agentSidebar) agentSidebar.style.display = 'none';
        if (conversationSidebar) conversationSidebar.style.display = 'none';
        if (chatInputArea) chatInputArea.style.display = 'none';

        // Hide developer mode and clear chat buttons in viewer mode, show back button
        const developerBtn = document.getElementById('toggle-developer');
        const clearBtn = document.getElementById('clear-chat');
        const backBtn = document.getElementById('back-to-chat');
        if (developerBtn) developerBtn.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
        if (backBtn) backBtn.style.display = 'inline-flex';

        // Update main container layout for viewer
        const container = document.querySelector('.container');
        if (container) {
            container.classList.add('viewer-mode');
        }
    } else {
        // Show all elements in normal mode
        if (agentSidebar) agentSidebar.style.display = 'flex';
        if (conversationSidebar) conversationSidebar.style.display = developerMode ? 'flex' : 'none';
        if (chatInputArea) chatInputArea.style.display = 'flex';

        // Show buttons
        const developerBtn = document.getElementById('toggle-developer');
        const clearBtn = document.getElementById('clear-chat');
        const backBtn = document.getElementById('back-to-chat');
        if (developerBtn) developerBtn.style.display = 'inline-flex';
        if (clearBtn) clearBtn.style.display = 'inline-flex';
        if (backBtn) backBtn.style.display = 'none';

        // Remove viewer mode class
        const container = document.querySelector('.container');
        if (container) {
            container.classList.remove('viewer-mode');
        }
    }
}

// Initialize developer mode
function initializeDeveloperMode() {
    const savedDeveloperMode = localStorage.getItem('developerMode') === 'true';
    developerMode = savedDeveloperMode;
    updateDeveloperModeUI();
}

// Toggle developer mode with password protection
function toggleDeveloperMode() {
    if (developerMode) {
        // If already in developer mode, disable it
        developerMode = false;
        localStorage.setItem('developerMode', 'false');
        updateDeveloperModeUI();
        showSuccess('Developer mode disabled');
    } else {
        // Prompt for password to enable developer mode
        const password = prompt('Enter developer password:');
        if (password === 'mellon') {
            developerMode = true;
            localStorage.setItem('developerMode', 'true');
            updateDeveloperModeUI();
            showSuccess('Developer mode enabled');
        } else {
            showError('Incorrect password');
        }
    }
}

// Update UI based on developer mode state
function updateDeveloperModeUI() {
    toggleDeveloperBtn.innerHTML = developerMode ?
        '<i class="fas fa-code"></i>' :
        '<i class="fas fa-lock"></i>';

    toggleDeveloperBtn.classList.toggle('active', developerMode);

    // Show/hide conversation sidebar
    if (conversationSidebar) {
        conversationSidebar.style.display = developerMode ? 'flex' : 'none';
    }

    // Reload current conversation to apply message filtering
    if (currentConversationId) {
        loadConversation(currentConversationId);
    }
}

// Initialize theme on load
initializeTheme();

