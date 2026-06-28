import { TUTORIAL_VERSIONS } from "../constants";
import { saveMeta } from "../platform/save";
import { activeTutorialAtom, gameStateAtom, store } from "../store";
import type { SaveData, TutorialId } from "../types";

function shouldShowTutorial(
    tutorial: TutorialId,
    save: SaveData
) {
    return (
        (save.meta.seenTutorials[tutorial] ?? 0) <
            TUTORIAL_VERSIONS[tutorial]
    );
}

export function tryShowTutorial(
    id: TutorialId,
    save: SaveData
) {
    if (!shouldShowTutorial(id, save)) {
        return;
    }

    store.set(activeTutorialAtom, id);

    store.get(gameStateAtom).context?.get("*").forEach(obj => obj.paused = true);

    save.meta.seenTutorials[id] =
        TUTORIAL_VERSIONS[id];

    saveMeta(save.meta);
}