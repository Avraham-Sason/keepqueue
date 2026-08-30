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

export const uploadFileToStorage = async (file: File, filePath: string): Promise<string> => {
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