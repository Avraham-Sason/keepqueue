import packageJson from "../package.json";

export const Version = () => {
    return <div className={"fixed z-30 bottom-[0px] text-xs right-0 px-1"}>v{packageJson.version}</div>;
};

