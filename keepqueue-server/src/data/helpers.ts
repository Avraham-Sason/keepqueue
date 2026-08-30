import { GetCollectionModel } from "./schemes";

export const checkCondition = (item: any, condition: NonNullable<GetCollectionModel["conditions"]>[number]) => {
    const fieldValue = item?.[condition.fieldName];
    const { operator, value } = condition;

    switch (operator) {
        case "==":
            return fieldValue === value;
        case "!=":
            return fieldValue !== value;
        case ">":
            if (typeof value !== "number" || typeof fieldValue !== "number") {
                return false;
            }
            return fieldValue > value;
        case ">=":
            return fieldValue >= value;
        case "<":
            if (typeof value !== "number" || typeof fieldValue !== "number") {
                return false;
            }
            return fieldValue < value;
        case "<=":
            if (typeof value !== "number" || typeof fieldValue !== "number") {
                return false;
            }
            return fieldValue <= value;
        case "in":
            if (!Array.isArray(value)) return false;
            return value.includes(fieldValue);
        case "not-in":
            if (!Array.isArray(value)) return false;
            return !value.includes(fieldValue);
        case "array-contains":
            if (!Array.isArray(fieldValue)) return false;
            return fieldValue.includes(value);
        default:
            return false;
    }
};
