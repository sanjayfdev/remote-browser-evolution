import { create } from "zustand";

const useBrowserStore = create((set) => ({
  activeTab: 0,
  url: "http://localhost:3000/viewer/",
  toggle: true,
  capturedEvents: [],
  caseIdCounter: 0,
  cases: [],

  // functions
  setCaptureEvents: (events) => {
    set((state) => ({ capturedEvents: [...state.capturedEvents, events] }));
    console.log(events);
  },
  setToggle: () => set((state) => ({ toggle: !state.toggle })),
  setUrl: (url) =>
    set(async () => {
      if (!url) return;
      try {
        const res = await fetch("http://localhost:3000/start-browser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          throw new Error("Failed to start browser");
        }

        const data = await res.json();
        console.log("Browser started:", data);
      } catch (err) {
        console.error("Failed to start browser:", err);
      }
    }),
  setCases: (newCase) => {
    set((state) => ({ caseIdCounter: state.caseIdCounter + 1 }));
    set((state) => ({
      cases: [...state.cases, { ...newCase, id: state.caseIdCounter }],
    }));
    console.log(newCase);
    set((state) => ({ activeTab: state.caseIdCounter }));
  },

  deleteCases: (id) => {
    set((state) => {
      console.log(state.activeTab);
      const updatedCases = state.cases.filter((c) => c.id !== id);
      let newActive = state.activeTab;
      if (state.activeTab === id && updatedCases.length > 0) {
        const remainingTabs = state.cases.filter((tab) => tab.id !== id);
        newActive = updatedCases[remainingTabs.length - 1].id;
      }
      return { cases: updatedCases, activeTab: newActive };
    });
  },

  deleteSteps: (caseId, stepId) => {
    set((state) => {
      const updatedCases = state.cases.map((c) => {
        if (caseId === c.id) {
          const updatedSteps = c.steps.filter((s) => stepId !== s.id);
          console.log(updatedSteps);
          return {
            ...c,
            steps: updatedSteps,
          };
        }
        return c;
      });
      console.log(updatedCases);
      return { cases: updatedCases };
    });
  },

  addSteps: (caseId) => {
    console.log(caseId);
    set((state) => {
      const updatedCases = state.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              steps: [
                ...c.steps,
                {
                  id: Date.now(),
                  value: "",
                  message: "",
                  placeholder: "Enter Step",
                },
              ],
            }
          : c
      );
      return { cases: updatedCases };
    });
  },

  stepChange: (e, caseId, stepId) => {
    set((state) => {
      const value = e.target.value;

      const updatedCases = state.cases.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            steps: c.steps.map((s) => {
              if (s.id === stepId) {
                return {
                  ...s,
                  value: value,
                };
              }
              return s;
            }),
          };
        }
        return c;
      });

      return { cases: updatedCases };
    });
  },

  setSteps: (newSteps) => {
    console.log(newSteps.id);
    set((state) => {
      const updatedCases = state.cases.map((c) => {
        if (c.id === state.activeTab) {
          return {
            ...c,
            steps: [...c.steps, newSteps],
          };
        }
        return c;
      });

      return {
        cases: updatedCases,
      };
    });
  },

  addTab: (title = "New Tab") => {
    const newId = Date.now();
    set((state) => ({
      tabs: [
        ...state.tabs,
        {
          id: newId,
          title,
          history: title !== "about:blank" ? [title] : [],
          historyIndex: title !== "about:blank" ? 0 : -1,
          scroll: 0,
        },
      ],
      activeTab: newId,
    }));
  },

  closeTab: (id) => {
    set((state) => {
      const remaining = state.tabs.filter((t) => t.id !== id);
      let newActive = state.activeTab;
      if (state.activeTab === id && remaining.length > 0) {
        const remainingTabs = state.tabs.filter((tab) => tab.id !== id);
        newActive = remaining[remainingTabs.length - 1].id;
      }
      return { tabs: remaining, activeTab: newActive };
    });
  },

  setActiveTab: (id) => set({ activeTab: id }),
}));

export default useBrowserStore;
