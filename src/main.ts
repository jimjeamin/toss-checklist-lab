import "../styles.css";
import { createShareMessage, loadTasks, saveTasks, type Task } from "./domain/checklist";
import { shareMode, sharePort } from "./platform/share";

const list = document.querySelector<HTMLUListElement>("#task-list")!;
const form = document.querySelector<HTMLFormElement>("#add-form")!;
const input = document.querySelector<HTMLInputElement>("#new-task")!;
const emptyState = document.querySelector<HTMLParagraphElement>("#empty-state")!;
const progressLabel = document.querySelector<HTMLElement>("#progress-label")!;
const progressBar = document.querySelector<HTMLElement>("#progress-bar")!;
const remainingLabel = document.querySelector<HTMLElement>("#remaining-label")!;
const shareButton = document.querySelector<HTMLButtonElement>("#share-list")!;
const statusMessage = document.querySelector<HTMLElement>("#status-message")!;
const statusDot = document.querySelector<HTMLElement>("#status-dot")!;
const sharePreview = document.querySelector<HTMLDialogElement>("#share-preview")!;
const sharePreviewMessage = document.querySelector<HTMLElement>("#share-preview-message")!;

let tasks: Task[] = loadTasks();
let currentFilter: "all" | "active" | "done" = "all";

function render() {
  list.replaceChildren();
  const visibleTasks = tasks.filter((task) => currentFilter === "all"
    || (currentFilter === "active" && !task.done)
    || (currentFilter === "done" && task.done));

  for (const task of visibleTasks) {
    const item = document.createElement("li");
    item.className = `task-item${task.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.className = "task-check";
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `${task.text} 완료`);
    checkbox.addEventListener("change", () => updateTask(task.id, { done: checkbox.checked }));

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "삭제";
    remove.setAttribute("aria-label", `${task.text} 삭제`);
    remove.addEventListener("click", () => {
      tasks = tasks.filter((candidate) => candidate.id !== task.id);
      persistAndRender();
    });

    item.append(checkbox, text, remove);
    list.append(item);
  }

  const completed = tasks.filter((task) => task.done).length;
  const remaining = tasks.length - completed;
  progressLabel.textContent = `${completed} / ${tasks.length} 완료`;
  progressBar.style.width = tasks.length ? `${Math.round((completed / tasks.length) * 100)}%` : "0%";
  remainingLabel.textContent = tasks.length === 0
    ? "할 일을 추가해 오늘을 시작해요."
    : remaining === 0 ? "모두 해냈어요. 오늘도 수고했어요!" : `${remaining}개의 할 일이 남았어요.`;
  document.querySelector("#all-count")!.textContent = String(tasks.length);
  document.querySelector("#active-count")!.textContent = String(remaining);
  document.querySelector("#done-count")!.textContent = String(completed);
  emptyState.hidden = visibleTasks.length > 0;
  emptyState.innerHTML = tasks.length === 0
    ? "아직 항목이 없어요.<br />오늘 할 일을 하나 추가해볼까요?"
    : currentFilter === "active" ? "남은 할 일이 없어요.<br />멋지게 마무리했네요!" : "완료한 항목이 아직 없어요.";
}

function updateTask(id: string, changes: Partial<Task>) {
  tasks = tasks.map((task) => task.id === id ? { ...task, ...changes } : task);
  persistAndRender();
}

function persistAndRender() {
  saveTasks(tasks);
  render();
}

function setStatus(message: string, state: "ready" | "error" | "default" = "default") {
  statusMessage.textContent = message;
  statusDot.classList.toggle("is-ready", state === "ready");
  statusDot.classList.toggle("is-error", state === "error");
}

async function shareChecklist() {
  shareButton.disabled = true;
  try {
    const result = await sharePort.sendMessage(createShareMessage(tasks));
    if (result.mode === "mock") {
      sharePreviewMessage.textContent = result.message;
      sharePreview.showModal();
      setStatus("모의 SDK가 공유 호출과 메시지를 확인했어요.", "ready");
    } else {
      setStatus("토스 SDK 공유 호출을 완료했어요.", "ready");
    }
  } catch (error) {
    console.error("체크리스트 공유 실패", error);
    setStatus("SDK 공유에 실패했어요. 토스 앱과 브리지 설정을 확인해 주세요.", "error");
  } finally {
    shareButton.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  tasks.unshift({ id: crypto.randomUUID(), text, done: false });
  persistAndRender();
  form.reset();
  input.focus();
});

document.querySelector<HTMLButtonElement>("#clear-done")!.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  persistAndRender();
});

document.querySelectorAll<HTMLButtonElement>(".filter-tab").forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter as "all" | "active" | "done";
    document.querySelectorAll<HTMLButtonElement>(".filter-tab").forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
    render();
  });
});

document.querySelector<HTMLButtonElement>("#close-share-preview")!.addEventListener("click", () => sharePreview.close());
shareButton.addEventListener("click", shareChecklist);

document.querySelector<HTMLElement>("#today-date")!.textContent = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "long", day: "numeric", weekday: "long",
}).format(new Date());

setStatus(shareMode === "mock" ? "로컬 모의 모드 · 실제 토스 호출은 하지 않아요." : "SDK 모드 · 토스 앱 브리지가 필요해요.");
render();
