import { toast } from "sonner";

const base = {
  duration: 4000,
  closeButton: true,
  position: "top-right" as const,
};

export const eveToast = {
  success(message: string, description?: string) {
    toast.success(message, {
      ...base,
      description,
      classNames: {
        toast: "!bg-eve-teal-light !text-eve-teal !border-eve-teal/20",
        title: "!text-eve-teal !font-medium",
        description: "!text-eve-teal/80",
        closeButton:
          "!bg-eve-teal-light !text-eve-teal !border-eve-teal/30 hover:!bg-eve-teal hover:!text-white",
      },
    });
  },
  error(message: string, description?: string) {
    toast.error(message, {
      ...base,
      description,
      classNames: {
        toast: "!bg-eve-rose-light !text-eve-rose !border-eve-rose/20",
        title: "!text-eve-rose !font-medium",
        description: "!text-eve-rose/80",
        closeButton:
          "!bg-eve-rose-light !text-eve-rose !border-eve-rose/30 hover:!bg-eve-rose hover:!text-white",
      },
    });
  },
  info(message: string, description?: string) {
    toast(message, {
      ...base,
      description,
      classNames: {
        toast: "!bg-eve-teal-light !text-eve-teal !border-eve-teal/20",
        title: "!text-eve-teal !font-medium",
        description: "!text-eve-teal/80",
        closeButton:
          "!bg-eve-teal-light !text-eve-teal !border-eve-teal/30 hover:!bg-eve-teal hover:!text-white",
      },
    });
  },
};
