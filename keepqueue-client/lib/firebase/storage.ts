import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./connect";

export const getFileUrlFromStorage = async (filePath: string): Promise<string> => {
    try {
        const fileRef = ref(storage, filePath);
        const downloadURL = await getDownloadURL(fileRef);
        return downloadURL;
    } catch (error) {
        console.error(`Error getting file from storage: ${filePath}`, error);
        return "";
    }
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export class FileTooLargeError extends Error {
    constructor(public readonly size: number, public readonly limit: number = MAX_UPLOAD_BYTES) {
        super(`File is ${Math.round(size / 1024)}KB, over the ${Math.round(limit / 1024)}KB limit`);
        this.name = "FileTooLargeError";
    }
}

export const uploadFileToStorage = async (file: File, filePath: string): Promise<string> => {
    if (file.size > MAX_UPLOAD_BYTES) {
        throw new FileTooLargeError(file.size);
    }
    try {
        const fileRef = ref(storage, filePath);
        const uploadResult = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        return downloadURL;
    } catch (error) {
        console.error(`Error uploading file to storage: ${filePath}`, error);
        return "";
    }
};