import { Request, Response, Express, NextFunction } from "express";

export interface StringObject<T = any> {
    [key: string]: T;
}

export type MainRouter = (app: Express) => void;

export type MW = (req: Request, res: Response, next: NextFunction) => void;

export type RouterService = (req: Request, res: Response, next: NextFunction) => void;

export * from "./global";
export * from "./business";
