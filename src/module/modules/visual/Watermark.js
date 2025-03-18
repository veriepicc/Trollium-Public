import Module from "../../module";
import moduleManager from "../../moduleManager";

export default class Watermark extends Module {
    constructor () {
        super("Watermark", "Watermark showing client name.", "Visual", {
            "Text": "Trollium",
            "Color1": "rgb(64, 190, 255)",
            "Color2": "rgb(129, 225, 255)",
            "Gradient": true
        })
        
        this.toggleClickGUI = this.toggleClickGUI.bind(this);
    }

    onSettingUpdate() {
        let watermarkElement = document.querySelector(".trollium-overlay-title");
        if (watermarkElement) {
            this.updateWatermarkColors();
            
            const text = this.options["Text"];
            const textWrapper = document.createElement("div");
            textWrapper.style.display = "flex";
            textWrapper.style.position = "relative";
            
            textWrapper.style.color = this.options["Color1"];
            textWrapper.style.textShadow = `0 0 15px ${this.options["Color2"]}, 0 0 25px ${this.options["Color2"]}, 0 0 35px ${this.options["Color2"]}`;
            
            for (let i = 0; i < text.length; i++) {
                const letterSpan = document.createElement("span");
                letterSpan.textContent = text[i];
                letterSpan.style.display = "inline-block";
                
                letterSpan.style.color = this.options["Color1"];
                letterSpan.style.textShadow = `0 0 15px ${this.options["Color2"]}, 0 0 25px ${this.options["Color2"]}, 0 0 35px ${this.options["Color2"]}`;
                
                if (this.options["Gradient"] === true) {
                    const delay = i * 0.2;
                    letterSpan.style.setProperty('--letter-delay', `${delay}s`);
                    
                    setTimeout(() => {
                        letterSpan.classList.add("rgb-letter");
                    }, 1);
                } else {
                    letterSpan.classList.add("static-letter");
                }
                
                textWrapper.appendChild(letterSpan);
            }
            
            watermarkElement.innerHTML = '';
            watermarkElement.appendChild(textWrapper);
        }
    }
    
    updateWatermarkColors() {
        let color1 = this.options["Color1"];
        let color2 = this.options["Color2"];
        const gradientEnabled = this.options["Gradient"];
        
        let styleSheet = document.getElementById('watermarkColorVars');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'watermarkColorVars';
            document.head.appendChild(styleSheet);
        }
        
        styleSheet.textContent = `
            :root {
                --watermark-color1: ${color1};
                --watermark-color2: ${color2};
            }
            
            .trollium-overlay-title {
                color: ${color1};
                text-shadow: 0 0 15px ${color2}, 0 0 25px ${color2}, 0 0 35px ${color2};
            }
            
            .static-letter {
                color: var(--watermark-color1) !important;
                text-shadow: 
                    0 0 15px var(--watermark-color2),
                    0 0 25px var(--watermark-color2),
                    0 0 35px var(--watermark-color2);
            }
            
            @keyframes rgbFlow {
                0%, 100% {
                    color: var(--watermark-color1);
                    text-shadow: 
                        0 0 15px var(--watermark-color1),
                        0 0 25px var(--watermark-color1),
                        0 0 35px var(--watermark-color1);
                }
                50% {
                    color: var(--watermark-color2);
                    text-shadow: 
                        0 0 15px var(--watermark-color2),
                        0 0 25px var(--watermark-color2),
                        0 0 35px var(--watermark-color2);
                }
            }
            
            .rgb-letter {
                color: var(--watermark-color1);
                text-shadow: 
                    0 0 15px var(--watermark-color1),
                    0 0 25px var(--watermark-color1),
                    0 0 35px var(--watermark-color1);
                animation: none;
                animation: rgbFlow 2s linear infinite;
                animation-delay: var(--letter-delay, 0s);
            }
        `;
    }

    addClickListener() {
        const watermarkElement = document.querySelector(".trollium-overlay-title");
        if (watermarkElement) {
            watermarkElement.style.cursor = "pointer";
            
            watermarkElement.removeEventListener("click", this.toggleClickGUI);

            watermarkElement.addEventListener("click", this.toggleClickGUI);
        }
    }
    
    toggleClickGUI() {
        if (moduleManager.modules["ClickGUI"]) {
            moduleManager.modules["ClickGUI"].toggle();
        }
    }

    onEnable() {
        this.updateWatermarkColors();
        
        let watermarkElement = document.querySelector(".trollium-overlay-title");
        if (!watermarkElement) {
            watermarkElement = document.createElement("div");
            watermarkElement.className = "trollium-overlay-title";
            
            const text = this.options["Text"];
            
            const textWrapper = document.createElement("div");
            textWrapper.style.display = "flex";
            textWrapper.style.position = "relative";
            
            textWrapper.style.color = this.options["Color1"];
            textWrapper.style.textShadow = `0 0 15px ${this.options["Color2"]}, 0 0 25px ${this.options["Color2"]}, 0 0 35px ${this.options["Color2"]}`;
            
            for (let i = 0; i < text.length; i++) {
                const letterSpan = document.createElement("span");
                letterSpan.textContent = text[i];
                letterSpan.style.display = "inline-block";
                
                letterSpan.style.color = this.options["Color1"];
                letterSpan.style.textShadow = `0 0 15px ${this.options["Color2"]}, 0 0 25px ${this.options["Color2"]}, 0 0 35px ${this.options["Color2"]}`;
                
                if (this.options["Gradient"] === true) {
                    const delay = i * 0.2;
                    letterSpan.style.setProperty('--letter-delay', `${delay}s`);
                    letterSpan.classList.add("rgb-letter");
                } else {
                    letterSpan.classList.add("static-letter");
                }
                
                textWrapper.appendChild(letterSpan);
            }
            
            watermarkElement.appendChild(textWrapper);
            
            watermarkElement.style.position = "absolute";
            watermarkElement.style.top = "10px";
            watermarkElement.style.left = "10px";
            watermarkElement.style.padding = "0.4em 0.6em";
            watermarkElement.style.userSelect = "none";
            watermarkElement.style.display = "none";
            watermarkElement.style.zIndex = "1000";
            
            watermarkElement.style.fontFamily = "'Bold Greycliff CF', sans-serif";
            watermarkElement.style.fontSize = "26px";
            watermarkElement.style.fontWeight = "bold";
            
            document.body.appendChild(watermarkElement);
        } else {
            const text = this.options["Text"];
            const textWrapper = document.createElement("div");
            textWrapper.style.display = "flex";
            textWrapper.style.position = "relative";
            
            textWrapper.style.color = this.options["Color1"];
            textWrapper.style.textShadow = `0 0 15px ${this.options["Color2"]}, 0 0 25px ${this.options["Color2"]}, 0 0 35px ${this.options["Color2"]}`;
            
            for (let i = 0; i < text.length; i++) {
                const letterSpan = document.createElement("span");
                letterSpan.textContent = text[i];
                letterSpan.style.display = "inline-block";
                
                letterSpan.style.color = this.options["Color1"];
                letterSpan.style.textShadow = `0 0 15px ${this.options["Color2"]}, 0 0 25px ${this.options["Color2"]}, 0 0 35px ${this.options["Color2"]}`;
                
                if (this.options["Gradient"] === true) {
                    const delay = i * 0.2;
                    letterSpan.style.setProperty('--letter-delay', `${delay}s`);
                    letterSpan.classList.add("rgb-letter");
                } else {
                    letterSpan.classList.add("static-letter");
                }
                
                textWrapper.appendChild(letterSpan);
            }
            
            watermarkElement.innerHTML = '';
            watermarkElement.appendChild(textWrapper);
        }

        document.querySelector(".trollium-overlay-title").style.display = "flex";
        
        this.addClickListener();
    }

    onDisable() {
        document.querySelector(".trollium-overlay-title").style.display = "none";
    }
};