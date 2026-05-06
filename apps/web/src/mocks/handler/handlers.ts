import { memoHandlers } from "./memoHandler";
import { sourceHandlers } from "./sourceHandler";

export const handlers = [
    ...sourceHandlers,
    ...memoHandlers,
]