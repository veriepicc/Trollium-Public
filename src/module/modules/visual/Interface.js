import Module from "../../module";

export default class Interface extends Module {
    constructor () {
        super("Interface", "Tweak Elements of the UI", "Visual", null)

        this.options = {
            "Hide Lobby": false,
            "Bottom Chat": false,
            "Hide Header": true,
            "Move Effects": true,
            "Hide Bottom Icons": true,
            "Refresh Rate": 2
        }
        
        this.refreshInterval = null;
    }

    get chatElement () {
        return document.getElementsByClassName("Chat")[0];
    }

    get lobbyElement () {
        return document.getElementsByClassName("LobbyNameWrapper")[0];
    }

    get headerElement () {
        return document.querySelector(".InGameHeaderContainer") || 
               document.querySelector(".gameHeader") || 
               document.querySelector(".hud-elem-top");
    }

    get effectInfosWrapper () {
        return document.querySelector(".EffectInfosWrapper");
    }

    get bottomLeftIcons () {
        return document.querySelector(".BottomLeftIcons");
    }

    onEnable () {
        this.applyTweaks();
        
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        const refreshMs = Math.max(1, this.options["Refresh Rate"] || 5) * 1000;
        this.refreshInterval = setInterval(() => {
            this.applyTweaks();
        }, refreshMs);
    }
    
    applyTweaks() {
        const chat = this.chatElement;
        const lobby = this.lobbyElement;
        const header = this.headerElement;
        const effects = this.effectInfosWrapper;
        const bottomIcons = this.bottomLeftIcons;
        
        if (chat?.style && this.options["Bottom Chat"]) {
            chat.style.position = "fixed";
            chat.style.bottom = "10%";
        }

        if (lobby?.style && this.options["Hide Lobby"]) {
            lobby.style.opacity = "0";
        }

        if (header?.style && this.options["Hide Header"]) {
            header.style.display = "none";
        }

        if (effects?.style && this.options["Move Effects"]) {
            effects.style.position = "fixed";
            effects.style.left = "auto";
            effects.style.right = "10px";
        }

        if (bottomIcons?.style && this.options["Hide Bottom Icons"]) {
            bottomIcons.style.display = "none";
        }
    }

    onDisable () {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        const chat = this.chatElement;
        const lobby = this.lobbyElement;
        const header = this.headerElement;
        const effects = this.effectInfosWrapper;
        const bottomIcons = this.bottomLeftIcons;
        
        if (chat?.style && this.options["Bottom Chat"]) {
            chat.style.position = "";
            chat.style.bottom = "";
        }

        if (lobby?.style && this.options["Hide Lobby"]) {
            lobby.style.opacity = "100";
        }

        if (header?.style && this.options["Hide Header"]) {
            header.style.display = "";
        }

        if (effects?.style && this.options["Move Effects"]) {
            effects.style.position = "";
            effects.style.left = "";
            effects.style.right = "";
        }

        if (bottomIcons?.style && this.options["Hide Bottom Icons"]) {
            bottomIcons.style.display = "";
        }
    }

    onSettingUpdate() {
        this.onEnable();
    }

    onGameEntered () {
       
        // IM SO SORRY

        setTimeout(() => {
            this.applyTweaks();
            
            setTimeout(() => {
                this.applyTweaks();
            }, 3000);
        }, 1000);
    }
}; 