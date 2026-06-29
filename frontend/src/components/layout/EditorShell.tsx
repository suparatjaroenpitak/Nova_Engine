import { ReactNode } from 'react';

interface EditorShellProps {
  children?: ReactNode;
}

export default function EditorShell({ children }: EditorShellProps) {
  return <>{children}</>;
}
