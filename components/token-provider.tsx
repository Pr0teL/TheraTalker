"use client";
import React, { createContext, useContext, useState } from "react";

type TokensContextType = {
  tokens: number;
  setTokens: (tokens: number) => void;
};

const TokensContext = createContext<TokensContextType | undefined>(undefined);

export const TokensProvider = ({
  initialTokens,
  children,
}: {
  initialTokens: number;
  children: React.ReactNode;
}) => {
  const [tokens, setTokens] = useState(initialTokens);
  return (
    <TokensContext.Provider value={{ tokens, setTokens }}>
      {children}
    </TokensContext.Provider>
  );
};

export const useTokens = () => {
  const context = useContext(TokensContext);
  if (!context) throw new Error("useTokens must be used within TokensProvider");
  return context;
};