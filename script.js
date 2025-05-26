document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const micButton = document.getElementById('mic-button');
    const fileInput = document.getElementById('file-input');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const themeToggle = document.getElementById('theme-toggle');

    // API setup
    const API_KEY = "AIzaSyA6o_YFO9bSp-_rCWZVN2TGHZ-B3z-RvcU";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    let recognition = null;
    let isListening = false;

    // Theme management
    const toggleTheme = () => {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        html.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeToggle.textContent = isDark ? '🌞' : '🌙';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '🌞';
    themeToggle.addEventListener('click', toggleTheme);

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
    }

    // Enhanced custom responses with more personality
    const customResponses = {
        'vaibhav lakhera': 'vaibhav lakhera — a passionate fourth-year student with a love for creating cool and impactful mobile apps using Flutter. Always curious about how things work behind the scenes, he is  currently exploring the core fundamentals of computer science. As a dedicated full stack developer, Ayush thrives on tackling challenges and seizing every opportunity to grow and build something meaningful."',
        'who is vaibhav lakhera': 'vaibhav lakhera — a passionate fourth-year student with a love for creating cool and impactful mobile apps using Flutter. Always curious about how things work behind the scenes, he is  currently exploring the core fundamentals of computer science. As a dedicated full stack developer, Ayush thrives on tackling challenges and seizing every opportunity to grow and build something meaningful."',
        'tell me something about vaibhav lakhera': 'vaibhav lakhera — a passionate fourth-year student with a love for creating cool and impactful mobile apps using Flutter. Always curious about how things work behind the scenes, he is  currently exploring the core fundamentals of computer science. As a dedicated full stack developer, Ayush thrives on tackling challenges and seizing every opportunity to grow and build something meaningful."',
        'who created you': "I was created by Utkarsh Dimri . I'm designed to be helpful, friendly, and efficient! you can visit his linedin profile at ",
        'what is your name': "I'm DeepShiva! Nice to meet you! I'm an AI assistant who loves helping people with their questions and tasks.",
        'what can you do': "I'm quite versatile! I can chat with you, answer questions, process voice commands, handle images, and even adjust my appearance with dark/light mode. I'm particularly good at explaining things and helping with various tasks. Want to try something specific?",
        'tell me about yourself': "I'm DeepShiva, a friendly AI assistant created by Utkarsh Dimri with a passion for helping people! I love learning from our conversations and adapting to better serve your needs. I can communicate through text or voice, and I'm always excited to tackle new challenges!",
        'how do you work': "I use a combination of advanced AI technology (specifically the Gemini API) and custom programming to understand and respond to your queries. I can process text, voice, and images, and I have special knowledge about certain topics. I'm constantly learning and improving!",
        'are you human': "No, I'm not human - I'm an AI assistant named Bolt! While I can understand and respond to your questions, I'm a computer program designed to be helpful and friendly.",
        'your purpose': "My purpose is to assist users like you! Whether it's answering questions, helping with tasks, or just having a friendly chat, I'm here to make your experience better.",
        'your favorite': "As an AI, I don't have personal favorites, but I do enjoy our conversations and helping users solve problems!",
        'are you real': "I'm a real AI assistant, but not a real person. I'm a sophisticated computer program designed to help and interact with users like yourself!",
        'where are you from': "I'm an AI assistant created by Utkarsh Dimri, but I exist in the digital world to help users wherever they are!",
    };

    function updateStatus(status, color) {
        statusDot.style.backgroundColor = color;
        statusText.textContent = status;
    }

    function formatTime() {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(new Date());
    }

    function addThinkingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot thinking';
        messageDiv.id = 'thinking-indicator';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = 'Thinking';
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }

    function removeThinkingIndicator() {
        const indicator = document.getElementById('thinking-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    function addMessage(content, isUser = false, isImage = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (isImage) {
            const img = document.createElement('img');
            img.src = content;
            img.style.maxWidth = '200px';
            img.style.borderRadius = '0.5rem';
            messageContent.appendChild(img);
        } else {
            messageContent.textContent = content;
        }

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = formatTime();

        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function generateBotResponse(text) {
        // Check for custom responses first
        const lowerText = text.toLowerCase();
        for (const [key, value] of Object.entries(customResponses)) {
            if (lowerText.includes(key)) {
                return value;
            }
        }

        // If no custom response matches, use the API
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{
                    parts: [{text: text}]
                }]
            })
        };

        try {
            const response = await fetch(API_URL, requestOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || 'Unknown error occurred');
            }

            if (data.candidates && data.candidates.length > 0 && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts.length > 0) {
                
                const apiResponseText = data.candidates[0].content.parts[0].text
                    .replace(/\*\*(.*?)\*\*/g, "$1")
                    .trim();
                
                return apiResponseText;
            } else {
                return generateFallbackResponse(text);
            }
        } catch (error) {
            console.error('API Error:', error);
            return generateFallbackResponse(text);
        }
    }

    function generateFallbackResponse(text) {
        text = text.toLowerCase();
        
        if (text.includes('hello') || text.includes('hi')) {
            return "Hello! I'm Bolt, and I'm here to help! How can I assist you today?";
        } else if (text.includes('how are you')) {
            return "I'm doing great, thank you for asking! I'm always excited to help. What can I do for you?";
        } else if (text.includes('weather')) {
            return "While I can't check the weather directly, I can tell you that I'm always sunny and cheerful! For actual weather info, you might want to check your local weather service.";
        } else if (text.includes('help')) {
            return "I'd be happy to help! You can ask me about myself, request assistance with tasks, or just chat. I'm particularly good at explaining things and can handle both text and voice input!";
        } else if (text.includes('bye') || text.includes('goodbye')) {
            return "Goodbye! It was great chatting with you. Come back anytime if you need help!";
        } else {
            return `I understand you said: "${text}". Would you like to know more about what I can do? Just ask about my capabilities!`;
        }
    }

    async function handleUserInput(text) {
        if (!text.trim()) return;

        addMessage(text, true);
        userInput.value = '';

        updateStatus('Thinking...', '#fbbf24');
        const thinkingIndicator = addThinkingIndicator();

        try {
            const response = await generateBotResponse(text);
            removeThinkingIndicator();
            addMessage(response);
        } catch (error) {
            removeThinkingIndicator();
            addMessage(`Sorry, I encountered an error: ${error.message}. Please try again later.`);
            console.error('Error:', error);
        } finally {
            updateStatus('Ready', '#22c55e');
        }
    }

    // Event Listeners
    sendButton.addEventListener('click', () => {
        handleUserInput(userInput.value);
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput(userInput.value);
        }
    });

    if (recognition) {
        micButton.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                isListening = false;
                micButton.style.backgroundColor = '';
                updateStatus('Ready', '#22c55e');
            } else {
                recognition.start();
                isListening = true;
                micButton.style.backgroundColor = '#ef4444';
                updateStatus('Listening...', '#ef4444');
            }
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            handleUserInput(transcript);
        };

        recognition.onend = () => {
            isListening = false;
            micButton.style.backgroundColor = '';
            updateStatus('Ready', '#22c55e');
        };
    } else {
        micButton.style.display = 'none';
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    addMessage('📷 Image uploaded:', true);
                    addMessage(e.target.result, false, true);
                    addMessage("I see you've shared an image with me. While I can display it, I don't have image recognition capabilities in this version.");
                };
                reader.readAsDataURL(file);
            } else {
                addMessage('Please upload only image files.');
            }
            fileInput.value = '';
        }
    });

    // Initial setup
    updateStatus('Ready', '#22c55e');
});