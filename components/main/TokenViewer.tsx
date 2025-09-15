"use client";

import { useTokens } from "../token-provider";

export default function TokenViewer() {
    const { tokens } = useTokens();
    return tokens
}