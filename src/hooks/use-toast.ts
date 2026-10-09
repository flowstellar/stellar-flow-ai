import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";
import { describe, expect, it } from "vitest";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const TOAST_LIMIT_EXPORTED = TOAST_LIMIT;

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };

export type { Action, State, ToasterToast };

describe("use-toast reducer", () => {
  it("ADD_TOAST prepends and truncates to TOAST_LIMIT", () => {
    const first = { id: "1", title: "first", open: true };
    const second = { id: "2", title: "second", open: true };
    const state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast: first });
    const next = reducer(state, { type: "ADD_TOAST", toast: second });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe("2");
  });

  it("UPDATE_TOAST merges only matching id and preserves other fields", () => {
    const state = {
      toasts: [
        { id: "1", title: "one", description: "keep", open: true },
        { id: "2", title: "two", description: "keep2", open: true },
      ],
    };
    const next = reducer(state, {
      type: "UPDATE_TOAST",
      toast: { id: "1", title: "updated" },
    });
    expect(next.toasts[0]).toEqual({
      id: "1",
      title: "updated",
      description: "keep",
      open: true,
    });
    expect(next.toasts[1]).toEqual(state.toasts[1]);
  });

  it("DISMISS_TOAST with no toastId sets open false on every toast", () => {
    const state = {
      toasts: [
        { id: "1", open: true },
        { id: "2", open: true },
      ],
    };
    const next = reducer(state, { type: "DISMISS_TOAST" });
    expect(next.toasts.every((t) => t.open === false)).toBe(true);
  });

  it("DISMISS_TOAST with toastId only dismisses that toast", () => {
    const state = {
      toasts: [
        { id: "1", open: true },
        { id: "2", open: true },
      ],
    };
    const next = reducer(state, { type: "DISMISS_TOAST", toastId: "1" });
    expect(next.toasts[0].open).toBe(false);
    expect(next.toasts[1].open).toBe(true);
  });

  it("REMOVE_TOAST with no toastId clears all toasts", () => {
    const state = { toasts: [{ id: "1", open: true }] };
    const next = reducer(state, { type: "REMOVE_TOAST" });
    expect(next.toasts).toEqual([]);
  });

  it("REMOVE_TOAST with toastId removes only that toast", () => {
    const state = {
      toasts: [
        { id: "1", open: true },
        { id: "2", open: true },
      ],
    };
    const next = reducer(state, { type: "REMOVE_TOAST", toastId: "1" });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe("2");
  });
});