import aiUtils from "../../../../utils/aiUtils.js";

export default class AssistantChat {
    constructor(options) {
        this.options = options;
        this.aiChatWindow = null;
        this.aiMessagesContainer = null;
        this.aiInputField = null;
        this.aiResponsePending = false;
        this.modelSelector = null;
        this.modelSelectorBackdrop = null;
        this.aiContextId = "trollium-ai";
        this.recentModuleToggles = [];
        
        // Set up memory system parameters
        aiUtils.memory.maxMessagesPerContext = this.options["AI Memory Size"];
    }
    
    initialize() {
        this.createAiChatWindow();
        this.updateMemoryIndicator();
        
        // Initialize IntersectionObserver for scroll animations
        this.aiChatWindow.style.display = "none";
        
        return this;
    }
    
    // New method to update options from ClickGUI
    setOptions(options) {
        this.options = options;
        this.update();
    }

    createAiChatWindow() {
        // Create AI chat window
        this.aiChatWindow = document.createElement("div");
        this.aiChatWindow.className = "gui-ai-chat";
        
        // Create header
        const header = document.createElement("div");
        header.className = "gui-ai-header";
        
        // Create header title section
        const headerTitle = document.createElement("div");
        headerTitle.className = "gui-ai-header-title";
        headerTitle.innerHTML = '<span>Trollium Assistant</span>';
        
        // Make the title clickable to expand
        headerTitle.addEventListener("click", (e) => {
            if (!this.aiChatWindow.classList.contains("expanded")) {
                this.toggleAiChat();
            }
        });
        
        header.appendChild(headerTitle);
        
        // Create header controls section
        const headerControls = document.createElement("div");
        headerControls.className = "gui-ai-header-controls";
        headerControls.style.display = "flex";
        headerControls.style.alignItems = "center";
        
        // Add clear memory button in the header controls, before the settings
        const clearMemoryButton = document.createElement("button");
        clearMemoryButton.className = "gui-ai-settings clear-memory-btn";
        clearMemoryButton.innerHTML = '🗑️';
        clearMemoryButton.title = "Clear chat history";
        clearMemoryButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.clearAiMemory();
        });
        headerControls.appendChild(clearMemoryButton);
        
        // Add settings button
        const settingsButton = document.createElement("button");
        settingsButton.className = "gui-ai-settings";
        settingsButton.innerHTML = '<i class="fa fa-cog"></i>';
        settingsButton.title = "Settings";
        settingsButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleModelSelector();
        });
        headerControls.appendChild(settingsButton);
        
        // Add collapse/expand button
        const toggleButton = document.createElement("button");
        toggleButton.className = "gui-ai-toggle";
        toggleButton.innerHTML = "+";
        toggleButton.title = "Expand chat";
        toggleButton.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.toggleAiChat();
        });
        headerControls.appendChild(toggleButton);
        
        header.appendChild(headerControls);
        
        // Make header draggable
        this.makeDraggable(header);
        
        this.aiChatWindow.appendChild(header);
        
        // Create model selector dropdown as a completely separate element
        this.createModelSelector();
        
        // Create content container (holds messages and input)
        const contentContainer = document.createElement("div");
        contentContainer.className = "gui-ai-content";
        this.aiChatWindow.appendChild(contentContainer);
        
        // Create messages container
        this.aiMessagesContainer = document.createElement("div");
        this.aiMessagesContainer.className = "gui-ai-messages";
        contentContainer.appendChild(this.aiMessagesContainer);
        
        // Create input area
        const inputContainer = document.createElement("div");
        inputContainer.className = "gui-ai-input-container";
        contentContainer.appendChild(inputContainer);
        
        // Create input field
        this.aiInputField = document.createElement("input");
        this.aiInputField.className = "gui-ai-input";
        this.aiInputField.placeholder = "Ask Trollium Assistant...";
        this.aiInputField.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !this.aiResponsePending) {
                this.sendAiMessage(this.aiInputField.value);
            }
        });
        inputContainer.appendChild(this.aiInputField);
        
        // Create send button
        const sendButton = document.createElement("button");
        sendButton.className = "gui-ai-send";
        sendButton.innerHTML = "Send";
        sendButton.addEventListener("click", () => {
            if (!this.aiResponsePending) {
                this.sendAiMessage(this.aiInputField.value);
            }
        });
        inputContainer.appendChild(sendButton);
        
        // Store reference to content elements
        this.aiContent = contentContainer;
        this.toggleButton = toggleButton;
        
        // Make the chat window resizable
        this.makeResizable(this.aiChatWindow);
        
        // Add chat window to body
        document.body.appendChild(this.aiChatWindow);
    }
    
    // Create a separate method for the model selector to keep code organized
    createModelSelector() {
        // Create model selector as a separate element outside the chat window
        const modelSelector = document.createElement("div");
        modelSelector.className = "gui-ai-model-selector";
        
        // Add header to model selector
        const modelHeader = document.createElement("div");
        modelHeader.className = "gui-ai-model-selector-header";
        modelHeader.textContent = "Select AI Model";
        modelSelector.appendChild(modelHeader);
        
        // Create scrollable container for model options
        const modelOptionsContainer = document.createElement("div");
        modelOptionsContainer.className = "gui-ai-model-options-container";
        
        // Categorize models by speed/performance
        const models = [
            // Fast models
            { 
                id: "gemini-2.0-flash-lite", 
                name: "Trollium Lite", 
                speed: "Fastest",
                category: "speed",
                description: "Best for quick responses and simple tasks. Extremely fast with minimal delay."
            },
            { 
                id: "gemini-2.0-flash", 
                name: "Trollium Flash", 
                speed: "Fast",
                category: "speed",
                description: "Recommended for most tasks. Good balance of speed and quality."
            },
            // Balanced models
            { 
                id: "gemini-1.5-flash", 
                name: "Trollium Classic", 
                speed: "Balanced",
                category: "balanced",
                description: "Reliable performance for general use with consistent responses."
            },
            { 
                id: "gemini-1.5-flash-8b", 
                name: "Trollium 8b", 
                speed: "Compact",
                category: "balanced",
                description: "Lightweight model for basic tasks and lower resource usage."
            },
            // Advanced models
            { 
                id: "gemini-1.5-pro", 
                name: "Trollium Pro", 
                speed: "Advanced",
                category: "advanced",
                description: "More advanced capabilities. Better for complex tasks and detailed responses."
            },
            { 
                id: "gemini-2.0-pro-exp-02-05", 
                name: "Trollium Pro+", 
                speed: "Enhanced",
                category: "advanced",
                description: "Professional-grade model with superior reasoning abilities for complex queries."
            },
            { 
                id: "gemini-2.0-flash-thinking-exp-01-21", 
                name: "Trollium Thinking", 
                speed: "Expert",
                category: "advanced",
                description: "Most advanced model with deep reasoning capabilities. Best for complex tasks requiring detailed analysis."
            }
        ];
        
        // Group models by category for better organization
        const categories = {
            "speed": { label: "Speed-Optimized Models", models: [] },
            "balanced": { label: "Balanced Models", models: [] },
            "advanced": { label: "Advanced Models", models: [] }
        };
        
        // Organize models into categories
        models.forEach(model => {
            if (categories[model.category]) {
                categories[model.category].models.push(model);
            }
        });
        
        // Add each category and its models
        Object.values(categories).forEach(category => {
            if (category.models.length > 0) {
                // Add category header
                const categoryHeader = document.createElement("div");
                categoryHeader.className = "gui-ai-model-category";
                categoryHeader.textContent = category.label;
                modelOptionsContainer.appendChild(categoryHeader);
                
                // Add category models
                category.models.forEach(model => {
                    const modelOption = document.createElement("div");
                    modelOption.className = `gui-ai-model-option ${model.id === this.options["AI Model"] ? "selected" : ""}`;
                    modelOption.dataset.modelId = model.id;
                    modelOption.dataset.category = model.category;
                    
                    // Use a wrapper for perfect centering
                    const optionContentContainer = document.createElement("div");
                    optionContentContainer.className = "gui-ai-model-option-content";
                    
                    // Create container for name and speed indicator
                    const modelLabelContainer = document.createElement("div");
                    modelLabelContainer.className = "gui-ai-model-label-container";
                    
                    // Create model name element
                    const modelLabel = document.createElement("div");
                    modelLabel.className = "gui-ai-model-label";
                    modelLabel.textContent = model.name;
                    
                    // Create speed indicator
                    const modelSpeed = document.createElement("div");
                    modelSpeed.className = `gui-ai-model-speed ${model.category}`;
                    modelSpeed.textContent = model.speed;
                    
                    // Assemble the elements
                    modelLabelContainer.appendChild(modelLabel);
                    modelLabelContainer.appendChild(modelSpeed);
                    
                    // Add tooltip with description
                    const tooltip = document.createElement("div");
                    tooltip.className = "gui-ai-model-tooltip";
                    tooltip.textContent = model.description;
                    modelOption.appendChild(tooltip);
                    
                    // Build the option content
                    optionContentContainer.appendChild(modelLabelContainer);
                    
                    // Add the content container to the option
                    modelOption.appendChild(optionContentContainer);
                    
                    // Add click handler
                    modelOption.addEventListener("click", () => {
                        this.selectModel(model.id, model.name);
                        
                        // Update all options UI
                        modelOptionsContainer.querySelectorAll(".gui-ai-model-option").forEach(opt => {
                            opt.classList.toggle("selected", opt.dataset.modelId === model.id);
                        });
                    });
                    
                    modelOptionsContainer.appendChild(modelOption);
                });
            }
        });
        
        modelSelector.appendChild(modelOptionsContainer);
        
        // Add close button to the header
        const closeButton = document.createElement("button");
        closeButton.className = "gui-ai-model-close";
        closeButton.innerHTML = "×";
        closeButton.title = "Close";
        closeButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.hideModelSelector();
        });
        modelHeader.appendChild(closeButton);
        
        // Make the model selector draggable
        this.makeDraggable(modelHeader);
        
        // Add the model selector to the document body (not inside the chat window)
        document.body.appendChild(modelSelector);
        this.modelSelector = modelSelector;
        
        // Hide it initially
        modelSelector.style.display = "none";
    }
    
    toggleAiChat() {
        // Toggle expanded state
        const isExpanded = this.aiChatWindow.classList.toggle("expanded");
        
        if (isExpanded) {
            this.toggleButton.innerHTML = "−";
            this.toggleButton.title = "Collapse chat";
            
            // Add welcome message if this is the first expansion
            if (this.aiMessagesContainer.children.length === 0) {
                this.addAiMessage("system", "Welcome to Trollium Assistant. How can I help you?");
                
                // Add memory status message if enabled
                if (this.options["AI Memory Enabled"]) {
                    this.addAiMessage("system", "Memory system is active. Your conversation will be remembered.");
                }
            }
            
            // Update memory indicator
            this.updateMemoryIndicator();
            
            // Focus the input field with a slight delay to let animation complete
            setTimeout(() => {
                this.aiInputField.focus();
            }, 300);
            
            // Apply animation to make the window appear smoothly
            this.aiChatWindow.style.animation = 'chat-appear 0.5s var(--spring-easing) forwards';
        } else {
            this.toggleButton.innerHTML = "+";
            this.toggleButton.title = "Expand chat";
            
            // Hide model selector if visible
            this.hideModelSelector();
            
            // Reset dimensions to default
            this.aiChatWindow.style.width = "320px";
            this.aiChatWindow.style.height = "50px";
        }
    }
    
    updateMemoryIndicator() {
        // Find or create the memory indicator
        let memoryIndicator = this.aiChatWindow.querySelector('.memory-enabled-indicator');
        const headerTitle = this.aiChatWindow.querySelector('.gui-ai-header-title span');
        
        if (!memoryIndicator && headerTitle) {
            memoryIndicator = document.createElement('span');
            memoryIndicator.className = 'memory-enabled-indicator';
            headerTitle.parentNode.insertBefore(memoryIndicator, headerTitle);
        }
        
        // Show/hide based on memory status
        if (memoryIndicator) {
            if (this.options["AI Memory Enabled"]) {
                memoryIndicator.style.display = 'inline-block';
                memoryIndicator.title = `Memory active (${this.options["AI Memory Size"]} messages)`;
            } else {
                memoryIndicator.style.display = 'none';
            }
        }
    }
    
    toggleModelSelector() {
        // If already visible, hide it
        if (this.modelSelector.style.display === "block") {
            this.hideModelSelector();
            return;
        }
        
        // Ensure the chat is expanded
        if (!this.aiChatWindow.classList.contains("expanded")) {
            this.toggleAiChat();
            
            // Delay showing the model selector to prevent issues with the chat expanding animation
            setTimeout(() => {
                this.showModelSelector();
            }, 400);
            return;
        }
        
        this.showModelSelector();
    }
    
    showModelSelector() {
        // Position the model selector relative to the chat window
        const chatRect = this.aiChatWindow.getBoundingClientRect();
        
        // Fixed size that looks good and accommodates all options
        const modelSelectorWidth = 450;
        const modelSelectorHeight = 400;
        
        // Center the model selector over the chat window
        const leftPosition = chatRect.left + (chatRect.width / 2) - (modelSelectorWidth / 2);
        const topPosition = chatRect.top + (chatRect.height / 2) - (modelSelectorHeight / 2);
        
        // Ensure it stays within viewport bounds
        const adjustedLeft = Math.max(10, Math.min(leftPosition, window.innerWidth - modelSelectorWidth - 10));
        const adjustedTop = Math.max(10, Math.min(topPosition, window.innerHeight - modelSelectorHeight - 10));
        
        // Apply the position and size
        this.modelSelector.style.left = `${adjustedLeft}px`;
        this.modelSelector.style.top = `${adjustedTop}px`;
        this.modelSelector.style.width = `${modelSelectorWidth}px`;
        this.modelSelector.style.height = `${modelSelectorHeight}px`;
        
        // Show with a fade-in effect
        this.modelSelector.style.display = "block";
        this.modelSelector.style.opacity = "0";
        
        // Add a backdrop
        this.createModelSelectorBackdrop();
        
        // Trigger animation
        requestAnimationFrame(() => {
            this.modelSelector.style.opacity = "1";
        });
    }
    
    hideModelSelector() {
        // Hide with fade-out effect
        if (this.modelSelector) {
            this.modelSelector.style.opacity = "0";
            
            // Remove the backdrop
            this.removeModelSelectorBackdrop();
            
            // Hide after animation completes
            setTimeout(() => {
                this.modelSelector.style.display = "none";
            }, 200);
        }
    }
    
    createModelSelectorBackdrop() {
        // Create a semi-transparent backdrop to focus attention on the selector
        if (!this.modelSelectorBackdrop) {
            const backdrop = document.createElement("div");
            backdrop.className = "gui-ai-model-backdrop";
            backdrop.style.position = "fixed";
            backdrop.style.top = "0";
            backdrop.style.left = "0";
            backdrop.style.width = "100%";
            backdrop.style.height = "100%";
            backdrop.style.background = "rgba(0, 0, 0, 0.5)";
            backdrop.style.zIndex = "999998";  // Just below the model selector
            backdrop.style.opacity = "0";
            backdrop.style.transition = "opacity 0.2s ease";
            
            // Close selector when clicking outside
            backdrop.addEventListener("click", () => {
                this.hideModelSelector();
            });
            
            document.body.appendChild(backdrop);
            this.modelSelectorBackdrop = backdrop;
        }
        
        // Show the backdrop with animation
        this.modelSelectorBackdrop.style.display = "block";
        requestAnimationFrame(() => {
            this.modelSelectorBackdrop.style.opacity = "1";
        });
    }
    
    removeModelSelectorBackdrop() {
        if (this.modelSelectorBackdrop) {
            this.modelSelectorBackdrop.style.opacity = "0";
            setTimeout(() => {
                this.modelSelectorBackdrop.style.display = "none";
            }, 200);
        }
    }
    
    selectModel(modelId, modelName) {
        // Update option
        this.options["AI Model"] = modelId;
        
        // Hide model selector
        this.hideModelSelector();
        
        // Add system message about model change - use friendly name
        this.addAiMessage("system", `Model changed to ${modelName}`);
    }
    
    async sendAiMessage(message) {
        if (!message.trim()) return;
        
        // Ensure the chat is expanded
        if (!this.aiChatWindow.classList.contains("expanded")) {
            this.toggleAiChat();
        }
        
        // Add user message
        this.addAiMessage("user", message);
        
        // Clear input
        this.aiInputField.value = "";
        
        // Show typing indicator
        this.aiResponsePending = true;
        const typingIndicator = this.addAiMessage("assistant", "<div class='typing-indicator'><span></span><span></span><span></span></div>");
        
        try {
            // Build context based on recent module toggles
            let contextPrompt = message;
            if (this.recentModuleToggles.length > 0) {
                contextPrompt = `Recently enabled modules: ${this.recentModuleToggles.join(", ")}\n\nUser question: ${message}`;
            }
            
            // Call AI API with memory system
            const response = await aiUtils.callGeminiApi(contextPrompt, {
                apiKey: this.options["AI API Key"],
                model: this.options["AI Model"],
                fallbackModel: "gemini-1.5-flash",
                maxTokens: 800,
                temperature: 0.7,
                systemPrompt: this.options["AI System Prompt"],
                contextId: this.aiContextId,
                useMemory: this.options["AI Memory Enabled"]
            });
            
            // Remove typing indicator
            if (typingIndicator && typingIndicator.parentNode) {
                this.aiMessagesContainer.removeChild(typingIndicator);
            }
            
            // Add AI response
            this.addAiMessage("assistant", response);
        } catch (error) {
            console.error("AI Error:", error);
            
            // Remove typing indicator
            if (typingIndicator && typingIndicator.parentNode) {
                this.aiMessagesContainer.removeChild(typingIndicator);
            }
            
            // Add error message
            this.addAiMessage("error", `Error: ${error.message}`);
        } finally {
            this.aiResponsePending = false;
        }
    }
    
    addAiMessage(type, content) {
        const messageElement = document.createElement("div");
        messageElement.className = `gui-ai-message ${type}`;
        
        if (type === "system" || type === "error") {
            messageElement.innerHTML = `<span>${content}</span>`;
        } else {
            messageElement.innerHTML = `<span>${content}</span>`;
        }
        
        this.aiMessagesContainer.appendChild(messageElement);
        this.aiMessagesContainer.scrollTop = this.aiMessagesContainer.scrollHeight;
        
        return messageElement;
    }
    
    clearAiMemory() {
        // Count messages before clearing
        const messageCount = aiUtils.memory.getMessages(this.aiContextId).length;
        
        // Clear memory
        aiUtils.memory.clearContext(this.aiContextId);
        
        // Clear UI
        if (this.aiMessagesContainer) {
            while (this.aiMessagesContainer.firstChild) {
                this.aiMessagesContainer.removeChild(this.aiMessagesContainer.firstChild);
            }
        }
        
        // Add system message with count of cleared messages
        if (messageCount > 0) {
            this.addAiMessage("system", `Memory cleared (${messageCount} messages removed)`);
        } else {
            this.addAiMessage("system", "No messages to clear");
        }
        
        // Re-initialize the context with system prompt
        if (this.options["AI System Prompt"]) {
            aiUtils.memory.setSystemPrompt(this.aiContextId, this.options["AI System Prompt"]);
        }
        
        // Update memory indicator
        this.updateMemoryIndicator();
    }
    
    show() {
        if (this.aiChatWindow) {
            this.aiChatWindow.style.display = "block";
            
            // Apply animation when showing through ClickGUI
            if (document.body.classList.contains("with-animations")) {
                this.aiChatWindow.style.animation = 'chat-appear 0.5s var(--spring-easing) forwards';
            }
        }
    }
    
    hide() {
        if (this.aiChatWindow) {
            this.aiChatWindow.style.display = "none";
            
            // Also hide model selector if it's open
            this.hideModelSelector();
        }
    }
    
    update() {
        // Update memory settings if changed
        aiUtils.memory.maxMessagesPerContext = this.options["AI Memory Size"];
        
        // Update system prompt if changed
        if (this.options["AI System Prompt"]) {
            aiUtils.memory.setSystemPrompt(this.aiContextId, this.options["AI System Prompt"]);
        }
        
        // Update memory indicator
        if (this.aiChatWindow && this.aiChatWindow.classList.contains("expanded")) {
            this.updateMemoryIndicator();
        }
    }
    
    // Add a module toggle to the recent list
    addModuleToggle(moduleName) {
        // Add to recent toggles
        this.recentModuleToggles.unshift(moduleName);
        
        // Keep only the 5 most recent toggles
        if (this.recentModuleToggles.length > 5) {
            this.recentModuleToggles.pop();
        }
    }
    
    // Helper method to make an element draggable
    makeDraggable(headerElement) {
        let isDragging = false;
        let offsetX, offsetY;
        let dragStartX, dragStartY;
        const dragThreshold = 5; // Minimum pixel movement to consider as a drag

        headerElement.addEventListener("mousedown", (e) => {
            // Only handle left mouse button
            if (e.button !== 0) return;
            
            // Store initial position for threshold check
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            
            // Mark as potentially dragging but don't start yet
            isDragging = false;
            offsetX = e.clientX - headerElement.parentElement.getBoundingClientRect().left;
            offsetY = e.clientY - headerElement.parentElement.getBoundingClientRect().top;
            headerElement.style.cursor = "grabbing";
            
            // Prevent text selection during drag
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (dragStartX === undefined) return;
            
            // Check if we've moved beyond the threshold
            const deltaX = Math.abs(e.clientX - dragStartX);
            const deltaY = Math.abs(e.clientY - dragStartY);
            
            // If we exceed the threshold, start dragging
            if (!isDragging && (deltaX > dragThreshold || deltaY > dragThreshold)) {
                isDragging = true;
            }
            
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            const maxX = window.innerWidth - headerElement.parentElement.offsetWidth;
            const maxY = window.innerHeight - headerElement.parentElement.offsetHeight;
            
            headerElement.parentElement.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
            headerElement.parentElement.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
        });

        document.addEventListener("mouseup", (e) => {
            // Reset state
            isDragging = false;
            dragStartX = undefined;
            dragStartY = undefined;
            headerElement.style.cursor = "grab";
        });
    }

    // Add resizing functionality for the chat window
    makeResizable(element) {
        const resizeHandle = document.createElement("div");
        resizeHandle.className = "gui-ai-resize-handle";
        element.appendChild(resizeHandle);
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        resizeHandle.addEventListener("mousedown", (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener("mousemove", (e) => {
            if (!isResizing) return;
            
            const width = startWidth + (e.clientX - startX);
            const height = startHeight + (e.clientY - startY);
            
            // Set minimum sizes
            const minWidth = 320;
            const minHeight = element.classList.contains("expanded") ? 300 : 50;
            
            if (width > minWidth) {
                element.style.width = `${width}px`;
                // If model selector is visible, update its width too
                if (this.modelSelector && this.modelSelector.classList.contains("visible")) {
                    this.modelSelector.style.width = `${width}px`;
                }
            }
            
            if (height > minHeight && element.classList.contains("expanded")) {
                element.style.height = `${height}px`;
            }
        });
        
        document.addEventListener("mouseup", () => {
            isResizing = false;
        });
    }
} 