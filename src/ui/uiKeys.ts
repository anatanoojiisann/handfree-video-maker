export function warningKey(projectId: string | undefined, message: string, index: number) {
  return `${projectId || 'project'}-warning-${index}-${message.length}`;
}
