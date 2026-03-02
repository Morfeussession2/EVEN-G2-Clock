import { clockModel, AppState } from "../model/clockModel";

export class AnimationPresenter {
    async playSplash() {
        console.log("Animation disabled. Moving to MENU.");
        clockModel.state = AppState.MENU;
    }
}

export const animationPresenter = new AnimationPresenter();
