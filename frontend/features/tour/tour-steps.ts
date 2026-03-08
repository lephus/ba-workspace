import type { DriveStep } from "driver.js";

export function getProjectsTourSteps(t: (key: string) => string): DriveStep[] {
  return [
    {
      element: "[data-tour='page-header']",
      popover: {
        title: t("step1Title"),
        description: t("step1Desc"),
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    {
      element: "[data-tour='create-project']",
      popover: {
        title: t("step2Title"),
        description: t("step2Desc"),
        side: "left" as const,
        align: "center" as const,
      },
    },
    {
      element: "[data-tour='project-row']",
      popover: {
        title: t("step3Title"),
        description: t("step3Desc"),
        side: "bottom" as const,
        align: "center" as const,
      },
    },
    {
      element: "[data-tour='project-actions']",
      popover: {
        title: t("step4Title"),
        description: t("step4Desc"),
        side: "left" as const,
        align: "center" as const,
      },
    },
    {
      element: "[data-tour='api-keys']",
      popover: {
        title: t("step5Title"),
        description: t("step5Desc"),
        side: "bottom" as const,
        align: "end" as const,
      },
    },
  ];
}

export function getConversationTourSteps(
  t: (key: string) => string,
): DriveStep[] {
  return [
    {
      element: "[data-tour='conversation-sidebar']",
      popover: {
        title: t("step6Title"),
        description: t("step6Desc"),
        side: "right" as const,
        align: "start" as const,
      },
    },
    {
      element: "[data-tour='new-conversation']",
      popover: {
        title: t("step7Title"),
        description: t("step7Desc"),
        side: "bottom" as const,
        align: "center" as const,
      },
    },
    {
      element: "[data-tour='documents-icon']",
      popover: {
        title: t("step8Title"),
        description: t("step8Desc"),
        side: "bottom" as const,
        align: "center" as const,
      },
    },
    {
      element: "[data-tour='quick-actions']",
      popover: {
        title: t("step9Title"),
        description: t("step9Desc"),
        side: "top" as const,
        align: "center" as const,
      },
    },
    {
      element: "[data-tour='chat-input-area']",
      popover: {
        title: t("step10Title"),
        description: t("step10Desc"),
        side: "top" as const,
        align: "center" as const,
      },
    },
  ];
}
