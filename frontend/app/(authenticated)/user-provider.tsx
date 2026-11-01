"use client";

import { createContext, useContext } from "react";

export type CurrentUser = {
  isAdmin: boolean;
  isActive: boolean;
  name: string;
  email: string;
};

const UserContext = createContext<CurrentUser | null>(null);

export function UserProvider({
  user,
  children,
}: Readonly<{
  user: CurrentUser;
  children: React.ReactNode;
}>) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const user = useContext(UserContext);

  if (!user) {
    throw new Error("useUser must be used within UserProvider");
  }

  return user;
}
