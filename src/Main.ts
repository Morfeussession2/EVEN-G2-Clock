import { eventHandler } from './presenter/eventPresenter';
import pollingPresenter from './presenter/pollingPresenter';
import { animationPresenter } from './presenter/animationPresenter';
import { webView } from './view/WebView';

async function main() {
    console.log("EvenClock starting...");

    // Initialize interaction handlers
    eventHandler();

    // Initialize Web View
    console.log("Web UI initialized");

    // Start splash animation
    await animationPresenter.playSplash();

    // Start the update loop for the active mode
    pollingPresenter.startPolling();
}

main();
