/**
 * Utility for making Gemini API calls
 */

// Memory system to store conversation history by context
const memoryStore = {
    // Format: { contextId: { messages: [{role, content, timestamp}], systemPrompt: "" } }
    contexts: {},
    
    // Maximum number of messages to store per context
    maxMessagesPerContext: 10,
    
    // Add a message to a specific context
    addMessage(contextId, role, content) {
        if (!this.contexts[contextId]) {
            this.initContext(contextId);
        }
        
        // Add message with timestamp
        this.contexts[contextId].messages.push({
            role,
            content,
            timestamp: Date.now()
        });
        
        // Trim to max size (keep the most recent messages)
        if (this.contexts[contextId].messages.length > this.maxMessagesPerContext) {
            this.contexts[contextId].messages = this.contexts[contextId].messages.slice(
                this.contexts[contextId].messages.length - this.maxMessagesPerContext
            );
        }
        
        return this.contexts[contextId].messages;
    },
    
    // Initialize a new context
    initContext(contextId, systemPrompt = "") {
        this.contexts[contextId] = {
            messages: [],
            systemPrompt: systemPrompt
        };
        return this.contexts[contextId];
    },
    
    // Set or update system prompt for a context
    setSystemPrompt(contextId, systemPrompt) {
        if (!this.contexts[contextId]) {
            this.initContext(contextId, systemPrompt);
        } else {
            this.contexts[contextId].systemPrompt = systemPrompt;
        }
        return this.contexts[contextId].systemPrompt;
    },
    
    // Get messages for a context
    getMessages(contextId) {
        return this.contexts[contextId]?.messages || [];
    },
    
    // Get system prompt for a context
    getSystemPrompt(contextId) {
        return this.contexts[contextId]?.systemPrompt || "";
    },
    
    // Clear messages for a context
    clearMessages(contextId) {
        if (this.contexts[contextId]) {
            this.contexts[contextId].messages = [];
        }
    },
    
    // Clear a specific context entirely
    clearContext(contextId) {
        delete this.contexts[contextId];
    },
    
    // Clear all contexts
    clearAllContexts() {
        this.contexts = {};
    },
    
    // Format context history for API call
    formatContextForAPI(contextId, maxTokenEstimate = 1000) {
        const context = this.contexts[contextId];
        if (!context) return { systemPrompt: "", formattedHistory: "" };
        
        const messages = [...context.messages]; // Copy messages to avoid modifying the originals
        const systemPrompt = context.systemPrompt || "";
        
        // Simple token estimation (very rough approximation)
        const estimateTokens = (text) => Math.ceil(text.length / 4);
        
        // Build history from newest to oldest until we hit our token budget
        let tokenCount = 0;
        const relevantMessages = [];
        
        // Process messages from newest to oldest
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const msgTokens = estimateTokens(msg.content);
            
            // If adding this message would exceed our budget, stop
            if (tokenCount + msgTokens > maxTokenEstimate) break;
            
            // Add message to our relevant set
            relevantMessages.unshift(msg);
            tokenCount += msgTokens;
        }
        
        // Format messages into a string the API can use
        let formattedHistory = "";
        if (relevantMessages.length > 0) {
            formattedHistory = relevantMessages.map(msg => 
                `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n\n');
        }
        
        return { systemPrompt, formattedHistory };
    }
};

/**
 * Call the Gemini API with the given prompt, using context from memory system
 * 
 * @param {string} message - The prompt message to send to the API
 * @param {Object} options - Configuration options
 * @param {string} options.apiKey - The Gemini API key
 * @param {string} options.model - The model to use (primary model)
 * @param {string} options.fallbackModel - Fallback model to use if primary fails
 * @param {number} options.maxTokens - Maximum tokens in the response
 * @param {number} options.temperature - Temperature for response generation
 * @param {string} options.systemPrompt - System prompt to prepend to the message
 * @param {string} options.contextId - Identifier for the conversation context
 * @param {boolean} options.useMemory - Whether to use the memory system
 * @returns {Promise<string>} - The generated text response
 */
export async function callGeminiApi(message, options) {
    const {
        apiKey,
        model,
        fallbackModel,
        maxTokens = 800,
        temperature = 0.9,
        systemPrompt = "",
        contextId = "default",
        useMemory = true,
        useFallback = false
    } = options;

    const currentModel = useFallback ? fallbackModel : model;
    const url = `https://generativelanguage.googleapis.com/v1/models/${currentModel}:generateContent?key=${apiKey}`;
    
    // Set up memory context if using memory
    if (useMemory && systemPrompt) {
        memoryStore.setSystemPrompt(contextId, systemPrompt);
    }
    
    // Prepare the message with context if using memory
    let contextualMessage = message;
    if (useMemory) {
        // Add user message to memory
        memoryStore.addMessage(contextId, "user", message);
        
        // Get formatted context
        const { systemPrompt: storedPrompt, formattedHistory } = 
            memoryStore.formatContextForAPI(contextId);
        
        // If we have conversation history, prepend it to the message
        if (formattedHistory) {
            contextualMessage = `Previous conversation:\n${formattedHistory}\n\nCurrent message: ${message}`;
        }
    }
    
    try {
        const effectivePrompt = useMemory ? 
            memoryStore.getSystemPrompt(contextId) : 
            systemPrompt;
            
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: effectivePrompt ? (effectivePrompt + "\n\n" + contextualMessage) : contextualMessage }]
                }
            ],
            generationConfig: {
                temperature: parseFloat(temperature),
                maxOutputTokens: parseInt(maxTokens),
                topP: 0.9,
                topK: 40
            }
        };
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error Details:", errorText);
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                let responseText = candidate.content.parts[0].text;
                
                // Optional sanitization to ensure no backticks or unwanted content
                responseText = responseText.replace(/`+/g, '');
                
                // If using memory, store the response
                if (useMemory) {
                    memoryStore.addMessage(contextId, "assistant", responseText);
                }
                
                return responseText;
            }
        }
        
        console.error("Unexpected API response format:", JSON.stringify(data, null, 2));
        throw new Error("Invalid API response format");
    } catch (error) {
        console.error("Gemini API Error:", error);
        
        // Try fallback model if available and not already using it
        if (!useFallback && fallbackModel && model !== fallbackModel) {
            console.log("Primary model failed. Trying fallback model...");
            return callGeminiApi(message, {
                ...options,
                useFallback: true
            });
        }
        
        let errorMsg = "Failed to get response from AI";
        if (error.message.includes("404")) {
            errorMsg = "API endpoint not found. The model name may be incorrect.";
        } else if (error.message.includes("403")) {
            errorMsg = "API access denied. Your API key may be invalid or restricted.";
        } else if (error.message.includes("429")) {
            errorMsg = "Rate limit exceeded. Please try again later.";
        } else {
            errorMsg = `Error: ${error.message}`;
        }
        
        throw new Error(errorMsg);
    }
}

export default {
    callGeminiApi,
    memory: memoryStore
}; 