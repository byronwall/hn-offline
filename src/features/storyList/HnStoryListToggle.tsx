import { useReadItemsStore } from "~/contexts/AppDataContext";

export function HnStoryListToggle() {
  const readItemsStore = useReadItemsStore();

  const toggleHideReadItems = () => {
    readItemsStore.setReadSettings(
      "shouldHideReadItems",
      !readItemsStore.readSettings.shouldHideReadItems
    );
  };

  return (
    <div class="flex items-center gap-2 pt-8">
      <label class="inline-flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={readItemsStore.readSettings.shouldHideReadItems}
          onChange={toggleHideReadItems}
          class="peer sr-only"
        />

        <div class="peer relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-orange-600 peer-focus:ring-4 peer-focus:ring-orange-300 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-orange-800" />

        <span>
          {readItemsStore.readSettings.shouldHideReadItems
            ? "Hiding read items (click to show)"
            : "Showing read items (click to hide)"}
        </span>
      </label>
    </div>
  );
}
