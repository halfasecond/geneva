import { paths } from "./components/Environment";

interface BoundingBox {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

// Check if position is blocked by river
export const isBlockedByRiver = (box: BoundingBox, rivers: { left: number; top: number; width: number; height: number }[]): boolean => {
    return rivers.some(river => {
        const buffer = 30;
        const riverBox = {
            left: river.left + buffer,
            right: river.left + river.width - buffer,
            top: river.top + buffer,
            bottom: river.top + river.height - buffer
        };
        return !(
            box.left >= riverBox.right ||
            box.right <= riverBox.left ||
            box.top >= riverBox.bottom ||
            box.bottom <= riverBox.top
        );
    });
};

// Check if box overlaps with any path
export const isOnPath = (box: BoundingBox): boolean => {
    return paths.some(path => {
        const buffer = 80;
        const pathBox = {
            left: path.left + buffer,
            right: path.left + path.width - buffer,
            top: path.top + buffer,
            bottom: path.top + path.height - buffer
        };
        return !(
            box.left >= pathBox.right ||
            box.right <= pathBox.left ||
            box.top >= pathBox.bottom ||
            box.bottom <= pathBox.top
        );
    });
};