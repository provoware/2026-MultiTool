export function createWorkspaceMutationGuard() {
  let active = false;

  return {
    tryBegin() {
      if (active) return false;
      active = true;
      return true;
    },
    end() {
      active = false;
    },
    isActive() {
      return active;
    },
  };
}
