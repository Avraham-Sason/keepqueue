"use client";
import { useBusinessProxy } from "../hooks";
import BusinessLoading from "../loading";

function BusinessProxy() {
    useBusinessProxy();
    return <BusinessLoading />;
}

export default BusinessProxy;
