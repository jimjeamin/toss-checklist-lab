export type Task = { id: string; text: string; done: boolean };

const STORAGE_KEY = "toss-checklist-lab-v1";

export function loadTasks(): Task[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((task): task is Task => task && typeof task.id === "string" && typeof task.text === "string" && typeof task.done === "boolean")
      : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function createShareMessage(tasks: Task[]) {
  const completed = tasks.filter((task) => task.done).length;
  const lines = tasks.length
    ? tasks.map((task) => `${task.done ? "✅" : "▫️"} ${task.text}`).join("\n")
    : "아직 등록한 할 일이 없어요.";
  return `오늘의 체크리스트 (${completed}/${tasks.length} 완료)\n\n${lines}`;
}
