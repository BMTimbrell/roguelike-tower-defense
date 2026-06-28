export {};

declare global {
    interface Window {
        platform?: {
            isDesktop: boolean;
            saveGame(data: string): Promise<void>;
            loadGame(): Promise<string | null>;
            quitGame: () => void;
            setFullscreen(isFullscreen: boolean): void;
            isFullscreen(): boolean;
            openExternal(url: string): void;
        };
    }
}